import { useRef, useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon, X } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { Progress } from '@ui/feedback';

/**
 * File upload — one row per file, each with its own fate.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/57-file-upload.html
 *
 * **Every file carries its OWN progress and its OWN error.** One aggregate bar
 * across five uploads tells a user nothing about which one failed.
 *
 * **A failed file stays in the list with a retry** — it is never silently
 * dropped, because a file that vanishes reads as a file that uploaded.
 */

export interface UploadFile {
  readonly id: string;
  readonly name: string;
  /** Bytes. Rendered through `Figure` so sizes cannot diverge. */
  readonly size: number;
  /** 0–100. `undefined` once settled. */
  readonly progress?: number;
  /** Set on failure. The file stays in the list. */
  readonly error?: string;
}

export interface FileUploadProps {
  readonly files: readonly UploadFile[];
  readonly onSelect: (files: FileList) => void;
  readonly onRemove: (id: string) => void;
  readonly onRetry?: (id: string) => void;
  readonly accept?: string;
  readonly multiple?: boolean;
  /** Bytes. Shown in the prompt so the limit is known before the failure. */
  readonly maxSize?: number;
  readonly label: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

export function FileUpload({
  files,
  onSelect,
  onRemove,
  onRetry,
  accept,
  multiple = false,
  maxSize,
  label,
  disabled = false,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className={className}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled && event.dataTransfer.files.length > 0) onSelect(event.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center gap-3 rounded-blade-lg border border-dashed px-6 py-8 text-center',
          'transition-colors duration-fast',
          dragging ? 'border-sky bg-sky-soft' : 'border-line-2 bg-paper-2',
          disabled && 'opacity-[0.42] pointer-events-none',
        )}
      >
        <KoboyoIcon name="upload" size={32} className="text-ink-3" alone />
        <p className="text-sm text-ink-2">Drop {multiple ? 'files' : 'a file'} here, or</p>
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
          Choose {multiple ? 'files' : 'a file'}
        </Button>
        {/* The limit is stated up front, not discovered by failing. */}
        <Show when={maxSize !== undefined}>
          <p className="text-xs text-ink-3">Up to {formatBytes(maxSize ?? 0)} each</p>
        </Show>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          aria-label={label}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files !== null) onSelect(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      <Show when={files.length > 0}>
        <ul className="mt-3 flex flex-col gap-2">
          <Repeat each={[...files]}>
            {(file: UploadFile) => (
              <li
                key={file.id}
                className={cn(
                  'flex items-center gap-3 rounded-blade-sm border px-3 py-2',
                  file.error !== undefined
                    ? 'border-critical-border bg-critical-soft'
                    : 'border-line-2 bg-white',
                )}
              >
                <KoboyoIcon
                  name={file.error !== undefined ? 'error' : 'checklistPaper'}
                  size={17}
                  className={cn('shrink-0', file.error !== undefined ? 'text-critical' : 'text-ink-3')}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                  <Show when={file.error !== undefined}>
                    <p className="text-xs font-extrabold text-critical-onsoft">{file.error}</p>
                  </Show>
                  <Show when={file.error === undefined && file.progress !== undefined}>
                    {/* Its own progress, not a shared one. */}
                    <Progress value={file.progress ?? 0} className="mt-1" />
                  </Show>
                  <Show when={file.error === undefined && file.progress === undefined}>
                    <p className="font-mono text-xs text-ink-3">{formatBytes(file.size)}</p>
                  </Show>
                </div>

                {/* A failed file keeps its retry rather than disappearing. */}
                <Show when={file.error !== undefined && onRetry !== undefined}>
                  <Button variant="secondary" size="sm" onClick={() => onRetry?.(file.id)}>
                    Retry
                  </Button>
                </Show>

                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemove(file.id)}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-round text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              </li>
            )}
          </Repeat>
        </ul>
      </Show>
    </div>
  );
}
