import { useEffect, useRef, useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { Check, ChevronDown, X } from '@icons';
import { cn } from '@shared/utils/cn';
import { fieldStateClass, type FieldTriad } from '../field-contract';
import type { SelectOption } from '../select/select';

/**
 * Multi-select.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/52-multiselect.html
 *
 * **Chips render INSIDE the control, never a list below it.** A separate list
 * makes the control lie about its own height and pushes everything beneath it
 * around as selections change.
 */

export interface MultiSelectProps extends FieldTriad {
  readonly value: readonly string[];
  readonly onValueChange: (value: readonly string[]) => void;
  readonly options: readonly SelectOption[];
  readonly label: string;
  readonly placeholder?: string;
  /** Caps the selection. The control says so when the cap is reached. */
  readonly max?: number;
  readonly className?: string;
}

export function MultiSelect({
  value,
  onValueChange,
  options,
  label,
  placeholder = 'Choose…',
  max,
  disabled = false,
  readOnly = false,
  invalid = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const locked = disabled || readOnly;
  const atMax = max !== undefined && value.length >= max;
  const selected = options.filter((option) => value.includes(option.value));

  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      onValueChange(value.filter((v) => v !== optionValue));
    } else if (!atMax) {
      onValueChange([...value, optionValue]);
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div
        role="button"
        tabIndex={locked ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => !locked && setOpen((c) => !c)}
        onKeyDown={(event) => {
          if (!locked && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setOpen((c) => !c);
          }
        }}
        className={cn(
          'flex min-h-ctrl w-full flex-wrap items-center gap-2 rounded-blade border bg-white px-3 py-2',
          'border-line-2 outline-none transition-[border-color,box-shadow] duration-[120ms]',
          'hover:border-sky-edge focus-visible:border-sky focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
          locked ? 'cursor-default' : 'cursor-pointer',
          fieldStateClass({ disabled, readOnly, invalid }),
        )}
      >
        {/* Chips live in here, which is what keeps the control honest about
            its own height. */}
        <Show when={selected.length === 0}>
          <span className="text-ctrl font-medium text-ink-4">{placeholder}</span>
        </Show>

        <Repeat each={selected}>
          {(option: SelectOption) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-2 rounded-blade-xs border border-ink bg-paper-2 px-2 py-[3px] text-sm font-extrabold"
            >
              {option.label}
              <Show when={!locked}>
                <button
                  type="button"
                  aria-label={`Remove ${option.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle(option.value);
                  }}
                  className="grid h-4 w-4 place-items-center rounded-round hover:bg-ink/10"
                >
                  <X size={11} strokeWidth={3} />
                </button>
              </Show>
            </span>
          )}
        </Repeat>

        <ChevronDown
          size={17}
          aria-hidden="true"
          className={cn('ml-auto shrink-0 text-ink-3 transition-transform duration-fast', open && 'rotate-180')}
        />
      </div>

      <Show when={max !== undefined}>
        <p className="mt-[6px] text-xs text-ink-3">
          {value.length} of {max} chosen{atMax ? ' — that is the most' : ''}
        </p>
      </Show>

      <Show when={open && !locked}>
        <ul
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-dropdown max-h-[280px] overflow-y-auto rounded-blade-sm border-bold border-ink bg-white p-1 shadow-pop animate-slide-down"
        >
          <Repeat each={[...options]}>
            {(option: SelectOption) => {
              const on = value.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    disabled={option.disabled === true || (atMax && !on)}
                    onClick={() => toggle(option.value)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-blade-xs px-3 py-2 text-left',
                      'text-ctrl font-semibold transition-colors duration-fast',
                      'disabled:opacity-[0.42] disabled:cursor-not-allowed',
                      on ? 'bg-sky-soft text-sky-on' : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
                    )}
                  >
                    {option.label}
                    {on && <Check size={15} strokeWidth={3} />}
                  </button>
                </li>
              );
            }}
          </Repeat>
        </ul>
      </Show>
    </div>
  );
}
