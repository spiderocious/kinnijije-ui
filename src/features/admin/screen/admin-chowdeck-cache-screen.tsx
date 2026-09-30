import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDateTime } from '@shared/utils/format-date';
import { InfoCard } from '@ui/admin';
import { Input } from '@ui/inputs';
import { Button } from '@ui/primitives';

import {
  CacheStatusBadge,
  ChowdeckError,
  ChowdeckShell,
  FreshnessBadge,
  Pager,
} from '../chowdeck/chowdeck-parts';
import type { CacheRow } from '../chowdeck/chowdeck.types';
import { useChowdeckCache, useChowdeckPlaces, useClearCache } from '../chowdeck/use-chowdeck';
import { DataTable, type Column } from '../parts/data-table';

const LIMIT = 50;

const SELECT = 'rounded-blade-xs border border-line bg-white px-3 py-2 text-sm';

/**
 * Clearing by place, by query, or all of it.
 *
 * Clearing is always safe — the next cook to ask simply causes one fetch — but
 * "all" turns every cached answer into a call against today's allowance at
 * once, so it asks twice.
 */
function ClearPanel() {
  const places = useChowdeckPlaces();
  const clear = useClearCache();
  const [scope, setScope] = useState<'place' | 'query' | 'all'>('place');
  const [placeId, setPlaceId] = useState('');
  const [query, setQuery] = useState('');
  const [confirming, setConfirming] = useState(false);

  const id = scope === 'place' ? placeId : scope === 'query' ? query.trim() : undefined;
  const ready = scope === 'all' || (id !== undefined && id.length > 0);

  const run = () => {
    clear.mutate(
      { scope, ...(id !== undefined && { id }) },
      {
        onSettled: () => {
          setConfirming(false);
        },
      },
    );
  };

  return (
    <InfoCard title="Clear the cache">
      <ChowdeckError error={clear.error} title="Nothing was cleared" className="mb-3" />

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={scope}
          onChange={(event) => {
            const next = event.target.value;
            setScope(next === 'query' ? 'query' : next === 'all' ? 'all' : 'place');
            setConfirming(false);
          }}
          aria-label="What to clear"
          className={SELECT}
        >
          <option value="place">Every search for one place</option>
          <option value="query">One query, every place</option>
          <option value="all">Everything</option>
        </select>

        <Show when={scope === 'place'}>
          <select
            value={placeId}
            onChange={(event) => {
              setPlaceId(event.target.value);
            }}
            aria-label="Place"
            className={SELECT}
          >
            <option value="">Choose a place…</option>
            {(places.data?.items ?? []).map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
                {place.city === null ? '' : ` · ${place.city}`}
              </option>
            ))}
          </select>
        </Show>

        <Show when={scope === 'query'}>
          <Input
            placeholder="The query, exactly (e.g. Jollof rice)"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            className="max-w-[260px]"
          />
        </Show>

        <Show when={scope !== 'all'}>
          <Button size="sm" variant="secondary" disabled={!ready} loading={clear.isPending} onClick={run}>
            Clear
          </Button>
        </Show>

        {/* Two steps for everything, deliberately. */}
        <Show when={scope === 'all' && !confirming}>
          <Button
            size="sm"
            variant="secondary"
            destructive
            onClick={() => {
              setConfirming(true);
            }}
          >
            Clear everything…
          </Button>
        </Show>
      </div>

      <Show when={scope === 'all' && confirming}>
        <p className="mt-3 text-sm font-extrabold text-caution-onsoft">
          Clear every cached search? Each one becomes a live call the next time a cook asks.
        </p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" destructive loading={clear.isPending} onClick={run}>
            Yes, clear everything
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setConfirming(false);
            }}
          >
            Wait
          </Button>
        </div>
      </Show>

      <Show when={clear.data !== undefined}>
        <p className="mt-3 text-xs font-extrabold text-success-onsoft">
          Cleared {clear.data?.cleared ?? 0} row{clear.data?.cleared === 1 ? '' : 's'}.
        </p>
      </Show>
    </InfoCard>
  );
}

/**
 * Every cached search: one row per (place, query), fresh, stale or past it.
 */
