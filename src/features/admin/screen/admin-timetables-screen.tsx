import { useState } from 'react';

import { Show } from 'meemaw';

import { formatDate } from '@shared/utils/format-date';
import { InfoCard, MetricTile } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Select } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { cn } from '@shared/utils/cn';

import {
  usePlannerStrategy,
  useSetPlannerStrategy,
  useStrategyComparison,
  useTimetableList,
  useTimetableQuality,
  useTimetableUsage,
} from '../hooks/use-admin-timetables';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import { TimetableDetailModal } from '../parts/timetable-detail-modal';
import type {
  PlannerStrategy,
  StrategyComparison,
  TimetableRow,
} from '../services/timetables.api';

/**
 * Timetable observability.
 *
 * TWO QUESTIONS, and both matter: is anybody using the planner, and is it
 * giving them something usable? A feature with traffic that produces
 * half-empty plans is worse than one nobody opens, because the people who
 * tried it now distrust it.
 *
 * Read-only throughout. Nothing here edits a plan.
 */

const WINDOW_OPTIONS = [
  { value: '30', label: 'Last 30 days' },
  { value: '7', label: 'Last 7 days' },
  { value: '90', label: 'Last 90 days' },
] as const;

function naira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

/** Shown if the strategy call has not landed yet, so the panel is never empty. */
const STRATEGY_FALLBACK: PlannerStrategy[] = ['compose', 'candidates', 'deterministic'];

const STRATEGY_LABELS: Record<PlannerStrategy, string> = {
  compose: 'Compose',
  candidates: 'Candidates',
  deterministic: 'Matcher only',
};

/**
 * What each one actually does, in a line.
 *
 * Written for whoever is deciding, not for whoever wrote it — the difference
 * that matters is whether the model is choosing FOOD or choosing ROWS.
 */
const STRATEGY_BLURB: Record<PlannerStrategy, string> = {
  compose: 'The model builds complete plates from the kitchen, then we match them to recipes.',
  candidates: 'We rank our recipes and the model arranges them. Cheaper, never invents a dish.',
  deterministic: 'No model. The budget-aware matcher alone.',
};

const COMPARE_COLUMNS: Column<StrategyComparison['rows'][number]>[] = [
  {
    key: 'strategy',
    header: 'Asked for',
    render: (row) => (
      <span className="font-extrabold text-ink">
        {STRATEGY_LABELS[row.strategy as PlannerStrategy] ?? row.strategy}
      </span>
    ),
  },
  { key: 'plans', header: 'Plans', numeric: true, render: (row) => row.plans },
  { key: 'meals', header: 'Meals/plan', numeric: true, render: (row) => row.avgMealsPerPlan },
  {
    key: 'toBuy',
    header: 'To buy',
    numeric: true,
    // The number the cook feels, and the one this whole effort is judged on.
    render: (row) => <span className="font-extrabold">{row.avgToBuy}</span>,
  },
  {
    key: 'matched',
    header: 'Matched',
    render: (row) =>
      row.matchedExact + row.matchedClose + row.matchedNone === 0 ? (
        <span className="text-xs text-ink-4">—</span>
      ) : (
        <span className="font-mono text-xs text-ink-2">
          {row.matchedExact} exact · {row.matchedClose} close ·{' '}
          <span className={row.matchedNone > 0 ? 'text-caution-onsoft' : undefined}>
            {row.matchedNone} new
          </span>
        </span>
      ),
  },
  {
    key: 'fallback',
    header: 'Fell back',
    numeric: true,
    render: (row) => (
      <span className={row.fallbackRate > 25 ? 'font-extrabold text-caution-onsoft' : undefined}>
        {row.fallbackRate}%
      </span>
    ),
  },
  {
    key: 'duration',
    header: 'Took',
    numeric: true,
    render: (row) =>
      row.avgDurationMs === 0 ? '—' : `${String(Math.round(row.avgDurationMs / 100) / 10)}s`,
  },
];

