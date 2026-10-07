import { useMemo, useState } from 'react';

import { Show } from 'meemaw';

import { X } from '@icons';
import { Combobox, type ComboboxOption } from '@ui/inputs';

/**
 * Pick several catalogue ingredients, by typing.
 *
 * WHY NOT `MultiSelect`: it renders the whole option list, and the catalogue
 * holds 417 items. Scrolling 417 entries to find palm oil is not a picker, it
 * is a filing cabinet — the studio's conditions are written by people who know
 * the ingredient's name and want to type it.
 *
 * WHY NOT `Combobox` alone: it selects one value. This wraps it so each pick
 * becomes a removable chip and the search box clears itself ready for the next
 * one, which is how somebody enters "ogbono, palm oil, crayfish" without
 * reaching for the mouse.
 *
 * SEARCH IS LOCAL. The whole catalogue is already in memory from
 * `useRecipeFormOptions`, so filtering here costs nothing and works offline —
 * a round trip per keystroke would be slower and could fail.
 */

export function IngredientPicker({
  label,
  value,
  onChange,
  options,
  placeholder,
  max = 40,
}: {
  readonly label: string;
  readonly value: readonly string[];
  readonly onChange: (next: string[]) => void;
  /** The whole catalogue. Filtered locally as somebody types. */
  readonly options: readonly { value: string; label: string; detail?: string }[];
  readonly placeholder?: string;
  readonly max?: number;
}) {
  const [query, setQuery] = useState('');

  const byValue = useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );

  /**
   * What to offer: matches on the name OR the id, minus anything already
   * picked.
   *
   * Matching the id too is deliberate — a curator who knows the catalogue
   * writes `palm_oil` faster than "palm oil", and a picker that ignored that
   * would feel broken to the people using it most.
   *
   * Capped at 50 rendered rows: an unfiltered catalogue would otherwise mount
   * 417 list items on first focus.
   */
  const suggestions: ComboboxOption[] = useMemo(() => {
    const chosen = new Set(value);
    const needle = query.trim().toLowerCase();

    return options
      .filter((option) => {
        if (chosen.has(option.value)) return false;
        if (needle === '') return true;
        return (
          option.label.toLowerCase().includes(needle) ||
          option.value.toLowerCase().includes(needle)
        );
      })
      .slice(0, 50)
      .map((option) => ({
        value: option.value,
        label: option.label,
        ...(option.detail !== undefined && { detail: option.detail }),
      }));
  }, [options, query, value]);

  const atCap = value.length >= max;

  const add = (id: string): void => {
    if (atCap || value.includes(id)) return;
    onChange([...value, id]);
    // Cleared so the next one can be typed straight away.
    setQuery('');
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Combobox
        label={label}
        query={query}
        onQueryChange={setQuery}
        onSelect={(option) => {
          add(option.value);
        }}
        options={suggestions}
        /**
         * A condition can only name a CATALOGUE id — the matcher resolves
         * ingredients against the catalogue, so a free-text entry would be a
         * condition that silently never matches. So "add it anyway" puts the
         * text in only when it is a real id, and otherwise does nothing.
         */
        onCreate={(text) => {
          const typed = text.trim();
          if (byValue.has(typed)) add(typed);
        }}
        // Nothing is in flight: the filter is local, so there is no lookup to
        // cancel. Required by the contract, honestly a no-op here.
        onAbort={() => undefined}
        {...(placeholder !== undefined && { placeholder })}
        {...(atCap && { disabled: true })}
        size="sm"
      />

      <Show when={value.length > 0}>
        <div className="flex flex-wrap gap-1.5">
          {value.slice().map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onChange(value.filter((entry) => entry !== id));
              }}
              className="inline-flex items-center gap-1 rounded-blade-xs border border-line-2 bg-white px-2 py-1 text-xs font-extrabold text-ink hover:border-ink"
            >
              {/* The catalogue name when we know it, the raw id when we do
                  not — a chip reading an opaque id is still better than one
                  reading "unknown". */}
              {byValue.get(id)?.label ?? id}
              <X size={11} aria-hidden="true" />
              <span className="sr-only">Remove</span>
            </button>
          ))}
        </div>
      </Show>

      <Show when={atCap}>
        <p className="text-xs text-ink-3">
          That is {max} ingredients, which is the most one condition can name.
        </p>
      </Show>
    </div>
  );
}
