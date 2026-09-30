import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDateTime } from '@shared/utils/format-date';
import { Input } from '@ui/inputs';
import { Tag } from '@ui/status';

import { CallStatusBadge, ChowdeckError, ChowdeckShell, Pager } from '../chowdeck/chowdeck-parts';
import {
  CALL_KINDS,
  CALL_STATUSES,
  CALL_TRIGGERS,
  type CallRow,
} from '../chowdeck/chowdeck.types';
import { useChowdeckCalls, useChowdeckPlaces } from '../chowdeck/use-chowdeck';
import { DataTable, type Column } from '../parts/data-table';

const LIMIT = 50;

const SELECT = 'rounded-blade-xs border border-line bg-white px-3 py-2 text-sm';

/** `datetime-local` gives local wall time with no zone; the server wants ISO. */
const toIso = (local: string): string | undefined => {
  const date = new Date(local);
  return local.length === 0 || Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const COLUMNS: Column<CallRow>[] = [
  {
    key: 'when',
    header: 'When',
    render: (row) => <span className="font-mono text-xs text-ink-3">{formatDateTime(row.created_at)}</span>,
  },
  { key: 'kind', header: 'Kind', render: (row) => <Tag size="sm">{row.kind}</Tag> },
  {
    key: 'trigger',
    header: 'Cause',
    render: (row) => (
      <Tag size="sm" tone={row.trigger === 'user' ? 'neutral' : 'info'}>
        {row.trigger}
      </Tag>
    ),
  },
  { key: 'status', header: 'Status', render: (row) => <CallStatusBadge status={row.status} /> },
  {
    key: 'http',
    header: 'HTTP',
    numeric: true,
    render: (row) => <span className="font-mono text-xs">{row.http_status ?? '—'}</span>,
  },
  {
    key: 'ms',
    header: 'ms',
    numeric: true,
    render: (row) => <span className="font-mono text-xs">{row.duration_ms}</span>,
  },
  {
    key: 'results',
    header: 'Results',
    numeric: true,
    render: (row) => <span className="font-mono text-xs">{row.result_count ?? '—'}</span>,
  },
  {
    key: 'asked',
    header: 'Asked',
    render: (row) => (
      <span className="block max-w-[200px] truncate text-xs font-bold text-ink">
        {row.params['query'] ?? row.params['input'] ?? '—'}
      </span>
    ),
  },
  {
    key: 'place',
    header: 'Place id',
    render: (row) => (
      <span className="block max-w-[140px] truncate font-mono text-[11px] text-ink-3">
        {row.params['address_id'] ?? '—'}
      </span>
    ),
  },
  {
    key: 'error',
    header: 'Error',
    render: (row) => (
      <Show when={row.error !== null} fallback={<span className="text-ink-3">—</span>}>
        <span className="block max-w-[240px] truncate text-xs text-critical-onsoft">{row.error}</span>
      </Show>
    ),
  },
];

/**
 * Every request we sent Chowdeck — and every one our own guards refused to
 * send, which is logged the same way so the two can be read side by side.
 */
export default function AdminChowdeckRequestsScreen() {
  const navigate = useNavigate();
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('');
  const [trigger, setTrigger] = useState('');
  const [q, setQ] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [skip, setSkip] = useState(0);

  const places = useChowdeckPlaces();
  const { data, isLoading, error } = useChowdeckCalls({
    ...(kind.length > 0 && { kind }),
    ...(status.length > 0 && { status }),
    ...(trigger.length > 0 && { trigger }),
    ...(q.trim().length > 0 && { q: q.trim() }),
    ...(placeId.length > 0 && { place_id: placeId }),
    from: toIso(from),
    to: toIso(to),
    limit: LIMIT,
    skip,
  });

  /** Any filter change starts again from the newest. */
  const filter = (set: (value: string) => void) => (value: string) => {
    set(value);
    setSkip(0);
  };

  return (
    <ChowdeckShell section="requests" title="Chowdeck · Requests">
      <ChowdeckError error={error} title="The request log did not load" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search what was asked…"
          value={q}
          onChange={(event) => {
            filter(setQ)(event.target.value);
          }}
          className="max-w-[220px]"
        />
        <select
          value={kind}
          onChange={(event) => {
            filter(setKind)(event.target.value);
          }}
          aria-label="Filter by kind"
          className={SELECT}
        >
          <option value="">Every kind</option>
          {CALL_KINDS.map((value) => (
            <option key={value} value={value}>
              {value}
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
          <option value="">Any status</option>
          {CALL_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={trigger}
          onChange={(event) => {
            filter(setTrigger)(event.target.value);
          }}
          aria-label="Filter by cause"
          className={SELECT}
        >
          <option value="">Any cause</option>
          {CALL_TRIGGERS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
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
        <label className="flex items-center gap-1 text-xs text-ink-3">
          from
          <input
            type="datetime-local"
            value={from}
            onChange={(event) => {
              filter(setFrom)(event.target.value);
            }}
            className={SELECT}
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-ink-3">
          to
          <input
            type="datetime-local"
            value={to}
            onChange={(event) => {
              filter(setTo)(event.target.value);
            }}
            className={SELECT}
          />
        </label>

        <Show when={data !== undefined}>
          <span className="ml-auto font-mono text-xs text-ink-3">{data?.total ?? 0} calls</span>
        </Show>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={COLUMNS}
        isLoading={isLoading}
        empty="No calls match that."
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          void navigate({ to: ROUTES.ADMIN_CHOWDECK_REQUEST(row.id) });
        }}
      />

      <Pager total={data?.total ?? 0} limit={LIMIT} skip={skip} onSkip={setSkip} noun="calls" />
    </ChowdeckShell>
  );
}