export default function AdminTimetablesScreen() {
  const [days, setDays] = useState('30');
  const [guestsOnly, setGuestsOnly] = useState(false);
  /** The plan being inspected, or null. */
  const [openPlan, setOpenPlan] = useState<string | null>(null);

  const window = Number(days);
  const { data: usage } = useTimetableUsage(window);
  const { data: quality } = useTimetableQuality(window);
  const { data: strategy } = usePlannerStrategy();
  const setStrategy = useSetPlannerStrategy();
  const { data: comparison, isLoading: comparisonLoading } = useStrategyComparison(window);
  const { data: list, isLoading } = useTimetableList({
    ...(guestsOnly && { guestsOnly: true }),
    limit: 100,
  });

  const plans = list?.plans ?? [];

  /**
   * The drop-off rate: rows created but never generated into.
   *
   * High here means somebody opened the flow and walked away at the configure
   * screen — which is a UI problem, not a planner problem, and the two need
   * telling apart.
   */
  const started = (usage?.plans ?? 0) + (usage?.abandoned ?? 0);
  const dropOff = started === 0 ? 0 : Math.round(((usage?.abandoned ?? 0) / started) * 100);

  const columns: Column<TimetableRow>[] = [
    {
      key: 'weekOf',
      header: 'Week',
      render: (row) => (
        <button
          type="button"
          className="flex flex-col text-left hover:underline"
          onClick={() => {
            // A MODAL, not a navigation: this is an inspection, and leaving
            // the page loses the filter, the scroll and the place in the list.
            setOpenPlan(row.id);
          }}
        >
          {/* Just the week. The created date has its own column now, and
              saying it twice made the first column twice as tall. */}
          <span className="font-extrabold text-ink">{row.weekOf}</span>
        </button>
      ),
    },
    {
      key: 'who',
      header: 'Who',
      render: (row) => (
        <Tag size="sm" tone={row.isGuest ? 'neutral' : 'info'}>
          {row.isGuest ? 'guest' : 'signed in'}
        </Tag>
      ),
    },
    { key: 'days', header: 'Days', numeric: true, render: (row) => row.days },
    { key: 'meals', header: 'Meals', numeric: true, render: (row) => row.meals },
    {
      /**
       * HOW IT WAS BUILT — the most useful column here now that two paths
       * exist. A rising share of `deterministic` means the model is failing
       * or being rejected by verification, and nothing else on this screen
       * would surface that.
       */
      key: 'strategy',
      header: 'Strategy',
      render: (row) => {
        if (row.generationStatus === 'pending') {
          // In words, not a tag: `info` is taken by `ai` below, and two
          // different meanings sharing one colour is how a glance misleads.
          return <span className="text-xs text-ink-3">building…</span>;
        }
        if (row.generationStatus === 'failed') {
          // `Tag` offers only neutral and info, so a failure is said in words
          // and colour rather than squeezed into a tone that does not exist.
          return (
            <span className="text-xs font-extrabold text-critical-onsoft">failed</span>
          );
        }
        if (row.strategy === null) {
          // Made before the AI path existed. Not the same as a fallback, and
          // showing it as one would overstate how often the model fails.
          return <span className="text-xs text-ink-4">—</span>;
        }
        return (
          <Tag size="sm" tone={row.strategy === 'ai' ? 'info' : 'neutral'}>
            {row.strategy}
          </Tag>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-ink-3">{formatDate(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <ConsoleShell active="timetables" title="Timetables">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select
          label="Window"
          value={days}
          onValueChange={setDays}
          options={WINDOW_OPTIONS}
          size="sm"
        />
        <Button
          size="sm"
          variant={guestsOnly ? 'primary' : 'secondary'}
          onClick={() => {
            setGuestsOnly((current) => !current);
          }}
        >
          {guestsOnly ? 'Showing guests' : 'Guests only'}
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Plans made" value={usage?.plans ?? 0} />
        <MetricTile label="By guests" value={usage?.guestPlans ?? 0} />
        <MetricTile label="Median meals" value={usage?.medianMeals ?? 0} />
        <MetricTile label="Reminders on" value={usage?.remindersOn ?? 0} />
      </div>

      {/* ── Which planner, and how they compare ──────────────────── */}
      <div className="mb-4">
        <InfoCard title="The planner">
          <p className="mb-3 text-sm text-ink-2">
            How a week gets built. Changing this affects every plan generated from now on.
          </p>

          <div className="flex flex-wrap gap-2">
            {(strategy?.options ?? STRATEGY_FALLBACK).map((option) => (
              <button
                key={option}
                type="button"
                disabled={setStrategy.isPending}
                onClick={() => {
                  setStrategy.mutate(option);
                }}
                className={cn(
                  'rounded-blade-xs border-2 px-3 py-2 text-left transition-all duration-fast disabled:opacity-50',
                  strategy?.strategy === option
                    ? 'border-ink bg-sky-soft shadow-drop-sm'
                    : 'border-line-2 bg-white hover:border-ink',
                )}
              >
                <span className="block text-sm font-extrabold text-ink">
                  {STRATEGY_LABELS[option]}
                </span>
                <span className="mt-0.5 block max-w-[34ch] text-xs text-ink-3">
                  {STRATEGY_BLURB[option]}
                </span>
              </button>
            ))}
          </div>

          {/*
           * The comparison. Grouped by what was ASKED for rather than what
           * ran, so a strategy that always falls back shows a 100% fallback
           * rate instead of disappearing from the table entirely.
           */}
          <div className="mt-4">
            <DataTable
              rows={comparison?.rows ?? []}
              isLoading={comparisonLoading}
              empty="No plans in this window yet."
              rowKey={(row) => row.strategy}
              columns={COMPARE_COLUMNS}
            />
            <p className="mt-2 text-xs text-ink-3">
              Grouped by the planner that was asked for. &ldquo;Fell back&rdquo; is how often
              that planner could not produce a usable week and the matcher ran instead.
            </p>
          </div>
        </InfoCard>
      </div>

      {/* The drop-off, called out rather than left as two numbers to divide. */}
      <Show when={dropOff > 40 && started > 10}>
        <div className="mb-4">
          <Callout
            tone="caution"
            title={`${String(dropOff)}% of people who started a plan never generated one`}
            body={`${String(usage?.abandoned ?? 0)} of ${String(started)} plans were created and left empty. That is a problem with the configure step, not with the planner.`}
          />
        </div>
      </Show>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <InfoCard title="What the runway told people">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-blade-xs border border-line p-2">
              <p className="font-mono text-base font-extrabold text-ink">
                {quality?.fullyCovered ?? 0}
              </p>
              <p className="text-xs text-ink-3">fully covered</p>
            </div>
            <div className="rounded-blade-xs border border-line p-2">
              <p className="font-mono text-base font-extrabold text-ink">
                {quality?.withShortfall ?? 0}
              </p>
              <p className="text-xs text-ink-3">had a shortfall</p>
            </div>
            <div className="rounded-blade-xs border border-caution-border bg-caution-soft p-2">
              <p className="font-mono text-base font-extrabold text-ink">
                {quality?.withUnknowns ?? 0}
              </p>
              <p className="text-xs text-ink-3">had unknowns</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-ink-3">
            Sampled {quality?.sampled ?? 0} plans. A shortfall is normal — it is what the market
            list is for.
          </p>

          {/*
           * The number worth watching. An unknown line means a recipe and a
           * kitchen measured the same thing differently, and the cook was told
           * so rather than given a guess. Rising here means the catalogue's
           * units need work, not that the runway is broken.
           */}
          <Show when={(quality?.withUnknowns ?? 0) > 0}>
            <div className="mt-3">
              <Callout
                tone="info"
                title={`${String(quality?.totalUnknownLines ?? 0)} ingredient lines could not be worked out`}
                body="Usually a recipe measuring in pieces against a kitchen measured by weight. These are reported honestly to the cook rather than guessed, but a rising count means the catalogue's units are worth a look."
              />
            </div>
          </Show>
        </InfoCard>

        <InfoCard title="What people ask for">
          <div className="mb-3">
            <p className="mb-1 text-xs font-extrabold uppercase tracking-overline text-ink-3">
              Plan length
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(usage?.byDays ?? []).map((entry) => (
                <span
                  key={entry.days}
                  className="rounded-blade-xs border border-line bg-paper-2 px-2 py-1 text-xs text-ink"
                >
                  {entry.days}d · <span className="font-mono font-extrabold">{entry.count}</span>
                </span>
              ))}
              <Show when={(usage?.byDays.length ?? 0) === 0}>
                <span className="text-xs text-ink-3">No plans yet.</span>
              </Show>
            </div>
          </div>

          <div className="mb-3">
            <p className="mb-1 text-xs font-extrabold uppercase tracking-overline text-ink-3">
              Cooking for
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(usage?.byHousehold ?? []).map((entry) => (
                <span
                  key={entry.household}
                  className="rounded-blade-xs border border-line bg-paper-2 px-2 py-1 text-xs text-ink"
                >
                  {entry.household} · <span className="font-mono font-extrabold">{entry.count}</span>
                </span>
              ))}
            </div>
          </div>

          <Show when={quality?.averageMarketNgn !== null}>
            <p className="text-xs text-ink-3">
              Average market list: {naira(quality?.averageMarketNgn ?? 0)} — an estimate, like
              every price in the product.
            </p>
          </Show>
        </InfoCard>
      </div>

      <DataTable
        rows={plans}
        columns={columns}
        isLoading={isLoading}
        empty="Nobody has made a plan yet."
        rowKey={(row) => row.id}
        // The whole row opens it, not just the week — a one-word target in
        // the first column is a hard thing to hit on a phone.
        onRowClick={(row) => {
          setOpenPlan(row.id);
        }}
      />

      <Show when={openPlan !== null}>
        <TimetableDetailModal
          planId={openPlan ?? ''}
          onClose={() => {
            setOpenPlan(null);
          }}
        />
      </Show>

      <p className="mt-4 text-xs text-ink-3">
        {list?.total ?? 0} plans in total. Opening one is recorded in the audit trail — a meal
        plan is personal data even when it is only food.
      </p>
    </ConsoleShell>
  );
}
