import { useState, type KeyboardEvent } from 'react';
import { Repeat, Show } from 'meemaw';

import { BlobThinking, KoboyoIcon, X } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The kitchen basket — the product's signature input.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/53-chip-input.html
 *
 * Ingredients accumulate as chips from three sources — typing, voice, photo —
 * and **the chip carries which source it came from**, because an AI-extracted
 * guess and a typed certainty are not the same claim. A photo guess renders
 * dashed and awaits confirmation; a typed chip is solid.
 *
 * Two rules that are easy to break and expensive when broken:
 *
 * 1. **Existing chips are never cleared by a new extraction.** A failed photo
 *    read must not cost the user the six things they already typed.
 * 2. **Removing the last chip does NOT clear the screen.** The empty state
 *    explains the next step rather than leaving a blank box.
 */

export type ChipSource = 'typed' | 'voice' | 'photo';

export interface ChipItem {
  readonly id: string;
  readonly label: string;
  /** Where this chip came from. Drives the certainty treatment. */
  readonly source: ChipSource;
  /** An AI guess awaiting confirmation. Renders dashed. */
  readonly uncertain?: boolean;
}

const SOURCE_ICON: Record<ChipSource, 'editPencil' | 'mic' | 'takingPhotoCamera'> = {
  typed: 'editPencil',
  voice: 'mic',
  photo: 'takingPhotoCamera',
};

export interface ChipInputProps {
  readonly items: readonly ChipItem[];
  readonly onAdd: (label: string) => void;
  readonly onRemove: (id: string) => void;
  readonly placeholder?: string;
  readonly label: string;
  /** Extraction running. Existing chips stay visible. */
  readonly loading?: boolean;
  /** What is being extracted, for the loading line. */
  readonly loadingLabel?: string;
  /** Extraction failed — typed chips are kept. */
  readonly error?: string;
  /** Basket locked while suggesting. */
  readonly disabled?: boolean;
  readonly className?: string;
}

export function ChipInput({
  items,
  onAdd,
  onRemove,
  placeholder = 'Type, say, or photograph what you have',
  label,
  loading = false,
  loadingLabel = 'Reading your photo…',
  error,
  disabled = false,
  className,
}: ChipInputProps) {
  const [draft, setDraft] = useState('');

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && draft.trim() !== '') {
      event.preventDefault();
      onAdd(draft.trim());
      setDraft('');
      return;
    }
    // Backspace on an empty draft removes the last chip — the expected
    // shorthand in any chip field.
    if (event.key === 'Backspace' && draft === '') {
      const last = items[items.length - 1];
      if (last !== undefined) onRemove(last.id);
    }
  }

  const isEmpty = items.length === 0 && !loading;

  return (
    <div className={className}>
      <div
        className={cn(
          'rounded-blade border-bold bg-white p-3',
          error !== undefined ? 'border-critical' : 'border-ink',
          disabled && 'opacity-[0.42] pointer-events-none',
        )}
      >
        <Show when={!isEmpty}>
          <ul className="mb-3 flex flex-wrap gap-2" aria-label={label}>
            <Repeat each={[...items]}>
              {(item: ChipItem) => (
                <li key={item.id} className="animate-pop">
                  <span
                    className={cn(
                      'inline-flex items-center gap-2 rounded-blade-xs border px-3 py-[6px]',
                      'text-sm font-extrabold',
                      // An AI guess is dashed — a different claim, drawn differently.
                      item.uncertain === true
                        ? 'border-dashed border-grape bg-grape-soft text-grape-onsoft'
                        : 'border-ink bg-paper-2 text-ink',
                    )}
                  >
                    <KoboyoIcon name={SOURCE_ICON[item.source]} size={13} />
                    {item.label}
                    {item.uncertain === true && <span aria-hidden="true">?</span>}
                    <button
                      type="button"
                      aria-label={`Remove ${item.label}`}
                      onClick={() => onRemove(item.id)}
                      className="ml-1 grid h-4 w-4 place-items-center rounded-round hover:bg-ink/10 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </span>
                </li>
              )}
            </Repeat>

            {/* The extraction runs alongside the chips — it never replaces them. */}
            <Show when={loading}>
              <li className="inline-flex items-center gap-2 rounded-blade-xs border border-dashed border-grape bg-grape-soft px-3 py-[6px]">
                <BlobThinking size={18} label={loadingLabel} />
                <span className="text-sm font-extrabold text-grape-onsoft">{loadingLabel}</span>
              </li>
            </Show>
          </ul>
        </Show>

        <input
          type="text"
          aria-label={label}
          value={draft}
          disabled={disabled}
          placeholder={isEmpty ? placeholder : 'Add another…'}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-ctrl font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink-4"
        />
      </div>

      {/* Removing the last chip does not clear the screen — this explains the
          next step instead of leaving a blank box. */}
      <Show when={isEmpty && error === undefined}>
        <div className="mt-3 rounded-blade-sm border border-dashed border-line-2 bg-paper-2 px-4 py-5 text-center">
          <p className="font-display text-md font-extrabold">Your basket is empty</p>
          <p className="mt-1 text-sm text-ink-3">Type, say, or photograph what you have.</p>
        </div>
      </Show>

      <Show when={error !== undefined}>
        <p role="alert" className="mt-2 flex items-center gap-2 text-sm font-extrabold text-critical-onsoft">
          <KoboyoIcon name="error" size={14} />
          {error}
        </p>
      </Show>
    </div>
  );
}
