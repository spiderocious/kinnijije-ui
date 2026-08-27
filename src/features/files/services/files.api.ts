import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

import type { RequestUploadPayload, StoredFile, UploadTicket } from '../types/files.types';

export const filesApi = {
  requestUpload: (payload: RequestUploadPayload): Promise<UploadTicket> =>
    apiClient.post<UploadTicket>(EP.FILES.UPLOAD_URL, payload),

  confirm: (fileId: string): Promise<StoredFile> =>
    apiClient.post<StoredFile>(EP.FILES.CONFIRM(fileId)),

  /**
   * Re-reads a file, which mints a NEW signed url.
   *
   * This is how an expired link is refreshed: ask again. A url held longer than
   * its lifetime is a broken image, so nothing should ever cache one.
   */
  get: (fileId: string): Promise<StoredFile> => apiClient.get<StoredFile>(EP.FILES.DETAIL(fileId)),

  list: (purpose?: string): Promise<StoredFile[]> =>
    apiClient.get<StoredFile[]>(
      purpose === undefined ? EP.FILES.LIST : `${EP.FILES.LIST}?purpose=${purpose}`,
    ),
};

/**
 * Puts the bytes in the bucket.
 *
 * Deliberately a bare `fetch`, NOT `apiClient`: the client attaches an
 * `Authorization` header and a JSON content-type, and both break an S3
 * presigned signature — the signature covers exactly the headers it was
 * created with. This request must carry only what the ticket asked for.
 *
 * XHR rather than fetch because fetch still cannot report upload progress, and
 * a kitchen photo over a phone connection is long enough that a person needs to
 * see something moving.
 */
export function putToStorage(input: {
  url: string;
  file: File;
  headers: Record<string, string>;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', input.url);

    for (const [key, value] of Object.entries(input.headers)) {
      // Content-Length is set by the browser and rejected as unsafe if we try;
      // the signature still matches because the browser sends the real length.
      if (key.toLowerCase() === 'content-length') continue;
      xhr.setRequestHeader(key, value);
    }

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      input.onProgress?.(event.loaded / event.total);
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Upload failed with ${String(xhr.status)}`));
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed — check your connection'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    input.signal?.addEventListener('abort', () => {
      xhr.abort();
    });

    xhr.send(input.file);
  });
}
