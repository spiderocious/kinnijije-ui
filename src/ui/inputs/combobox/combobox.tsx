import { useEffect, useRef, useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon, Loader2, Plus } from '@icons';
import { cn } from '@shared/utils/cn';
import { FIELD_BASE_CLASS, FIELD_SIZE_CLASS, fieldStateClass, type FieldSize, type FieldTriad } from '../field-contract';

/**
 * The filterable picker — the kitchen's main input.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/51-combobox.html
 *                                                          41-input-search.html
 *
 * Type to narrow, then pick. This is the product's busiest input, so **its
 * empty state is load-bearing**: "no match" must still let the ingredient
 * through, or the whole funnel stops.
 *
 * `onCreate` is REQUIRED — the dictionary will never cover every Nigerian
 * ingredient, and a dead end here blocks the entire product. Making it a
 * required prop is how that stays true as the component gets reused.
 *
 * `onAbort` is REQUIRED too: a suggestion list that answers a query the user
 * has already changed is worse than an empty one.
 */

export interface ComboboxOption {
  readonly value: string;
  readonly label: string;
  /** A secondary line — a category, a synonym. */
  readonly detail?: string;
}

export interface ComboboxProps extends FieldTriad {
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
  readonly onSelect: (option: ComboboxOption) => void;
  readonly options: readonly ComboboxOption[];
  /**
   * REQUIRED. The empty state always offers "add it anyway" — the dictionary
   * will never cover every ingredient.
   */
  readonly onCreate: (label: string) => void;
  /**
   * REQUIRED. Cancels an in-flight lookup when the query changes — a stale
   * result set is worse than none.
   */
  readonly onAbort: () => void;
  readonly label: string;
  readonly placeholder?: string;
  readonly size?: FieldSize;
  readonly loading?: boolean;
  /** First open, dictionary still loading. */
  readonly initialising?: boolean;
  /** Lookup failed — typing still works. */
  readonly lookupError?: string;
  readonly className?: string;
}

export function Combobox({
  query,
  onQueryChange,
  onSelect,
  options,
  onCreate,
  onAbort,
  label,
  placeholder = 'Add an ingredient',
  size = 'md',
  loading = false,
  initialising = false,
  lookupError,
  disabled = false,
  readOnly = false,
  invalid = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Abort the in-flight lookup whenever the query moves on.
  useEffect(() => {
    return () => onAbort();
  }, [query, onAbort]);

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

  const trimmed = query.trim();
  const hasQuery = trimmed !== '';
  const showEmpty = open && hasQuery && !loading && !initialising && options.length === 0;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-4 flex text-ink-3">
          <KoboyoIcon name="searchSlash" size={16} />
        </span>
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-label={label}
          value={query}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && hasQuery) {
              event.preventDefault();
              const first = options[0];
              // Enter takes the first result, or creates — never nothing.
              if (first !== undefined) onSelect(first);
              else onCreate(trimmed);
              setOpen(false);
            }
          }}
          className={cn(
            FIELD_BASE_CLASS,
            FIELD_SIZE_CLASS[size],
            fieldStateClass({ disabled, readOnly, invalid }),
            'pl-11 pr-11',
          )}
        />
        <Show when={loading}>
          <span className="absolute right-4 flex text-ink-3">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          </span>
        </Show>
      </div>

      <Show when={open && !disabled && !readOnly}>
        <div
          className={cn(
            'absolute left-0 right-0 top-[calc(100%+6px)] z-dropdown max-h-[300px] overflow-y-auto',
            'rounded-blade-sm border-bold border-ink bg-white p-1 shadow-pop animate-slide-down',
          )}
        >
          {/* Dictionary loading on first open — a skeleton in the shape it will become. */}
          <Show when={initialising}>
            <ul aria-hidden="true" className="flex flex-col gap-1 p-1">
              <Repeat times={4}>
                {() => <li className="h-9 animate-shimmer rounded-blade-xs bg-skeleton" />}
              </Repeat>
            </ul>
          </Show>

          <Show when={!initialising && lookupError !== undefined}>
            <div className="px-3 py-3">
              <p className="text-sm font-extrabold text-critical-onsoft">{lookupError}</p>
              <p className="mt-1 text-sm text-ink-2">
                You can still type the name and press enter.
              </p>
            </div>
          </Show>

          <Show when={!initialising && lookupError === undefined}>
            <ul role="listbox" aria-label={label}>
              <Repeat each={[...options]}>
                {(option: ComboboxOption) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        onSelect(option);
                        setOpen(false);
                      }}
                      className="flex w-full flex-col items-start rounded-blade-xs px-3 py-2 text-left transition-colors duration-fast hover:bg-sky-soft"
                    >
                      <span className="text-ctrl font-semibold text-ink">{option.label}</span>
                      {option.detail !== undefined && (
                        <span className="text-xs text-ink-3">{option.detail}</span>
                      )}
                    </button>
                  </li>
                )}
              </Repeat>
            </ul>
          </Show>

          {/* The empty state NEVER dead-ends. */}
          <Show when={showEmpty}>
            <div className="px-3 py-3">
              <p className="text-sm text-ink-2">
                Nothing matches “<b className="font-extrabold text-ink">{trimmed}</b>”.
              </p>
              <button
                type="button"
                onClick={() => {
                  onCreate(trimmed);
                  setOpen(false);
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-blade-xs border border-ink bg-sky px-3 py-2 text-sm font-extrabold text-sky-onbase shadow-drop-sm transition-transform duration-press active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
              >
                <Plus size={14} strokeWidth={3} />
                Add “{trimmed}” anyway
              </button>
              <p className="mt-2 text-xs text-ink-3">
                We will still try to find meals with it.
              </p>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
