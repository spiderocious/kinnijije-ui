import { useState } from 'react';

import { Link, useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDateTime } from '@shared/utils/format-date';
import { InfoCard } from '@ui/admin';
import { Input, Switch } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import {
  CallStatusBadge,
  ChowdeckError,
  ChowdeckShell,
  OnOffBadge,
  Row,
} from '../chowdeck/chowdeck-parts';
import { CHOWDECK_FLAGS, type CallRow } from '../chowdeck/chowdeck.types';
import { useChowdeckOverview, useResetBreaker } from '../chowdeck/use-chowdeck';
import { useFeatureFlags, useSetFeatureFlag } from '../hooks/use-admin';
import { DataTable, type Column } from '../parts/data-table';

/** A number with its label. The console's one stat shape. */
function Stat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'good' | 'bad';
}) {
  const colour =
    tone === 'good' ? 'text-success-onsoft' : tone === 'bad' ? 'text-critical-onsoft' : 'text-ink';

  return (
    <div className="rounded-blade-xs border-hair border-line-2 bg-white p-3">
      <div className="text-[10.5px] font-extrabold uppercase tracking-label text-ink-3">{label}</div>
      <div className={`mt-1 font-display text-[26px] font-extrabold leading-none tnum ${colour}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {hint !== undefined && <div className="mt-1 text-[11px] text-ink-3">{hint}</div>}
    </div>
  );
}

/** A ranked list with a proportional bar, as on the decide overview. */
function Ranked({
  title,
  rows,
  empty,
  hint,
}: {
  title: string;
  rows: { label: string; count: number }[];
  empty: string;
  hint?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <InfoCard title={title}>
      <Show when={hint !== undefined}>
        <p className="mb-2 text-xs text-ink-3">{hint}</p>
      </Show>
      <Show when={rows.length > 0} fallback={<p className="text-sm text-ink-3">{empty}</p>}>
        <ul className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-ink">{row.label}</span>
              <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-pill bg-skeleton">
                <span
                  className="block h-full rounded-pill bg-sky"
                  style={{ width: `${String((row.count / max) * 100)}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right font-mono text-xs text-ink-2 tnum">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      </Show>
    </InfoCard>
  );
}

/**
 * The two switches. Labels and consequences come from the flag registry, the
 * same rows Settings reads, so the two screens can never describe one switch
 * two ways; the state comes from the overview, which is what the guards obey.
 */
const SWITCHES: { key: string; field: 'offers' | 'fetch'; fallback: string }[] = [
  { key: CHOWDECK_FLAGS.OFFERS, field: 'offers', fallback: 'Chowdeck offers' },
  { key: CHOWDECK_FLAGS.FETCH, field: 'fetch', fallback: 'Chowdeck fetching' },
];

const fromMap = (map: Record<string, number> | undefined) =>
  Object.entries(map ?? {})
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

const fromKeys = (rows: { key: string | null; count: number }[] | undefined) =>
  (rows ?? []).map((r) => ({ label: r.key ?? '(none)', count: r.count }));

const ms = (value: number | null | undefined) => (value === null || value === undefined ? '—' : `${String(value)}ms`);

const FAILURE_COLUMNS: Column<CallRow>[] = [
  {
    key: 'when',
    header: 'When',
    render: (row) => <span className="font-mono text-xs text-ink-3">{formatDateTime(row.created_at)}</span>,
  },
  { key: 'kind', header: 'Kind', render: (row) => <Tag size="sm">{row.kind}</Tag> },
  { key: 'status', header: 'Status', render: (row) => <CallStatusBadge status={row.status} /> },
  {
    key: 'asked',
    header: 'Asked',
    render: (row) => (
      <span className="max-w-[200px] truncate text-xs text-ink">
        {row.params['query'] ?? row.params['input'] ?? '—'}
      </span>
    ),
  },
  {
    key: 'error',
    header: 'Error',
    render: (row) => (
      <span className="block max-w-[320px] truncate text-xs text-critical-onsoft">{row.error ?? '—'}</span>
    ),
  },
];

/**
 * Chowdeck at a glance: are we allowed to call them, are they answering, and
 * is the cache doing its job of making sure we rarely have to.
 */
export default function AdminChowdeckScreen() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useChowdeckOverview();
  const flags = useFeatureFlags();
  const setFlag = useSetFeatureFlag();
  const reset = useResetBreaker();
  const [reason, setReason] = useState('');

  const guards = data?.guards;
  const breakerOpen = guards?.breaker.open === true;
  const capShare =
    guards === undefined || guards.today.cap === 0 ? 0 : guards.today.sent / guards.today.cap;

  const toggle = (flag: string, enabled: boolean) => {
    setFlag.mutate(
      { flag, enabled, ...(reason.trim().length > 0 && { reason: reason.trim() }) },
      {
        onSuccess: () => {
          setReason('');
        },
      },
    );
  };

  return (
    <ChowdeckShell section="overview" title="Chowdeck">
      <ChowdeckError error={error} title="The overview did not load" />
      <ChowdeckError error={setFlag.error} title="That switch did not save" />
      <ChowdeckError error={reset.error} title="The breaker did not reset" />

      <Show when={isLoading}>
        <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-skeleton" />
      </Show>

      <Show when={data !== undefined}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard
              title="Switches"
              action={
                <Link
                  to={ROUTES.ADMIN_SETTINGS}
                  className="text-xs text-sky-on underline-offset-2 hover:underline"
                >
                  All flags
                </Link>
              }
            >
              <div className="flex flex-col gap-4">
                {SWITCHES.map((item) => {
                  const flag = flags.data?.find((f) => f.key === item.key);
                  const enabled = data?.flags[item.field] ?? false;
                  return (
                    <div key={item.key}>
                      <Switch
                        checked={enabled}
                        disabled={setFlag.isPending}
                        onCheckedChange={(next) => {
                          toggle(item.key, next);
                        }}
                        label={flag?.label ?? item.fallback}
                      />
                      {/* Same framing as Settings: `when_off` is only true when it is. */}
                      <Show when={flag !== undefined}>
                        <p className="mt-1 text-xs text-ink-3">
                          {enabled ? (
                            <>
                              <span className="font-extrabold text-ink-2">Live.</span> If switched
                              off: {flag?.when_off}
                            </>
                          ) : (
                            flag?.when_off
                          )}
                        </p>
                      </Show>
                      <Show when={!enabled}>
                        <p className="mt-1 text-xs font-extrabold text-caution-onsoft">
                          Off for everybody
                          {flag?.updated_at === null || flag?.updated_at === undefined
                            ? ''
                            : ` — since ${formatDateTime(flag.updated_at)}`}
                        </p>
                      </Show>
                      <Show when={flag?.reason !== null && flag?.reason !== undefined}>
                        <p className="mt-0.5 text-xs text-ink-3">Reason: {flag?.reason}</p>
                      </Show>
                    </div>
                  );
                })}
                <Input
                  placeholder="Reason (optional, saved with the switch)"
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                  }}
                />
              </div>
            </InfoCard>

            <InfoCard
              title="Guards"
              tone={breakerOpen ? 'critical' : capShare >= 0.9 ? 'caution' : 'default'}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  loading={reset.isPending}
                  onClick={() => {
                    reset.mutate();
                  }}
                >
                  Reset breaker
                </Button>
              }
            >
              <Row
                label="breaker"
                value={
                  <span className="inline-flex items-center gap-2">
                    <OnOffBadge on={!breakerOpen} onLabel="closed" offLabel="open" />
                    <Show when={guards?.breaker.open_until !== null}>
                      <span className="text-xs text-ink-3">
                        until {formatDateTime(guards?.breaker.open_until)}
                      </span>
                    </Show>
                  </span>
                }
              />
              <Row
                label="failures in a row"
                value={`${String(guards?.breaker.consecutive_failures ?? 0)} of ${String(guards?.breaker.threshold ?? 0)}`}
              />
              <Row label="last failure" value={formatDateTime(guards?.breaker.last_failure_at)} />
              <Row label="last error" value={guards?.breaker.last_error ?? '—'} />
              <Row
                label="sent today"
                value={`${String(guards?.today.sent ?? 0)} of ${String(guards?.today.cap ?? 0)}`}
              />
              <Row label="per minute" value={guards?.per_minute ?? '—'} />
              <Row label="timeout" value={ms(guards?.timeout_ms)} />
              <Row label="in flight" value={guards?.in_flight ?? 0} />
            </InfoCard>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Calls, 24h"
              value={data?.calls_24h.total ?? 0}
              hint={`${String(data?.calls_24h.by_status['ok'] ?? 0)} ok`}
            />
            <Stat
              label="p50 / p95"
              value={`${ms(data?.calls_24h.p50_ms)} / ${ms(data?.calls_24h.p95_ms)}`}
              hint="refused calls excluded"
            />
            <Stat
              label="Today's allowance"
              value={`${String(Math.round(capShare * 100))}%`}
              hint={`${String(guards?.today.sent ?? 0)} of ${String(guards?.today.cap ?? 0)} calls`}
              tone={capShare >= 0.9 ? 'bad' : 'default'}
            />
            <Stat
              label="Places"
              value={data?.places.active ?? 0}
              hint={`active, of ${String(data?.places.total ?? 0)} saved`}
            />
            <Stat
              label="Cached searches"
              value={data?.cache.entries ?? 0}
              hint={`${String(data?.cache.by_status['ok'] ?? 0)} with offers, ${String(data?.cache.by_status['empty'] ?? 0)} empty`}
            />
            <Stat label="Cache hits" value={data?.cache.hits ?? 0} hint="calls the cache saved, all time" />
            <Stat label="Clicks, 7 days" value={data?.clicks_7d.total ?? 0} hint="taps through to Chowdeck" />
            <Stat
              label="Unavailable"
              value={data?.served.counts.unavailable ?? 0}
              hint="asked, and had nothing to show"
              tone={(data?.served.counts.unavailable ?? 0) > 0 ? 'bad' : 'good'}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <Ranked
              title="Calls by outcome, 24h"
              rows={fromMap(data?.calls_24h.by_status)}
              empty="No calls in the last day."
            />
            <Ranked
              title="Calls by cause, 24h"
              rows={fromMap(data?.calls_24h.by_trigger)}
              empty="No calls in the last day."
              hint="Refused calls excluded — these are the ones that reached them."
            />
            <Ranked
              title="Served from"
              rows={Object.entries(data?.served.counts ?? {}).map(([label, count]) => ({ label, count }))}
              empty="Nothing served yet."
              hint={`Since the server started, ${formatDateTime(data?.served.since)}.`}
            />
          </div>

          <InfoCard title="Recent failures">
            <DataTable
              rows={data?.recent_failures ?? []}
              columns={FAILURE_COLUMNS}
              isLoading={false}
              empty="Nothing has failed recently."
              rowKey={(row) => row.id}
              onRowClick={(row) => {
                void navigate({ to: ROUTES.ADMIN_CHOWDECK_REQUEST(row.id) });
              }}
            />
          </InfoCard>

          <div className="grid gap-3 lg:grid-cols-4">
            <Ranked title="Clicks by meal" rows={fromKeys(data?.clicks_7d.by_meal)} empty="No clicks." />
            <Ranked title="Clicks by restaurant" rows={fromKeys(data?.clicks_7d.by_vendor)} empty="No clicks." />
            <Ranked title="Clicks by place" rows={fromKeys(data?.clicks_7d.by_place)} empty="No clicks." />
            <Ranked title="Clicks by mode" rows={fromKeys(data?.clicks_7d.by_mode)} empty="No clicks." />
          </div>

          <InfoCard title="Settings">
            <p className="mb-2 text-xs text-ink-3">From the server&rsquo;s environment. Read-only here.</p>
            <div className="grid gap-x-6 lg:grid-cols-2">
              <div>
                <Row label="fresh for" value={`${String(data?.settings.fresh_hours ?? 0)}h`} />
                <Row label="served stale up to" value={`${String(data?.settings.stale_max_hours ?? 0)}h`} />
                <Row label="empty fresh for" value={`${String(data?.settings.empty_fresh_hours ?? 0)}h`} />
              </div>
              <div>
                <Row label="call log kept" value={`${String(data?.settings.call_log_ttl_days ?? 0)} days`} />
                <Row label="api base" value={data?.settings.api_base ?? '—'} />
                <Row label="web base" value={data?.settings.web_base ?? '—'} />
              </div>
            </div>
          </InfoCard>
        </div>
      </Show>
    </ChowdeckShell>
  );
}
