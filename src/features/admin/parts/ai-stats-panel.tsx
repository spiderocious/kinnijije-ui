import { useState } from 'react';
import { Show } from 'meemaw';

import { InfoCard } from '@ui/admin';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useAiStats } from '../hooks/use-admin';
import type { AiStats } from '../services/admin.api';

/** Big numbers read better short: 4.1M beats 4,140,882. */
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

/** Null cost is "we do not know", never zero. */
function money(usd: number | null): string {
  return usd === null ? '—' : `$${usd.toFixed(2)}`;
}

function Stat({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'good' | 'bad';
}) {
  const box =
    tone === 'bad'
      ? 'border-critical-border bg-critical-soft'
      : tone === 'good'
        ? 'border-success-border bg-success-soft'
        : 'border-line-2 bg-white';
  const ink =
    tone === 'bad' ? 'text-critical-onsoft' : tone === 'good' ? 'text-success-onsoft' : 'text-ink';

  return (
    <div className={`rounded-blade-xs border-hair p-3 ${box}`}>
      <div className="text-[10px] font-extrabold uppercase tracking-label text-ink-3">{label}</div>
      <div className={`mt-1 font-display text-[23px] font-extrabold leading-none tnum ${ink}`}>
        {value}
      </div>
      {sub !== undefined && <div className="mt-1 text-[11px] text-ink-3">{sub}</div>}
    </div>
  );
}

/**
 * Calls per day.
 *
 * Bars rather than a line: the data is a count per bucket, and a line between
 * two daily totals implies values in between that do not exist. The last bar is
 * marked because a part-day always looks like a collapse otherwise.
 */
