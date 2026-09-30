import { useState } from 'react';

import { Show } from 'meemaw';

import { formatDateTime } from '@shared/utils/format-date';
import { Tag } from '@ui/status';

import { ChowdeckError, ChowdeckShell, Pager } from '../chowdeck/chowdeck-parts';
import type { ClickRow } from '../chowdeck/chowdeck.types';
import { useChowdeckClicks } from '../chowdeck/use-chowdeck';
import { DataTable, type Column } from '../parts/data-table';

const LIMIT = 50;

const COLUMNS: Column<ClickRow>[] = [
  {
    key: 'when',
    header: 'When',
    render: (row) => <span className="font-mono text-xs text-ink-3">{formatDateTime(row.created_at)}</span>,
  },
  {
    key: 'vendor',
    header: 'Restaurant',
    render: (row) => (
      <span className="flex flex-col">
        <span className="text-xs font-bold text-ink">{row.vendor_name}</span>
        <span className="font-mono text-[10.5px] text-ink-4">{row.vendor_id}</span>
      </span>
    ),
  },
  {
    key: 'product',
    header: 'Product',
    render: (row) => <span className="font-mono text-xs text-ink-2">{row.product_id ?? '—'}</span>,
  },
  { key: 'meal', header: 'Meal', render: (row) => <span className="text-xs">{row.meal_slug ?? '—'}</span> },
  {
    key: 'place',
    header: 'Place',
    render: (row) => (
      <span className="block max-w-[140px] truncate font-mono text-[11px] text-ink-3">{row.place_id ?? '—'}</span>
    ),
  },
  {
    key: 'position',
    header: 'Pos',
    numeric: true,
    render: (row) => <span className="font-mono text-xs">{row.position ?? '—'}</span>,
  },
  {
    key: 'mode',
    header: 'Mode',
    render: (row) => (row.mode === null ? <span className="text-ink-3">—</span> : <Tag size="sm">{row.mode}</Tag>),
  },
  {
    key: 'url',
    header: 'Sent to',
    render: (row) => (
      <a
        href={row.url}
        target="_blank"
        rel="noreferrer"
        className="block max-w-[220px] truncate font-mono text-xs text-sky-on underline-offset-2 hover:underline"
      >
        {row.url}
      </a>
    ),
  },
];

/** Every tap through to Chowdeck, newest first. `Pos` says whether anyone scrolls. */
export default function AdminChowdeckClicksScreen() {
  const [skip, setSkip] = useState(0);
  const { data, isLoading, error } = useChowdeckClicks({ limit: LIMIT, skip });

  return (
    <ChowdeckShell section="clicks" title="Chowdeck · Clicks">
      <ChowdeckError error={error} title="Clicks did not load" />

      <div className="mb-4 flex items-center">
        <Show when={data !== undefined}>
          <span className="ml-auto font-mono text-xs text-ink-3">{data?.total ?? 0} clicks</span>
        </Show>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={COLUMNS}
        isLoading={isLoading}
        empty="Nobody has tapped through yet."
        rowKey={(row) => row.id}
      />

      <Pager total={data?.total ?? 0} limit={LIMIT} skip={skip} onSkip={setSkip} noun="clicks" />
    </ChowdeckShell>
  );
}
