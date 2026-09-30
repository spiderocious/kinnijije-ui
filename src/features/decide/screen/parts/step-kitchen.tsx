import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { EVENTS, analytics } from '@shared/services/analytics';
import { Plus, Search, X } from 'lucide-react';

import { Button } from '@ui/primitives';

import { DECIDE_COPY } from '../../content/decide.content';
import { INGREDIENT_ART } from '../../content/decide.illustrations';
import type { DecideOptions, DecideOptionTile } from '../../types/decide.types';
import { DecideShell } from './decide-shell';
import { DecideTile } from './decide-tile';
import { StepNav } from './step-nav';

/** Enough to choose from without becoming a wall of near-misses. */
const MAX_RESULTS = 18;

interface StepKitchenProps {
  readonly options: DecideOptions | undefined;
  readonly selected: string[];
  readonly onChange: (items: string[]) => void;
  readonly onContinue: () => void;
  readonly onSkip: () => void;
  readonly onBack: () => void;
}

/**
 * Matching the way a cook types.
 *
 * Aliases are the point: somebody types "atarodo" and means scotch bonnet,
 * "gari" and means garri, "spag" and means spaghetti. Matching the display
 * name alone would miss most of that, so every alias is searched too.
 *
 * Ranked so the useful answer comes first: an exact hit beats a prefix, a
 * prefix beats a word start, and a word start beats a match buried mid-string.
 * Without the ordering, typing "rice" surfaces "Roasted groundnut" above
 * "Long-grain rice", which reads as broken.
 */
function scoreOf(item: DecideOptionTile, query: string): number {
  const terms = [item.label, ...(item.aliases ?? [])].map((t) => t.toLowerCase());
  let best = 0;

  for (const term of terms) {
    let score = 0;
    if (term === query) score = 100;
    else if (term.startsWith(query)) score = 80;
    else if (term.includes(` ${query}`)) score = 60;
    else if (term.includes(query)) score = 40;
    if (score > best) best = score;
  }

  return best;
}

export function StepKitchen({
  options,
  selected,
  onChange,
  onContinue,
  onSkip,
  onBack,
}: StepKitchenProps) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Typing stays responsive while 400+ items are filtered underneath.
  const deferredQuery = useDeferredValue(query);

  const groups = options?.kitchen ?? [];
  const primaryCount = options?.primary_group_count ?? 6;
  const visible = expanded ? groups : groups.slice(0, primaryCount);
  const totalItems = options?.total_items ?? 0;

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (q.length === 0) return null;

    return groups
      .flatMap((group) => group.items)
      .map((item) => ({ item, score: scoreOf(item, q) }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
      .slice(0, MAX_RESULTS)
      .map((hit) => hit.item);
  }, [deferredQuery, groups]);

  /**
   * The catalogue-gap event.
   *
   * A search with `found: false` is somebody naming an ingredient we do not
   * stock — which is the most direct product feedback in the app. NEVER the
   * query text: send its length and whether it hit.
   *
   * Debounced to 600ms so a settled search is reported once, rather than one
   * event per keystroke as somebody types "atarodo".
   */
  useEffect(() => {
    const q = deferredQuery.trim();
    if (q.length < 2) return;

    const timer = setTimeout(() => {
      analytics.track(EVENTS.DECIDE_INGREDIENT_SEARCHED, {
        query_length: q.length,
        result_count: results?.length ?? 0,
        found: (results?.length ?? 0) > 0,
      });
    }, 600);

    return () => { clearTimeout(timer); };
  }, [deferredQuery, results]);

  const toggle = (label: string) => {
    onChange(
      selected.includes(label) ? selected.filter((s) => s !== label) : [...selected, label],
    );
  };

  return (
    <DecideShell
      step={1}
      total={4}
      title={DECIDE_COPY.kitchen.title}
      sub={DECIDE_COPY.kitchen.sub}
      sticky={
        <div className="flex flex-col gap-2">
        <label className="flex min-h-ctrl items-center gap-2 rounded-blade-xs border-2 border-line-2 bg-white px-3 focus-within:border-sky focus-within:shadow-drop-sm">
          <Search size={17} strokeWidth={2.4} className="shrink-0 text-ink-4" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            placeholder={
              totalItems > 0
                ? `Search ${String(totalItems)} things`
                : DECIDE_COPY.kitchen.search
            }
            aria-label="Search ingredients"
            enterKeyHint="search"
            className="w-full border-0 bg-transparent font-sans text-base text-ink outline-none placeholder:text-ink-4"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => { setQuery(''); }}
              aria-label="Clear search"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-round text-ink-4 hover:bg-paper-2 hover:text-ink"
            >
              <X size={14} strokeWidth={2.6} />
            </button>
          )}
        </label>

        {selected.length > 0 && (
          <div className="flex max-h-[76px] flex-wrap gap-1.5 overflow-y-auto overscroll-contain">
            {selected.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-pill border-hair border-sky-edge bg-sky-soft py-1 pl-3 pr-1 text-xs font-bold text-sky-on"
              >
                {name}
                <button
                  type="button"
                  onClick={() => { toggle(name); }}
                  aria-label={`Remove ${name}`}
                  className="grid h-[17px] w-[17px] shrink-0 place-items-center rounded-round border-0 bg-sky text-white"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}
        </div>
      }
      footer={
        <StepNav
          onBack={onBack}
          onContinue={onContinue}
          continueLabel={DECIDE_COPY.kitchen.continue(selected.length)}
          secondary={{ label: DECIDE_COPY.kitchen.skip, onClick: onSkip }}
        />
      }
    >
      {results !== null ? (
        <div>
          <div className="grid grid-cols-3 gap-2">
            {results.map((item) => (
              <DecideTile
                key={item.id}
                label={item.label}
                icon={item.icon}
                art={INGREDIENT_ART[item.id]}
                selected={selected.includes(item.label)}
                onToggle={() => { toggle(item.label); }}
              />
            ))}
          </div>
          {results.length === 0 && (
            <p className="py-6 text-center text-[13px] text-ink-3">
              Nothing by that name. Try another word, or tap one below.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((group) => (
            <section key={group.id}>
              <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-overline text-ink-3">
                {group.label}
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {group.items.map((item) => (
                  <DecideTile
                    key={item.id}
                    label={item.label}
                    icon={item.icon}
                    art={INGREDIENT_ART[item.id]}
                    selected={selected.includes(item.label)}
                    onToggle={() => { toggle(item.label); }}
                  />
                ))}
              </div>
            </section>
          ))}

          {groups.length > primaryCount && (
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => { setExpanded((v) => !v); }}
            >
              <Plus size={15} strokeWidth={2.4} className="mr-1.5" />
              {expanded
                ? DECIDE_COPY.kitchen.fewer
                : `${DECIDE_COPY.kitchen.more} (${String(groups.length - primaryCount)})`}
            </Button>
          )}
        </div>
      )}
    </DecideShell>
  );
}
