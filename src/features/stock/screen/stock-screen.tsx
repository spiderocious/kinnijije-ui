import { useMemo, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { AppShell } from '@shared/ui-shell/app-shell';
import { ScreenState, StockListSkeleton } from '@shared/ui-shell/screen-states';
import { cn } from '@shared/utils/cn';
import { EmptyState } from '@ui/feedback';
import { Input } from '@ui/inputs';
import { Button, FilterChip } from '@ui/primitives';
import { Panel } from '@ui/structure';

import { useStock } from '../hooks/use-stock';
import type { StockItem } from '../types/stock.types';

const STORAGE_LABELS: Record<string, string> = {
  fridge: 'Fridge',
  shelf: 'Shelf',
  freezer: 'Freezer',
};

type Filter = 'all' | 'soon' | 'fridge' | 'shelf' | 'freezer' | 'out';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'soon', label: 'Use soon' },
  { id: 'out', label: 'Out' },
  { id: 'fridge', label: 'Fridge' },
  { id: 'shelf', label: 'Shelf' },
  { id: 'freezer', label: 'Freezer' },
];

export default function StockScreen() {
  const navigate = useNavigate();
  const stock = useStock();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const items = stock.data ?? [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (q.length > 0 && !item.name.toLowerCase().includes(q)) return false;
      if (filter === 'soon') return item.freshness === 'soon' || item.freshness === 'past';
      if (filter === 'out') return item.quantity <= 0;
      if (filter === 'fridge' || filter === 'shelf' || filter === 'freezer') {
        return item.storage === filter;
      }
      return true;
    });
  }, [items, query, filter]);

  const groups = ['fridge', 'shelf', 'freezer'].map((storage) => ({
    storage,
    items: visible.filter((item) => item.storage === storage),
  }));

  const addButton = (
    <Button
      icon="plus"
      onClick={() => {
        void navigate({ to: ROUTES.STOCK_ADD });
      }}
    >
      Add
    </Button>
  );

  return (
    <AppShell title="Stock" active="stock" actions={addButton}>
      <ScreenState
        isLoading={stock.isLoading}
        error={stock.error ?? null}
        onRetry={() => {
          void stock.refetch();
        }}
        what="your stock"
        skeleton={<StockListSkeleton />}
      >
        <Show when={items.length === 0}>
          <EmptyState
            art="emptyBox"
            title="Nothing in your kitchen yet"
            body="Add a few things and suggestions get much better."
            action={{
              label: 'Add something',
              onClick: () => {
                void navigate({ to: ROUTES.STOCK_ADD });
              },
            }}
          />
        </Show>

        <Show when={items.length > 0}>
          <>
            <div className="mb-4 flex flex-col gap-3">
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                placeholder="Search your kitchen…"
                aria-label="Search your kitchen"
              />

              <div className="flex flex-wrap gap-2">
                <Repeat each={FILTERS}>
                  {(option: (typeof FILTERS)[number]) => (
                    <FilterChip
                      key={option.id}
                      pressed={filter === option.id}
                      onPressedChange={() => {
                        setFilter(option.id);
                      }}
                    >
                      {option.label}
                    </FilterChip>
                  )}
                </Repeat>
              </div>
            </div>

            {/* A search that finds nothing is a DIFFERENT state from an empty
                kitchen — its way out is "clear the filter", never "add stock". */}
            <Show when={visible.length === 0}>
              <div className="rounded-blade border border-dashed border-line py-10 text-center">
                <KoboyoIcon name="searchSlash" size={32} className="text-ink-3" alone />
                <p className="mt-3 text-sm font-extrabold text-ink">Nothing matches that</p>
                <Button
                  variant="tertiary"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setQuery('');
                    setFilter('all');
                  }}
                >
                  Clear the filter
                </Button>
              </div>
            </Show>

            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5">
              <Repeat each={groups.filter((group) => group.items.length > 0)}>
                {(group: (typeof groups)[number]) => (
                  <Panel key={group.storage}>
                    <Panel.Header
                      title={STORAGE_LABELS[group.storage] ?? group.storage}
                      action={<span className="font-mono text-xs text-ink-3">{group.items.length}</span>}
                    />
                    <Panel.List>
                      <Repeat each={group.items}>
                        {(item: StockItem) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              void navigate({ to: ROUTES.STOCK_ITEM(item.id) });
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sky-soft"
                          >
                            <KoboyoIcon name={item.icon as never} size={24} alone />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-extrabold text-ink">
                                {item.name}
                              </span>
                              <Show when={item.freshness === 'soon'}>
                                <span className="text-xs text-caution-onsoft">
                                  use within {item.days_left} day{item.days_left === 1 ? '' : 's'}
                                </span>
                              </Show>
                              <Show when={item.freshness === 'past'}>
                                <span className="text-xs text-critical-onsoft">
                                  likely past its best
                                </span>
                              </Show>
                            </span>
                            <span
                              className={cn(
                                'font-mono text-sm',
                                item.quantity <= 0 ? 'text-critical-onsoft' : 'text-ink-2',
                              )}
                            >
                              {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1)}{' '}
                              {item.unit}
                            </span>
                            <KoboyoIcon name="chevronDown" size={16} className="-rotate-90 text-ink-3" alone />
                          </button>
                        )}
                      </Repeat>
                    </Panel.List>
                  </Panel>
                )}
              </Repeat>
            </div>
          </>
        </Show>
      </ScreenState>
    </AppShell>
  );
}
