import { useEffect, useRef, useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { Check, ChevronDown, Loader2 } from '@icons';
import { cn } from '@shared/utils/cn';
import { FIELD_SIZE_CLASS, fieldStateClass, type FieldSize, type FieldTriad } from '../field-contract';

/**
 * The plain dropdown — a closed list the user picks from without typing.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/50-select.html
 *
 * **Under about seven options this beats a combobox**, because opening a
 * keyboard to choose from five things is friction. Above seven, use `Combobox`.
 *
 * Same option-list machinery as the combobox, minus the filtering.
 */

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectProps extends FieldTriad {
  readonly value: string | undefined;
  readonly onValueChange: (value: string) => void;
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
  readonly label: string;
  readonly size?: FieldSize;
  /** Fetching options. */
  readonly loading?: boolean;
  /** Failed to load options. */
  readonly loadError?: string;
  readonly className?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Choose…',
  label,
  size = 'md',
  loading = false,
  loadError,
  disabled = false,
  readOnly = false,
  invalid = false,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on an outside click — a dropdown that survives a click elsewhere
  // strands every other control on the screen behind it.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node) === false) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = options.find((option) => option.value === value);
  const locked = disabled || readOnly;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        disabled={locked}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex w-full items-center justify-between gap-2 border bg-white text-left',
          'font-sans font-semibold text-ink outline-none transition-[border-color,box-shadow] duration-[120ms]',
          'hover:border-sky-edge focus-visible:border-sky focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
          'border-line-2 disabled:cursor-not-allowed',
          FIELD_SIZE_CLASS[size],
          fieldStateClass({ disabled, readOnly, invalid }),
        )}
      >
        <span className={cn('truncate', selected === undefined && 'font-medium text-ink-4')}>
          {selected?.label ?? placeholder}
        </span>
        {loading ? (
          <Loader2 size={16} className="shrink-0 animate-spin text-ink-3" aria-hidden="true" />
        ) : (
          <ChevronDown
            size={17}
            className={cn('shrink-0 text-ink-3 transition-transform duration-fast', open && 'rotate-180')}
            aria-hidden="true"
          />
        )}
      </button>

      <Show when={open && !locked}>
        <ul
          role="listbox"
          aria-label={label}
          className={cn(
            'absolute left-0 right-0 top-[calc(100%+6px)] z-dropdown max-h-[280px] overflow-y-auto',
            'rounded-blade-sm border-bold border-ink bg-white p-1 shadow-pop',
            'animate-slide-down',
          )}
        >
          <Show when={loadError !== undefined}>
            <li className="px-3 py-3 text-sm font-extrabold text-critical-onsoft">{loadError}</li>
          </Show>

          <Show when={loadError === undefined && options.length === 0}>
            <li className="px-3 py-3 text-sm text-ink-3">No options available</li>
          </Show>

          <Repeat each={[...options]}>
            {(option: SelectOption) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  disabled={option.disabled}
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-blade-xs px-3 py-2 text-left',
                    'text-ctrl font-semibold transition-colors duration-fast',
                    'disabled:opacity-[0.42] disabled:cursor-not-allowed',
                    option.value === value
                      ? 'bg-sky-soft text-sky-on'
                      : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
                  )}
                >
                  {option.label}
                  {option.value === value && <Check size={15} strokeWidth={3} />}
                </button>
              </li>
            )}
          </Repeat>
        </ul>
      </Show>
    </div>
  );
}
