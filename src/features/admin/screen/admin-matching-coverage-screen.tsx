import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { InfoCard, MetricTile } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Select } from '@ui/inputs';
import { Button } from '@ui/primitives';

import { useCoverage, useRuleShare } from '../hooks/use-matching';
import { ConsoleShell } from '../parts/console-shell';
import type { CoverageCell } from '../services/matching.api';

/**
 * The coverage map: which mood, weight and time combinations have a rule.
 *
 * The point is the GAPS — combinations with real demand that no rule covers.
 * The alternative to a map is nudging ranking weights and hoping, which is how
 * 284 of 426 meals ended up never appearing in a shortlist.
 *
 * It also shows how much of real traffic the curated layer now decides. That
 * number climbing towards everything is the "rules fossilise" risk: the ranker
 * stops mattering, and so does every improvement made to it afterwards.
 */

const MOOD_LABEL: Record<string, string> = {
  tired: 'Tired',
  fast: 'Hurry',
  proper: 'Up for it',
  comfort: 'Comfort',
  whatever: 'Whatever',
};

const WINDOW_OPTIONS = [
  { value: '168', label: 'Last 7 days' },
  { value: '24', label: 'Last 24 hours' },
  { value: '720', label: 'Last 30 days' },
] as const;

/**
 * A cell's shade.
 *
 * Covered-with-demand is the good case and gets the action colour. Demand with
 * NO rule is the finding, so it is the one that stands out — a gap nobody can
 * see is a gap nobody fills.
 */
function cellTone(cell: CoverageCell): string {
  if (cell.rules === 0 && cell.requests > 0) return 'border-caution-border bg-caution-soft';
  if (cell.rules > 0) return 'border-ink bg-sky-100';
  return 'border-line bg-paper-2';
}

export default function AdminMatchingCoverageScreen() {
  const navigate = useNavigate();
  const [hours, setHours] = useState('168');

  const window = Number(hours);
  const { data, isLoading } = useCoverage(window);
  const { data: share } = useRuleShare(window);

  const cells = data?.cells ?? [];
  const gaps = data?.gaps ?? [];

  /** Grouped by weight so the grid reads as one table per kind of meal. */
  const weights = [...new Set(cells.map((cell) => cell.weight))];
  const moods = [...new Set(cells.map((cell) => cell.mood))];
  const minuteBuckets = [...new Set(cells.map((cell) => cell.minutes))].sort((a, b) => a - b);

  return (
    <ConsoleShell
      active="matching"
      title="Coverage"
      actions={
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_MATCHING });
          }}
        >
          Back to rules
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select
          label="Window"
          value={hours}
          onValueChange={setHours}
          options={WINDOW_OPTIONS}
          size="sm"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile
          label="Combinations covered"
          value={`${String(data?.totals.covered ?? 0)} of ${String(data?.totals.combinations ?? 0)}`}
        />
        <MetricTile label="Gaps with real demand" value={gaps.length} />
        <MetricTile label="Requests in window" value={data?.totals.requests ?? 0} />
        <MetricTile label="Decided by a rule" value={`${String(share?.share ?? 0)}%`} />
      </div>

      {/* The fossilisation warning. A curated layer deciding most traffic means
          the ranker has stopped mattering, including every fix to it. */}
      <Show when={(share?.share ?? 0) > 60}>
        <div className="mb-4">
          <Callout
            tone="caution"
            title="Rules are deciding most of the traffic"
            body="At this share the ranker has largely stopped mattering, and so has every improvement made to it. Worth asking whether some of these rules should become ranking changes instead."
          />
        </div>
      </Show>

      <Show when={gaps.length > 0}>
        <div className="mb-4">
          <InfoCard title="Gaps worth filling first">
            <p className="mb-3 text-sm text-ink-2">
              Combinations people actually ask for, where no rule applies. Busiest first.
            </p>
            <div className="flex flex-col gap-1.5">
              {gaps.slice(0, 10).map((gap) => (
                <div
                  key={`${gap.mood}-${gap.weight}-${String(gap.minutes)}`}
                  className="flex items-center justify-between gap-3 rounded-blade-xs border border-caution-border bg-caution-soft px-2 py-1.5 text-sm"
                >
                  <span className="text-ink">
                    {MOOD_LABEL[gap.mood] ?? gap.mood} · {gap.weight} · {gap.minutes} minutes
                  </span>
                  <span className="font-mono text-xs font-extrabold text-caution-on">
                    {gap.requests} request{gap.requests === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
            <Show when={gaps.length > 10}>
              <p className="mt-2 text-xs text-ink-3">
                {gaps.length - 10} more gaps with lighter demand.
              </p>
            </Show>
          </InfoCard>
        </div>
      </Show>

      <Show when={isLoading}>
        <p className="text-sm text-ink-3">Loading…</p>
      </Show>

      <Show when={!isLoading && gaps.length === 0 && cells.length > 0}>
        <div className="mb-4">
          <Callout
            tone="info"
            title="No gaps with real demand"
            body="Every combination people actually asked for in this window has at least one rule, or had no traffic at all."
          />
        </div>
      </Show>

      {/* The map itself: one grid per weight, moods down, time across. */}
      <div className="flex flex-col gap-4">
        {weights.map((weight) => (
          <div key={weight} className="rounded-blade border border-line bg-white p-3">
            <h3 className="mb-2 font-display text-sm font-extrabold capitalize text-ink">
              {weight}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="p-1 text-left text-xs font-extrabold text-ink-3">Mood</th>
                    {minuteBuckets.map((minutes) => (
                      <th key={minutes} className="p-1 text-xs font-extrabold text-ink-3">
                        {minutes} min
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {moods.map((mood) => (
                    <tr key={mood}>
                      <td className="p-1 font-extrabold text-ink">
                        {MOOD_LABEL[mood] ?? mood}
                      </td>
                      {minuteBuckets.map((minutes) => {
                        const cell = cells.find(
                          (candidate) =>
                            candidate.mood === mood &&
                            candidate.weight === weight &&
                            candidate.minutes === minutes,
                        );
                        if (cell === undefined) return <td key={minutes} />;

                        return (
                          <td key={minutes} className="p-1">
                            <div
                              className={`rounded-blade-xs border p-1.5 text-center ${cellTone(cell)}`}
                              title={
                                cell.winner === null
                                  ? `${String(cell.requests)} requests, no rule`
                                  : `${String(cell.requests)} requests, ${String(cell.rules)} rules, winner: ${cell.winner}`
                              }
                            >
                              <p className="font-mono text-xs font-extrabold text-ink">
                                {cell.rules}
                              </p>
                              <p className="text-[10px] text-ink-3">{cell.requests} req</p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-ink-3">
        A cell counts the live rules that would match that combination with an empty kitchen.
        Rules that require specific ingredients only cover somebody who has them, so they do
        not count here.
      </p>
    </ConsoleShell>
  );
}
