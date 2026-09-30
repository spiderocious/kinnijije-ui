import { useMemo, useState } from 'react';
import { Check, MapPin, Plus, Search, X } from 'lucide-react';

import type { ChowdeckPlace } from '../chowdeck.types';
import { usePlaceSearch } from '../use-chowdeck';

/**
 * Picking where you are, from the places we have saved.
 *
 * Searches OUR table only — typing here never reaches Chowdeck. With nothing
 * typed it shows the saved list grouped by state: the main city first, then
 * five more, then a "+N places" chip that opens the rest of that state. A
 * wall of two hundred chips is a list nobody reads; the main city is what
 * most people tap anyway.
 *
 * The chosen place collapses into one chip with a way to change it, because a
 * long list under a decision already made is noise.
 */

/** A picked place as the draft holds it; `state` is absent on older drafts. */
type PickedPlace = Omit<ChowdeckPlace, 'state'> & { state?: string | null | undefined };

interface PlacePickerProps {
  readonly value: PickedPlace | null;
  readonly onChange: (place: ChowdeckPlace | null) => void;
}

/** The main city, plus this many more, before a state folds behind "+N". */
const SHOWN_PER_GROUP = 6;

interface PlaceGroup {
  label: string;
  items: ChowdeckPlace[];
}

/**
 * One chip per place name within a group.
 *
 * Their autocomplete often answers a small town with the nearest big one, so
 * the same name can arrive under several ids. Showing "Abuja" four times reads
 * as broken, and they all mean the same thing to a cook. The FIRST wins — the
 * server sends them in list order, so that is the main one.
 */
function dedupe(places: readonly ChowdeckPlace[]): ChowdeckPlace[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = `${(place.state ?? place.city ?? '').toLowerCase()}|${place.name.trim().toLowerCase()}`;
    if (seen.has(key) || seen.has(`id:${place.id}`)) return false;
    seen.add(key);
    seen.add(`id:${place.id}`);
    return true;
  });
}

/** Groups in the order they first appear, which is the server's list order. */
function groupByState(places: readonly ChowdeckPlace[]): PlaceGroup[] {
  const groups = new Map<string, ChowdeckPlace[]>();
  for (const place of places) {
    const label = place.state ?? place.city ?? 'Other';
    const list = groups.get(label);
    if (list === undefined) groups.set(label, [place]);
    else list.push(place);
  }
  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}

export function PlacePicker({ value, onChange }: PlacePickerProps) {
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const { data, isLoading, isError } = usePlaceSearch(query, value === null);

  const browsing = query.trim().length === 0;
  const places = useMemo(() => dedupe(data ?? []), [data]);
  // A search result is already specific: one flat list, nothing folded.
  const groups = useMemo(
    () => (browsing ? groupByState(places) : [{ label: '', items: places }]),
    [browsing, places],
  );

  if (value !== null) {
    return (
      <div className="flex items-center gap-3 rounded-blade-xs border-2 border-ink bg-sky-soft px-3 py-2.5 shadow-drop-sm">
        <MapPin size={18} strokeWidth={2.4} className="shrink-0 text-sky-on" />
        <span className="min-w-0 flex-1">
          <b className="block truncate font-display text-[15px] font-extrabold text-ink">{value.name}</b>
          <span className="block truncate text-xs text-ink-3">{value.description}</span>
        </span>
        <button
          type="button"
          onClick={() => { onChange(null); }}
          className="shrink-0 rounded-pill border-hair border-line-2 bg-white px-3 py-1 text-xs font-extrabold text-ink-2 hover:border-ink"
        >
          Change
        </button>
      </div>
    );
  }

  const open = (label: string) => {
    setOpened((current) => new Set(current).add(label));
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex min-h-ctrl items-center gap-2 rounded-blade-xs border-2 border-line-2 bg-white px-3 focus-within:border-sky focus-within:shadow-drop-sm">
        <Search size={17} strokeWidth={2.4} className="shrink-0 text-ink-4" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); }}
          placeholder="Search your town: Ibadan, Ogbomoso, Enugu…"
          aria-label="Search your town"
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

      {isError && (
        <p className="text-[13px] text-critical-onsoft">Could not load places. Check your connection and try again.</p>
      )}

      {!isLoading && !isError && places.length === 0 && (
        <p className="py-4 text-center text-[13px] text-ink-3">
          {browsing ? 'No towns yet.' : 'We do not cover that town yet. Try the nearest bigger one.'}
        </p>
      )}

      {groups.map((group) => {
        const expanded = !browsing || opened.has(group.label);
        const shown = expanded ? group.items : group.items.slice(0, SHOWN_PER_GROUP);
        const hidden = group.items.length - shown.length;

        return (
          <section key={group.label === '' ? 'results' : group.label}>
            {group.label !== '' && (
              <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-overline text-ink-3">
                {group.label}
              </h3>
            )}
            <div className="flex flex-wrap gap-2">
              {shown.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => { onChange(place); }}
                  title={place.description}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border-2 border-line-2 bg-white px-3.5 py-2 font-sans text-[13px] font-extrabold text-ink-2 transition-all duration-fast ease-kj-out hover:border-ink"
                >
                  {place.name}
                </button>
              ))}

              {hidden > 0 && (
                <button
                  type="button"
                  onClick={() => { open(group.label); }}
                  aria-label={`Show ${String(hidden)} more places in ${group.label}`}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-pill border-2 border-dashed border-line-2 bg-paper-2 px-3.5 py-2 font-sans text-[13px] font-extrabold text-ink-3 transition-all duration-fast ease-kj-out hover:border-ink hover:text-ink"
                >
                  <Plus size={13} strokeWidth={3} />
                  {hidden} {hidden === 1 ? 'place' : 'places'}
                </button>
              )}
            </div>
          </section>
        );
      })}

      {isLoading && (
        <div className="flex flex-wrap gap-2" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="h-9 w-24 animate-pulse rounded-pill bg-skeleton" />
          ))}
        </div>
      )}
    </div>
  );
}

/** The small confirmation shown once a place is set, for screens that only display it. */
export function PlaceChip({ place }: { place: PickedPlace }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border-hair border-sky-edge bg-sky-soft px-2.5 py-0.5 text-[11.5px] font-bold text-sky-on">
      <Check size={11} strokeWidth={3} />
      {place.name}
    </span>
  );
}
