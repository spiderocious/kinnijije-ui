import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDateTime } from '@shared/utils/format-date';
import { InfoCard } from '@ui/admin';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useDecideLogs, useDecideOverview } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { DecideLogRow } from '../services/admin.api';

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

/**
 * A ranked list with a proportional bar.
 *
 * A bare count answers "how many"; the bar answers "compared to what", which is
 * the question actually being asked when scanning a top-ten.
 */
function Ranked({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { label: string; count: number }[];
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <InfoCard title={title}>
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

const COLUMNS: Column<DecideLogRow>[] = [
  {
    key: 'when',
    header: 'When',
    render: (row) => (
      <span className="flex flex-col">
        <span className="text-xs text-ink">{formatDateTime(row.created_at)}</span>
        <span className="font-mono text-[10.5px] text-ink-4">{row.visitor}</span>
      </span>
    ),
  },
  {
    key: 'asked',
    header: 'What they said',
    render: (row) => (
      <span className="flex flex-col gap-1">
        <span className="flex flex-wrap gap-1">
          <Tag size="sm">{row.mood}</Tag>
          <Tag size="sm">{row.weight}</Tag>
          <Tag size="sm">{row.minutes}m</Tag>
          <Show when={row.city !== null}>
            <Tag size="sm">{row.city}</Tag>
          </Show>
        </span>
        <span className="max-w-[320px] truncate text-xs text-ink-3">
          {row.kitchen_items.length > 0
            ? row.kitchen_items.join(', ')
            : row.kitchen_skipped
              ? '(said they have nothing)'
              : '(nothing picked)'}
        </span>
      </span>
    ),
  },
  {
    key: 'answer',
    header: 'What we said',
    render: (row) => (
      <Show
        when={row.verdict_name !== null}
        fallback={<span className="text-xs font-extrabold text-critical-onsoft">nothing fit</span>}
      >
        <span className="flex flex-col">
          <span className="text-xs font-bold text-ink">{row.verdict_name}</span>
          <span className="max-w-[340px] truncate text-[11px] text-ink-3">{row.why}</span>
        </span>
      </Show>
    ),
  },
  {
    key: 'score',
    header: 'Score',
    numeric: true,
    render: (row) => (
      <span className="font-mono text-xs text-ink-2 tnum">
        {row.verdict_score === null ? '—' : row.verdict_score.toFixed(2)}
      </span>
    ),
  },
  {
    key: 'pool',
    header: 'Pool',
    numeric: true,
    render: (row) => <span className="font-mono text-xs text-ink-2 tnum">{row.pool_size}</span>,
  },
  {
    key: 'how',
    header: 'How',
    render: (row) => (
      <span className="flex flex-col gap-0.5">
        <Tag size="sm" tone={row.provenance === 'ai_framed' ? 'info' : 'neutral'}>
          {row.provenance === 'ai_framed' ? 'AI' : 'templated'}
        </Tag>
        <span className="font-mono text-[10.5px] text-ink-4 tnum">{row.duration_ms}ms</span>
      </span>
    ),
  },
];

export default function AdminDecideScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'empty' | 'deterministic'>('all');
  const { data: overview, isLoading: loadingOverview } = useDecideOverview();

  const { data: logs, isLoading: loadingLogs } = useDecideLogs({
    limit: 100,
    ...(filter === 'empty' && { empty: 'true' }),
    ...(filter === 'deterministic' && { provenance: 'deterministic' }),
  });

  const totals = overview?.totals;
  const aiShare =
    totals === undefined || totals.decisions === 0
      ? 0
      : Math.round((totals.ai_framed / totals.decisions) * 100);
  const emptyShare =
    totals === undefined || totals.decisions === 0
      ? 0
      : Math.round((totals.empty_verdicts / totals.decisions) * 100);

  return (
    <ConsoleShell active="decide" title="Decide flow">
      <Show when={!loadingOverview} fallback={<p className="text-sm text-ink-3">Loading…</p>}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Decisions" value={totals?.decisions ?? 0} hint="all time" />
            <Stat label="Today" value={totals?.today ?? 0} hint={`${String(totals?.last_7_days ?? 0)} this week`} />
            <Stat
              label="Visitors"
              value={totals?.distinct_visitors ?? 0}
              hint="distinct, by hashed IP"
            />
            <Stat
              label="Median time"
              value={`${String(totals?.median_duration_ms ?? 0)}ms`}
              hint="median, not mean"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Nothing fit"
              value={`${String(emptyShare)}%`}
              hint={`${String(totals?.empty_verdicts ?? 0)} decisions returned no meal`}
              tone={emptyShare > 5 ? 'bad' : 'good'}
            />
            <Stat
              label="AI contributed"
              value={`${String(aiShare)}%`}
              hint={`${String(totals?.deterministic ?? 0)} fell back to templated`}
              tone={aiShare > 70 ? 'good' : 'bad'}
            />
            <Stat
              label="Empty kitchen"
              value={`${String(Math.round((overview?.empty_kitchen_rate ?? 0) * 100))}%`}
              hint="submitted no ingredients at all"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Ranked
              title="What they have"
              rows={(overview?.top_ingredients ?? []).map((r) => ({ label: r.name, count: r.count }))}
              empty="Nobody has picked an ingredient yet."
            />
            <Ranked
              title="What we suggest"
              rows={(overview?.top_verdicts ?? []).map((r) => ({ label: r.name, count: r.count }))}
              empty="No verdicts yet."
            />
            <Ranked
              title="Mood"
              rows={(overview?.moods ?? []).map((r) => ({ label: r.value, count: r.count }))}
              empty="No moods yet."
            />
            <Ranked
              title="Wanted"
              rows={(overview?.weights ?? []).map((r) => ({ label: r.value, count: r.count }))}
              empty="No preferences yet."
            />
            <Ranked
              title="Refused"
              rows={(overview?.top_rejected ?? []).map((r) => ({
                label: r.name ?? r.meal_id,
                count: r.count,
              }))}
              empty="Nobody has refused a suggestion."
            />
            <Ranked
              title="Cities"
              rows={(overview?.cities ?? []).map((r) => ({ label: r.name, count: r.count }))}
              empty="No cities given."
            />
          </div>

          <InfoCard
            title="Every decision"
            action={
              <span className="flex gap-1">
                {(['all', 'empty', 'deterministic'] as const).map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={filter === value ? 'primary' : 'tertiary'}
                    onClick={() => { setFilter(value); }}
                  >
                    {value === 'all' ? 'All' : value === 'empty' ? 'Nothing fit' : 'No AI'}
                  </Button>
                ))}
              </span>
            }
          >
            <DataTable
              rows={logs?.items ?? []}
              columns={COLUMNS}
              isLoading={loadingLogs}
              empty="No decisions recorded yet."
              rowKey={(row) => row.id}
              onRowClick={(row) => {
                void navigate({ to: ROUTES.ADMIN_DECIDE_LOG(row.id) });
              }}
            />
          </InfoCard>
        </div>
      </Show>
    </ConsoleShell>
  );
}