export default function AdminChowdeckCacheScreen() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [status, setStatus] = useState('');
  const [freshness, setFreshness] = useState('');
  const [skip, setSkip] = useState(0);

  const places = useChowdeckPlaces();
  const clearRow = useClearCache();
  const { data, isLoading, error } = useChowdeckCache({
    ...(q.trim().length > 0 && { q: q.trim() }),
    ...(placeId.length > 0 && { place_id: placeId }),
    ...(status.length > 0 && { status }),
    ...(freshness.length > 0 && { freshness }),
    limit: LIMIT,
    skip,
  });

  const filter = (set: (value: string) => void) => (value: string) => {
    set(value);
    setSkip(0);
  };

  const columns: Column<CacheRow>[] = [
    {
      key: 'place',
      header: 'Place',
      render: (row) => (
        <span className="flex flex-col">
          <span className="text-xs font-bold text-ink">{row.place_name ?? '(deleted place)'}</span>
          <span className="max-w-[140px] truncate font-mono text-[10.5px] text-ink-4">{row.place_id}</span>
        </span>
      ),
    },
    {
      key: 'query',
      header: 'Query',
      render: (row) => (
        <span className="flex flex-col">
          <span className="text-xs text-ink">{row.query}</span>
          <span className="font-mono text-[10.5px] text-ink-4">{row.meal_slug ?? '—'}</span>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <CacheStatusBadge status={row.status} /> },
    { key: 'fresh', header: 'Age', render: (row) => <FreshnessBadge freshness={row.freshness} /> },
    {
      key: 'vendors',
      header: 'Vendors',
      numeric: true,
      render: (row) => <span className="font-mono text-xs">{row.vendor_count}</span>,
    },
    {
      key: 'dropped',
      header: 'Dropped',
      numeric: true,
      render: (row) => (
        // Non-zero means their shape moved under us.
        <span className={`font-mono text-xs ${row.dropped_vendor_count > 0 ? 'font-extrabold text-critical-onsoft' : ''}`}>
          {row.dropped_vendor_count}
        </span>
      ),
    },
    {
      key: 'hits',
      header: 'Hits',
      numeric: true,
      render: (row) => <span className="font-mono text-xs">{row.hits}</span>,
    },
    {
      key: 'fetched',
      header: 'Fetched',
      render: (row) => <span className="font-mono text-xs text-ink-3">{formatDateTime(row.fetched_at)}</span>,
    },
    {
      key: 'served',
      header: 'Last served',
      render: (row) => <span className="font-mono text-xs text-ink-3">{formatDateTime(row.last_served_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          size="sm"
          variant="tertiary"
          disabled={clearRow.isPending}
          onClick={(event) => {
            // The row itself opens the detail.
            event.stopPropagation();
            clearRow.mutate({ scope: 'entry', id: row.id });
          }}
        >
          Clear
        </Button>
      ),
    },
  ];

  return (
    <ChowdeckShell section="cache" title="Chowdeck · Cache">
      <ChowdeckError error={error} title="The cache did not load" />
      <ChowdeckError error={clearRow.error} title="That row was not cleared" />

      <div className="mb-5">
        <ClearPanel />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search query or meal…"
          value={q}
          onChange={(event) => {
            filter(setQ)(event.target.value);
          }}
          className="max-w-[220px]"
        />
        <select
          value={placeId}
          onChange={(event) => {
            filter(setPlaceId)(event.target.value);
          }}
          aria-label="Filter by place"
          className={SELECT}
        >
          <option value="">Every place</option>
          {(places.data?.items ?? []).map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
              {place.city === null ? '' : ` · ${place.city}`}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => {
            filter(setStatus)(event.target.value);
          }}
          aria-label="Filter by status"
          className={SELECT}
        >
          <option value="">Any result</option>
          <option value="ok">Has offers</option>
          <option value="empty">Empty</option>
        </select>
        <select
          value={freshness}
          onChange={(event) => {
            filter(setFreshness)(event.target.value);
          }}
          aria-label="Filter by age"
          className={SELECT}
        >
          <option value="">Any age</option>
          <option value="fresh">Fresh</option>
          <option value="stale">Stale</option>
          <option value="expired">Expired</option>
        </select>

        <Show when={data !== undefined}>
          <span className="ml-auto font-mono text-xs text-ink-3">{data?.total ?? 0} rows</span>
        </Show>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        isLoading={isLoading}
        empty="Nothing cached matches that."
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          void navigate({ to: ROUTES.ADMIN_CHOWDECK_CACHE_ENTRY(row.id) });
        }}
      />

      <Pager total={data?.total ?? 0} limit={LIMIT} skip={skip} onSkip={setSkip} noun="rows" />
    </ChowdeckShell>
  );
}
