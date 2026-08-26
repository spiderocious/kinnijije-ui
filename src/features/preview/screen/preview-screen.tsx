import { useMemo, useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { cn } from '@shared/utils/cn';
import { Logo } from '@ui/components';
import { Search, X } from '@icons';

import { PREVIEW_ENTRIES } from '../preview.entries';
import { PREVIEW_GROUP_ORDER, type PreviewEntry, type PreviewGroup } from '../preview.registry';

/**
 * The design-system viewer. Every component in the library renders here in every
 * state — this is where the system is reviewed, not in a PR.
 *
 * Visual spec: design-system/projects/kinnijije-v2/index.html
 */

interface GroupBucket {
  group: PreviewGroup;
  entries: PreviewEntry[];
}

function bucketEntries(entries: readonly PreviewEntry[]): GroupBucket[] {
  return PREVIEW_GROUP_ORDER.map((group) => ({
    group,
    entries: entries.filter((entry) => entry.group === group),
  })).filter((bucket) => bucket.entries.length > 0);
}

export function PreviewScreen() {
  const [activeId, setActiveId] = useState<string>(PREVIEW_ENTRIES[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === '') return PREVIEW_ENTRIES;
    return PREVIEW_ENTRIES.filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) || entry.group.toLowerCase().includes(q),
    );
  }, [query]);

  const buckets = useMemo(() => bucketEntries(filtered), [filtered]);

  const active = useMemo(
    () => PREVIEW_ENTRIES.find((entry) => entry.id === activeId) ?? PREVIEW_ENTRIES[0],
    [activeId],
  );

  const ActivePart = active?.Part;

  function select(id: string) {
    setActiveId(id);
    setNavOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Mobile scrim */}
      <Show when={navOpen}>
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-scrim bg-scrim md:hidden"
        />
      </Show>

      <aside
        className={cn(
          'z-nav flex w-[272px] shrink-0 flex-col border-r border-line-2 bg-white',
          'fixed inset-y-0 left-0 transition-transform duration-base md:sticky md:top-0 md:h-screen md:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Logo size="sm" />
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
            className="text-ink-3 md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-line px-4 py-3">
          <div className="flex items-center gap-2 rounded-blade-sm border border-line-2 bg-paper-2 px-3 py-2">
            <Search size={14} className="shrink-0 text-ink-3" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search components"
              aria-label="Search components"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <Repeat each={buckets}>
            {(bucket: GroupBucket) => (
              <div key={bucket.group} className="mb-5">
                <p className="mb-2 px-2 font-sans text-xs font-extrabold uppercase tracking-overline text-ink-3">
                  {bucket.group}
                </p>
                <ul className="flex flex-col gap-[2px]">
                  <Repeat each={bucket.entries}>
                    {(entry: PreviewEntry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => select(entry.id)}
                          aria-current={entry.id === activeId ? 'page' : undefined}
                          className={cn(
                            'w-full rounded-blade-xs px-3 py-[7px] text-left text-sm transition-colors duration-fast',
                            entry.id === activeId
                              ? 'bg-sky font-extrabold text-sky-onbase'
                              : 'font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink',
                          )}
                        >
                          {entry.label}
                        </button>
                      </li>
                    )}
                  </Repeat>
                </ul>
              </div>
            )}
          </Repeat>

          <Show when={buckets.length === 0}>
            <p className="px-2 py-6 text-sm text-ink-3">Nothing matches “{query}”.</p>
          </Show>
        </nav>

        <p className="border-t border-line px-5 py-3 font-mono text-xs text-ink-3">
          {PREVIEW_ENTRIES.length} specimens
        </p>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-sticky flex items-center gap-3 border-b border-line bg-paper/90 px-6 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="rounded-blade-xs border border-ink px-3 py-1 text-sm font-extrabold shadow-drop-sm"
          >
            Components
          </button>
          <span className="font-display text-lg font-extrabold">{active?.label}</span>
        </div>

        <div className="mx-auto max-w-[1180px] px-6 py-8 md:px-13 md:py-11">
          <Show when={ActivePart !== undefined} fallback={<p className="text-ink-3">Nothing selected.</p>}>
            {ActivePart !== undefined ? <ActivePart /> : null}
          </Show>
        </div>
      </main>
    </div>
  );
}

export default PreviewScreen;
