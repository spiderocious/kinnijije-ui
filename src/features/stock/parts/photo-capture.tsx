import { useEffect, useRef, useState } from 'react';

import { Repeat, Show } from 'meemaw';

import { useFileUpload } from '@features/files';
import { jobsApi } from '@features/jobs/services/jobs.api';
import { KoboyoIcon } from '@icons';
import { EP } from '@shared/constants/endpoints';
import { jobPollInterval, PHOTO_CHECK_TIMEOUT_MS } from '@shared/constants/polling';
import { apiClient } from '@shared/services/api-client';
import { cn } from '@shared/utils/cn';

export type PhotoState = 'uploading' | 'checking' | 'usable' | 'rejected' | 'failed';

export interface CheckedPhoto {
  localId: string;
  fileId: string | null;
  previewUrl: string;
  filename: string;
  state: PhotoState;
  /** What it turned out to be, or why it cannot be used. */
  message: string;
  progress: number;
}

interface PhotoCaptureProps {
  readonly max: number;
  readonly onChange: (photos: CheckedPhoto[]) => void;
  readonly accept: string;
  readonly label: string;
  /**
   * What is being photographed.
   *
   * A receipt flow saying "checking this is food" is nonsense — nobody
   * photographed food, they photographed a piece of paper. The wording follows
   * what was actually asked for.
   */
  readonly kind?: 'shelf' | 'receipt';
}

/** The verdict wording, per flow. The same verdict means different things. */
const VERDICT_MESSAGES: Record<'shelf' | 'receipt', Record<string, string>> = {
  shelf: {
    kitchen_scene: 'Good shot — good to read',
    receipt: 'A receipt — good to read',
    food_but_not_useful: 'Food, but nothing to count here',
    not_food: 'Nothing from a kitchen in this one',
    unreadable: 'Too unclear to read',
  },
  receipt: {
    receipt: 'A valid receipt — good to read',
    kitchen_scene: 'This is a photo of food, not a receipt',
    food_but_not_useful: 'This is food, not a receipt',
    not_food: 'This does not look like a receipt',
    unreadable: 'Too unclear to read the lines',
  },
};

const CHECKING_LABEL: Record<'shelf' | 'receipt', string> = {
  shelf: 'Checking this photo…',
  receipt: 'Checking this receipt…',
};

const UNCHECKED_LABEL: Record<'shelf' | 'receipt', string> = {
  shelf: 'Could not check — trying anyway',
  receipt: 'Could not check the receipt — trying anyway',
};

/**
 * Photos, each checked automatically the moment its upload finishes.
 *
 * The check is its own job on a small, cheap model: it answers "is this even
 * food?" before the expensive extraction ever runs. Doing it automatically
 * matters — asking somebody to press a button to find out their selfie is
 * unusable wastes their time and our money.
 *
 * Every photo carries its own state, so one bad shot never blocks the others.
 */
