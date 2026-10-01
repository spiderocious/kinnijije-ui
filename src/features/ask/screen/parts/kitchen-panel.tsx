import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import { INGREDIENT_ART } from '@features/decide/content/decide.illustrations';
import type { DecideOptions } from '@features/decide/types/decide.types';
import { Button } from '@ui/primitives';

import { ASK_COPY } from '../../content/ask.content';
import { AskSheet } from './ask-sheet';
import { AskTile } from './ask-tile';

/**
 * The full ingredient picker.
 *
 * Grows from the dock to 86% of the viewport rather than opening as a separate
 * screen: the question it answers is still on screen behind it, and that is
 * what keeps the conversation legible.
 *
 * Costs ZERO requests. The catalogue is already in memory from the landing
 * page, versioned by ETag, so opening this is pure local state.
 */
interface KitchenPanelProps {
  readonly options: DecideOptions | undefined;
  readonly selected: string[];
  readonly onChange: (items: string[]) => void;
  readonly onClose: () => void;
  readonly onSearch?: ((query: string, resultCount: number) => void) | undefined;
}

export function KitchenPanel({
  options,
  selected,
  onChange,
  onClose,
  onSearch,
}: KitchenPanelProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const copy = ASK_COPY.questions.kitchen;

  // Focus lands in the search the moment it opens — the tap that got here was
  // on a search field, so anything else would be a surprise.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const groups = options?.kitchen ?? [];

  /**
   * Search runs over aliases as well as labels, so "atarodo" finds scotch
   * bonnet. The catalogue already carries them; not using them would make the
   * search worse than the data allows.
   */
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length === 0) return null;

    const hits: { id: string; label: string; icon: string }[] = [];
    for (const group of groups) {
      for (const item of group.items) {
        const haystack = [item.label, ...(item.aliases ?? [])].join(' ').toLowerCase();
        if (haystack.includes(term)) hits.push(item);
      }
    }
    return hits;
  }, [query, groups]);

  useEffect(() => {
    if (results !== null && query.trim().length > 1) onSearch?.(query, results.length);
  }, [results, query, onSearch]);

  const toggle = (label: string): void => {
    onChange(
      selected.includes(label) ? selected.filter((x) => x !== label) : [...selected, label],
    );
  };

  return (
    <AskSheet
      label={copy.search}
      onClose={onClose}
      footer={
        <Button fullWidth size="lg" onClick={onClose}>
          {copy.use(selected.length)}
        </Button>
      }
    >
      <>
        <div className="shrink-0 px-4 pb-3">
          <label className="flex min-h-ctrl items-center gap-2 rounded-blade-xs border-2 border-line-2 bg-white px-3 focus-within:border-sky focus-within:shadow-drop-sm">
            <Search size={16} strokeWidth={2.4} className="shrink-0 text-ink-4" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => { setQuery(event.target.value); }}
              placeholder={
                options === undefined
                  ? copy.search
                  : `Search ${String(options.total_items)} ingredients`
              }
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-4"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => { setQuery(''); }}
                aria-label="Clear"
                className="shrink-0 text-ink-4 hover:text-ink"
              >
                <X size={14} strokeWidth={2.6} />
              </button>
            )}
          </label>

          {/* Picks stay pinned, so a long scroll never hides what you chose. */}
          {selected.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {selected.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { toggle(label); }}
                  className="kj-tile-in inline-flex items-center gap-1 rounded-pill border-2 border-ink bg-sky-100 px-2.5 py-1 text-[11.5px] font-extrabold text-ink"
                >
                  {label}
                  <X size={10} strokeWidth={3} className="opacity-60" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {results !== null ? (
            results.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-ink-3">{copy.none}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {results.map((item, i) => (
                  <AskTile
                    key={item.id}
                    index={i}
                    label={item.label}
                    icon={item.icon}
                    art={INGREDIENT_ART[item.id]}
                    selected={selected.includes(item.label)}
                    onToggle={() => { toggle(item.label); }}
                  />
                ))}
              </div>
            )
          ) : (
            groups.map((group) => (
              <section key={group.id} className="mb-4">
                <h3 className="mb-2 text-[10.5px] font-extrabold uppercase tracking-overline text-ink-3">
                  {group.label}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {group.items.map((item, i) => (
                    <AskTile
                      key={item.id}
                      index={Math.min(i, 8)}
                      label={item.label}
                      icon={item.icon}
                      art={INGREDIENT_ART[item.id]}
                      selected={selected.includes(item.label)}
                      onToggle={() => { toggle(item.label); }}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

      </>
    </AskSheet>
  );
}
