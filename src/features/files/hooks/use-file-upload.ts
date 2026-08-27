import { useCallback, useRef, useState } from 'react';

import { ApiError } from '@shared/services/api-client';

import { filesApi, putToStorage } from '../services/files.api';
import type { FilePurpose, StoredFile } from '../types/files.types';

export interface UploadItem {
  /** Local id, stable from the moment the file is picked. */
  readonly localId: string;
  readonly filename: string;
  /** An object URL, so a thumbnail shows before the upload finishes. */
  readonly previewUrl: string;
  readonly progress: number;
  readonly status: 'uploading' | 'ready' | 'failed';
  /** Set once confirmed — this is what a feature stores and sends onward. */
  readonly file: StoredFile | null;
  readonly error: string | null;
}

let counter = 0;
const nextLocalId = (): string => {
  counter += 1;
  return `upload-${String(counter)}`;
};

/**
 * The three-step upload, as one call.
 *
 *   presign → PUT straight to S3 → confirm
 *
 * A feature calls `upload(file)` and watches `items`; it never has to know the
 * choreography, and — importantly — it gets back a FILE ID rather than raw
 * bytes. That id is the durable thing: it can be re-read later, shown in a
 * gallery, or handed to an extraction call, long after this component is gone.
 */
export function useFileUpload(purpose: FilePurpose) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());

  const patch = useCallback((localId: string, changes: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((item) => (item.localId === localId ? { ...item, ...changes } : item)),
    );
  }, []);

  const upload = useCallback(
    async (file: File): Promise<StoredFile | null> => {
      const localId = nextLocalId();
      const previewUrl = URL.createObjectURL(file);
      const controller = new AbortController();
      controllers.current.set(localId, controller);

      setItems((current) => [
        ...current,
        {
          localId,
          filename: file.name,
          previewUrl,
          progress: 0,
          status: 'uploading',
          file: null,
          error: null,
        },
      ]);

      try {
        const ticket = await filesApi.requestUpload({
          purpose,
          content_type: file.type,
          filename: file.name,
          size_bytes: file.size,
        });

        await putToStorage({
          url: ticket.upload_url,
          file,
          headers: ticket.required_headers,
          signal: controller.signal,
          onProgress: (fraction) => {
            // Held at 99 until confirm returns: the bytes being sent is not
            // the same as the server agreeing they arrived.
            patch(localId, { progress: Math.min(0.99, fraction) });
          },
        });

        const confirmed = await filesApi.confirm(ticket.file.id);
        patch(localId, { progress: 1, status: 'ready', file: confirmed });
        return confirmed;
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Upload failed';
        patch(localId, { status: 'failed', error: message });
        return null;
      } finally {
        controllers.current.delete(localId);
      }
    },
    [purpose, patch],
  );

  const remove = useCallback((localId: string) => {
    controllers.current.get(localId)?.abort();
    controllers.current.delete(localId);

    setItems((current) => {
      const target = current.find((item) => item.localId === localId);
      // Object URLs are held by the browser until explicitly released; dropping
      // the reference without revoking leaks the whole image.
      if (target !== undefined) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.localId !== localId);
    });
  }, []);

  const reset = useCallback(() => {
    setItems((current) => {
      for (const item of current) URL.revokeObjectURL(item.previewUrl);
      return [];
    });
    for (const controller of controllers.current.values()) controller.abort();
    controllers.current.clear();
  }, []);

  return {
    items,
    upload,
    remove,
    reset,
    isUploading: items.some((item) => item.status === 'uploading'),
    readyFiles: items.flatMap((item) => (item.file === null ? [] : [item.file])),
  };
}