export function PhotoCapture({ max, onChange, accept, label, kind = 'shelf' }: PhotoCaptureProps) {
  const upload = useFileUpload('shelf_photo');
  const fileInput = useRef<HTMLInputElement>(null);
  const [checks, setChecks] = useState<Record<string, { state: PhotoState; message: string }>>({});
  // Which uploads have already been sent for checking, so a re-render cannot
  // queue the same photo twice.
  const checked = useRef(new Set<string>());

  useEffect(() => {
    for (const item of upload.items) {
      if (item.status !== 'ready' || item.file === null) continue;
      if (checked.current.has(item.localId)) continue;
      checked.current.add(item.localId);

      const fileId = item.file.id;
      setChecks((current) => ({
        ...current,
        [item.localId]: { state: 'checking', message: 'checking if this is food…' },
      }));

      void (async () => {
        try {
          const job = await apiClient.post<{ id: string }>(EP.EXTRACTION.CHECK, {
            file_ids: [fileId],
          });

          // Poll this one job on the SHARED backoff. This loop runs once per
          // photo, so five photos meant five concurrent pollers at a fixed
          // 900ms — the single worst source of request volume in the app.
          const startedAt = Date.now();
          const deadline = startedAt + PHOTO_CHECK_TIMEOUT_MS;
          for (;;) {
            await new Promise((resolve) =>
              setTimeout(resolve, jobPollInterval(Date.now() - startedAt)),
            );
            const state = await jobsApi.get(job.id);

            if (state.status === 'succeeded') {
              const result = state.result as {
                photos?: { fileId: string; usable: boolean; verdict: string; reason: string }[];
              } | null;
              const verdict = result?.photos?.find((p) => p.fileId === fileId);

              setChecks((current) => ({
                ...current,
                [item.localId]: verdict?.usable === true
                  ? {
                      state: 'usable',
                      message: VERDICT_MESSAGES[kind][verdict.verdict] ?? 'Good to read',
                    }
                  : {
                      state: 'rejected',
                      // The model's own reason, which is written to be
                      // actionable ("too dark — try with the light on").
                      message:
                        verdict?.reason ??
                        VERDICT_MESSAGES[kind][verdict?.verdict ?? ''] ??
                        'Cannot use this one',
                    },
              }));
              return;
            }

            if (state.is_terminal || Date.now() > deadline) {
              // A failed CHECK is not a failed photo — we simply do not know,
              // so it is let through rather than rejected on a guess.
              setChecks((current) => ({
                ...current,
                [item.localId]: { state: 'usable', message: UNCHECKED_LABEL[kind] },
              }));
              return;
            }
          }
        } catch {
          setChecks((current) => ({
            ...current,
            [item.localId]: { state: 'usable', message: UNCHECKED_LABEL[kind] },
          }));
        }
      })();
    }
  }, [upload.items, kind]);

  // Hand the combined state up on every change.
  useEffect(() => {
    const photos: CheckedPhoto[] = upload.items.map((item) => {
      const check = checks[item.localId];
      const state: PhotoState =
        item.status === 'failed'
          ? 'failed'
          : item.status === 'uploading'
            ? 'uploading'
            : (check?.state ?? 'checking');

      return {
        localId: item.localId,
        fileId: item.file?.id ?? null,
        previewUrl: item.previewUrl,
        filename: item.filename,
        state,
        message:
          state === 'uploading'
            ? `Uploading ${String(Math.round(item.progress * 100))}%`
            : state === 'failed'
              ? (item.error ?? 'Upload failed')
              : (check?.message ?? CHECKING_LABEL[kind]),
        progress: item.progress,
      };
    });
    onChange(photos);
  }, [upload.items, checks, onChange]);

  const atLimit = upload.items.length >= max;

  return (
    <div>
      <input
        ref={fileInput}
        type="file"
        accept={accept}
        capture="environment"
        multiple
        hidden
        onChange={(event) => {
          const picked = Array.from(event.target.files ?? []).slice(0, max - upload.items.length);
          for (const file of picked) void upload.upload(file);
          // Reset so picking the same file again still fires a change.
          event.target.value = '';
        }}
      />

      {/* Two across, not four — each tile has to carry a line of text under it
          and a cramped tile truncates the one thing the person needs to read. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Repeat each={[...upload.items]}>
          {(item: (typeof upload.items)[number]) => {
            const check = checks[item.localId];
            const state: PhotoState =
              item.status === 'failed'
                ? 'failed'
                : item.status === 'uploading'
                  ? 'uploading'
                  : (check?.state ?? 'checking');

            return (
              <figure key={item.localId} className="flex flex-col">
                <div className="relative">
                  <img
                    src={item.previewUrl}
                    alt={item.filename}
                    className={cn(
                      'aspect-square w-full rounded-blade-sm object-cover',
                      state === 'rejected' && 'opacity-50',
                    )}
                  />

                  {/* A real trash button, not a bare × glyph — at 7px of
                      translucent circle over a photograph the old one was
                      almost invisible, so nobody found the way to remove a
                      picture they had just taken by mistake. */}
                  <button
                    type="button"
                    onClick={() => {
                      checked.current.delete(item.localId);
                      upload.remove(item.localId);
                    }}
                    aria-label={`Remove ${item.filename}`}
                    title="Remove this photo"
                    className={cn(
                      'absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full',
                      'border border-line bg-white text-ink shadow-md',
                      'transition-colors hover:bg-critical-soft hover:text-critical-onsoft',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky',
                    )}
                  >
                    <KoboyoIcon name="trash" size={15} alone />
                  </button>

                  <Show when={state === 'uploading'}>
                    <span className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-ink/30">
                      <span
                        className="block h-full bg-sky transition-[width]"
                        style={{ width: `${String(Math.round(item.progress * 100))}%` }}
                      />
                    </span>
                  </Show>
                </div>

                {/* The per-photo verdict, with room to actually read it. */}
                <figcaption className="mt-1.5 flex items-start gap-1.5">
                  <Show when={state === 'checking'}>
                    <KoboyoIcon name="cycle" size={14} className="mt-0.5 shrink-0 animate-spin text-ink-3" alone />
                  </Show>
                  <Show when={state === 'usable'}>
                    <KoboyoIcon name="tick" size={14} className="mt-0.5 shrink-0 text-success-onsoft" alone />
                  </Show>
                  <Show when={state === 'rejected' || state === 'failed'}>
                    <KoboyoIcon name="error" size={14} className="mt-0.5 shrink-0 text-critical-onsoft" alone />
                  </Show>

                  <span
                    className={cn(
                      'text-[11px] leading-snug',
                      state === 'usable' && 'text-success-onsoft',
                      (state === 'rejected' || state === 'failed') && 'text-critical-onsoft',
                      (state === 'checking' || state === 'uploading') && 'text-ink-3',
                    )}
                  >
                    {state === 'uploading'
                      ? `Uploading ${String(Math.round(item.progress * 100))}%`
                      : state === 'failed'
                        ? (item.error ?? 'Upload failed')
                        : (check?.message ?? CHECKING_LABEL[kind])}
                  </span>
                </figcaption>
              </figure>
            );
          }}
        </Repeat>

        <Show when={!atLimit}>
          <button
            type="button"
            onClick={() => {
              fileInput.current?.click();
            }}
            className="grid aspect-square place-items-center rounded-blade-sm border-2 border-dashed border-line text-sm text-ink-3 hover:border-sky hover:text-sky-on"
          >
            <span className="flex flex-col items-center gap-1">
              <KoboyoIcon name="takingPhotoCamera" size={24} alone />
              {label}
            </span>
          </button>
        </Show>
      </div>

      <Show when={atLimit}>
        <p className="mt-2 text-xs text-ink-3">{max} photos at a time is the limit.</p>
      </Show>
    </div>
  );
}
