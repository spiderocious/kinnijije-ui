import { useState } from 'react';

import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Field, Input } from '@ui/inputs';
import { Tag } from '@ui/status';

import { useIngredientSearch } from '../hooks/use-ingredient-search';
import type { IngredientSuggestion } from '../types/stock.types';

interface IngredientTypeaheadProps {
  readonly onPick: (suggestion: IngredientSuggestion) => void;
  /** Free text the catalogue does not know. */
  readonly onCreate: (name: string) => void;
  /** The last few things added, offered right under the box. */
  readonly recent: readonly string[];
  readonly onPickRecent: (name: string) => void;
}

/**
 * Search-box behaviour: suggestions appear as you type, tapping one adds it.
 *
 * **The input must never remount.** `Input` renders a bare `<input>` with no
 * leading/trailing and a `<div>`-wrapped one otherwise — so passing a `loading`
 * flag that flips per keystroke changes the element type at that position and
 * React tears the field down, taking focus (and the phone keyboard) with it.
 *
 * Loading is therefore shown BESIDE the field, never through it.
 */
export function IngredientTypeahead({ onPick, onCreate, recent, onPickRecent }: IngredientTypeaheadProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const { data: suggestions = [], isFetching } = useIngredientSearch(query);

  const trimmed = query.trim();
  const showRecents = recent.length > 0 && trimmed.length === 0;
  const showSuggestions = focused && trimmed.length > 0;

  // Offer "add it anyway" unless something already matches exactly — the
  // catalogue is large but will never be complete.
  const exactMatch = suggestions.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());

  const submitTopMatch = (): void => {
    if (trimmed.length === 0) return;
    const first = suggestions[0];
    if (first !== undefined) onPick(first);
    else onCreate(trimmed);
    // Clearing the query is enough — the field keeps focus because it was
    // never unmounted, so the keyboard stays up for the next ingredient.
    setQuery('');
  };

  return (
    <div className="relative">
      <Field label="What do you have?">
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            size="lg"
            autoComplete="off"
            placeholder="Start typing — rice, atarodo, ugwu…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            onFocus={() => {
              setFocused(true);
            }}
            // Delayed so a click on a suggestion lands before the list closes.
            onBlur={() => {
              setTimeout(() => {
                setFocused(false);
              }, 150);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitTopMatch();
              }
              if (event.key === 'Escape') setFocused(false);
            }}
          />
        )}
      </Field>

      {/* Loading lives here, NOT on the input — see the note above. */}
      <div className="mt-1 h-4">
        <Show when={isFetching && trimmed.length > 0}>
          <span className="font-mono text-[11px] text-ink-3">searching…</span>
        </Show>
      </div>

      {/* Recents sit tight under the box, as chips. */}
      <Show when={showRecents}>
        <div className="-mt-1 flex flex-wrap gap-2">
          <Repeat each={[...recent]}>
            {(name: string) => (
              <button
                key={name}
                type="button"
                onMouseDown={(event) => {
                  // mouseDown, not click: blur would close the list first.
                  event.preventDefault();
                  onPickRecent(name);
                }}
              >
                <Tag tone="info" size="sm">
                  {name}
                </Tag>
              </button>
            )}
          </Repeat>
        </div>
      </Show>

      <Show when={showSuggestions}>
        <ul className="absolute left-0 right-0 z-20 mt-1 max-h-[320px] overflow-y-auto rounded-blade border border-line bg-white shadow-lg">
          <Repeat each={suggestions.slice(0, 8)}>
            {(suggestion: IngredientSuggestion) => (
              <li key={suggestion.catalogue_id}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onPick(suggestion);
                    setQuery('');
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                    'hover:bg-sky-soft focus-visible:bg-sky-soft focus-visible:outline-none',
                  )}
                >
                  <KoboyoIcon name={suggestion.icon as never} size={22} alone />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-ink">
                      {suggestion.name}
                    </span>
                    {/* Shown only when they typed a different spelling —
                        "atarodo → Scotch bonnet". */}
                    <Show when={suggestion.matched_on !== suggestion.name.toLowerCase()}>
                      <span className="block truncate text-xs text-ink-3">
                        matched “{suggestion.matched_on}”
                      </span>
                    </Show>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-ink-3">
                    {suggestion.default_unit}
                  </span>
                </button>
              </li>
            )}
          </Repeat>

          <Show when={!exactMatch}>
            <li className="border-t border-line">
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onCreate(trimmed);
                  setQuery('');
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sky-soft"
              >
                <KoboyoIcon name="plus" size={20} alone />
                <span className="text-sm">
                  Add “<span className="font-extrabold">{trimmed}</span>” anyway
                </span>
              </button>
            </li>
          </Show>
        </ul>
      </Show>
    </div>
  );
}
