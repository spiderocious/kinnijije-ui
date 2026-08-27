import { useRef, useState } from 'react';

import { Show } from 'meemaw';

import { useFileUpload } from '@features/files';
import { Combobox } from '@ui/inputs';
import { CaptureMethods, PhotoCapture, type CaptureMethod } from '@ui/capture';

interface KitchenCaptureProps {
  readonly onAdd: (label: string) => void;
  readonly className?: string;
}

/** Accepted straight from a phone camera roll. */
const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/webp,image/heic';

/**
 * The three ways in.
 *
 * Typing works and always will — it is the method that can never be disabled.
 * Photo now genuinely uploads: the shot goes to storage and comes back as a
 * file id, which is the durable thing an extraction will later be pointed at.
 *
 * What photo does NOT do yet is read the picture. Rather than pretend, the
 * panel says so — and the shot is kept, so nothing the cook did is wasted when
 * extraction does land.
 *
 * Voice is switched off at the control rather than shown broken: there is no
 * transcription path yet, and a method that looks live and does nothing is
 * worse than one that says it is not ready.
 */
export function KitchenCapture({ onAdd, className }: KitchenCaptureProps) {
  const [method, setMethod] = useState<CaptureMethod>('type');
  const [query, setQuery] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const upload = useFileUpload('shelf_photo');

  const addFromQuery = (label: string) => {
    onAdd(label);
    setQuery('');
  };

  const shots = upload.items.map((item) => ({
    id: item.localId,
    src: item.previewUrl,
    label:
      item.status === 'uploading'
        ? `Uploading… ${String(Math.round(item.progress * 100))}%`
        : item.status === 'failed'
          ? (item.error ?? 'Upload failed')
          : 'Saved to your kitchen',
  }));

  const firstError = upload.items.find((item) => item.status === 'failed')?.error ?? undefined;

  return (
    <div className={className}>
      <CaptureMethods
        value={method}
        onValueChange={setMethod}
        // Typing can never be disabled — the contract enforces that in types.
        disabled={['voice']}
        className="mb-4"
      />

      <Show when={method === 'type'}>
        <Combobox
          query={query}
          onQueryChange={setQuery}
          onSelect={(option) => {
            addFromQuery(option.label);
          }}
          onCreate={addFromQuery}
          onAbort={() => {
            setQuery('');
          }}
          options={[]}
          label="Add an ingredient"
        />
      </Show>

      <Show when={method === 'photo'}>
        <>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_IMAGES}
            capture="environment"
            multiple
            hidden
            onChange={(event) => {
              const picked = Array.from(event.target.files ?? []);
              for (const file of picked) void upload.upload(file);
              // Reset so picking the same file twice still fires a change.
              event.target.value = '';
            }}
          />

          <PhotoCapture
            shots={shots}
            onCapture={() => {
              fileInput.current?.click();
            }}
            onRemove={upload.remove}
            reading={upload.isUploading}
            {...(firstError !== undefined && { error: firstError })}
          />

          <p className="mt-3 text-sm text-ink-3">
            Your shelf photos are saved, but reading them is not switched on yet — add what you
            have by typing for now.
          </p>
        </>
      </Show>
    </div>
  );
}