function DailyBars({ daily }: { daily: AiStats['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => d.calls));

  return (
    <Show when={daily.length > 0} fallback={<p className="text-sm text-ink-3">No calls yet.</p>}>
      <div className="flex h-[92px] items-end gap-[3px] pt-2">
        {daily.map((day, i) => {
          const isToday = i === daily.length - 1;
          return (
            <span
              key={day.date}
              title={`${day.date}: ${String(day.calls)} calls, ${String(day.failed)} failed`}
              className={[
                'block flex-1 rounded-t-[5px] border-hair border-ink',
                isToday ? 'bg-grape' : day.failed > 0 ? 'bg-caution' : 'bg-sky',
              ].join(' ')}
              style={{ height: `${String(Math.max(4, (day.calls / max) * 100))}%` }}
            />
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-ink-3">
        {daily.length} days · amber had failures · the last bar is today, still filling
      </p>
    </Show>
  );
}

/** A ranked list with a proportional bar: "compared to what" at a glance. */
function Ranked({
  rows,
  empty,
}: {
  rows: { label: string; count: number; note?: string }[];
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Show when={rows.length > 0} fallback={<p className="text-sm text-ink-3">{empty}</p>}>
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-xs text-ink">{row.label}</span>
              {row.note !== undefined && (
                <span className="block text-[10.5px] text-ink-3">{row.note}</span>
              )}
            </span>
            <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-pill bg-skeleton">
              <span
                className="block h-full rounded-pill bg-sky"
                style={{ width: `${String((row.count / max) * 100)}%` }}
              />
            </span>
            <span className="w-12 shrink-0 text-right font-mono text-xs text-ink-2 tnum">
              {compact(row.count)}
            </span>
          </li>
        ))}
      </ul>
    </Show>
  );
}

const WINDOWS = [7, 30, 90] as const;

/**
 * The numbers above the log.
 *
 * Answers the three questions a list cannot: what is it costing, which prompt
 * is failing, and is it getting slower.
 */
export function AiStatsPanel() {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading } = useAiStats(days);

  const t = data?.totals;
  const failRate = t === undefined || t.calls === 0 ? 0 : (t.failed + t.rejected) / t.calls;
  const perDay = t === undefined || data === undefined ? null : (t.estimated_usd ?? 0) / data.days;

  // `mock` in production means the model never ran and nothing else says so.
  const mocked = (data?.by_provider ?? []).find((p) => p.provider === 'mock')?.calls ?? 0;

  return (
    <div className="mb-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-extrabold text-ink">The last {days} days</h2>
        <span className="flex gap-1">
          {WINDOWS.map((w) => (
            <Button
              key={w}
              size="sm"
              variant={days === w ? 'primary' : 'tertiary'}
              onClick={() => { setDays(w); }}
            >
              {w}d
            </Button>
          ))}
        </span>
      </div>

      <Show when={!isLoading} fallback={<p className="text-sm text-ink-3">Loading…</p>}>
        <Show when={mocked > 0}>
          <div className="rounded-blade-xs border-hair border-critical-border bg-critical-soft px-3 py-2 text-[12.5px] text-critical-onsoft">
            <b>{compact(mocked)} calls answered by the mock provider.</b> No model actually ran for
            those. Check <code>OPENAI_API_KEY</code> and <code>AI_PROVIDER</code>.
          </div>
        </Show>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Calls"
            value={compact(t?.calls ?? 0)}
            sub={`${String(Math.round((1 - failRate) * 100))}% clean`}
          />
          <Stat
            label="Tokens"
            value={compact((t?.tokens_in ?? 0) + (t?.tokens_out ?? 0))}
            sub={`${compact(t?.tokens_in ?? 0)} in · ${compact(t?.tokens_out ?? 0)} out`}
          />
          <Stat
            label="Est. spend"
            value={money(t?.estimated_usd ?? null)}
            sub={perDay === null ? undefined : `≈ ${money(perDay)} / day`}
          />
          <Stat
            label="Failed or rejected"
            value={compact((t?.failed ?? 0) + (t?.rejected ?? 0))}
            sub={`${String(t?.failed ?? 0)} errored · ${String(t?.rejected ?? 0)} did not parse`}
            tone={failRate > 0.05 ? 'bad' : 'good'}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Median"
            value={`${String(t?.p50_ms ?? 0)}ms`}
            sub="half of all calls are faster than this"
          />
          <Stat
            label="p95"
            value={`${String(t?.p95_ms ?? 0)}ms`}
            sub="what the slow one in twenty feels"
            tone={(t?.p95_ms ?? 0) > 8000 ? 'bad' : 'default'}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <InfoCard title="Calls per day">
            <DailyBars daily={data?.daily ?? []} />
          </InfoCard>

          <InfoCard title="By prompt">
            <Ranked
              rows={(data?.by_prompt ?? []).map((p) => ({
                label: p.prompt_id,
                count: p.calls,
                note: [
                  money(p.estimated_usd),
                  `p95 ${String(p.p95_ms)}ms`,
                  p.rejected > 0 ? `${String(p.rejected)} rejected` : null,
                  p.avg_ambiguity === null ? null : `ambiguity ${p.avg_ambiguity.toFixed(2)}`,
                ]
                  .filter((part): part is string => part !== null)
                  .join(' · '),
              }))}
              empty="No prompts have run."
            />
          </InfoCard>

          <InfoCard title="By model">
            <Ranked
              rows={(data?.by_model ?? []).map((m) => ({
                label: m.model,
                count: m.calls,
                note: `${compact(m.tokens)} tokens · ${money(m.estimated_usd)}`,
              }))}
              empty="No models recorded."
            />
          </InfoCard>

          <InfoCard title="By provider">
            <div className="flex flex-wrap gap-1.5">
              {(data?.by_provider ?? []).map((p) => (
                <Tag key={p.provider} tone={p.provider === 'mock' ? 'neutral' : 'info'}>
                  {p.provider} · {compact(p.calls)}
                </Tag>
              ))}
              <Show when={(data?.by_provider ?? []).length === 0}>
                <p className="text-sm text-ink-3">No providers recorded.</p>
              </Show>
            </div>
          </InfoCard>
        </div>
      </Show>
    </div>
  );
}
