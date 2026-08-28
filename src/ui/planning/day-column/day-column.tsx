import { Repeat, Show } from 'meemaw';

import { cn } from '@shared/utils/cn';
import { MealSlot, type PlannedMeal } from '../planning/planning';

/**
 * One day in the week plan, with every slot it holds.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/463-day-column.html
 *
 * Extracted from `WeekPlanScene`, which had inlined it.
 *
 * **A day is a column, not a slot.** The distinction matters because a real
 * week has more than one meal in a day — modelling the day as a single slot is
 * what forces "dinner only", and the product should not decide that for someone
 * who cooks lunch.
 */

export interface DaySlot {
  readonly id: string;
  /** "Lunch", "Dinner". */
  readonly meal: string;
  readonly planned?: PlannedMeal;
  readonly cooked?: boolean;
  readonly missing?: boolean;
}

export interface DayColumnProps {
  readonly day: string;
  /** Shortened on a narrow grid — "Mon". */
  readonly shortDay?: string;
  readonly slots: readonly DaySlot[];
  readonly onPick?: (slotId: string) => void;
  readonly onClear?: (slotId: string) => void;
  /** Marks today, so a week grid has a here. */
  readonly today?: boolean;
  readonly className?: string;
}

export function DayColumn({
  day,
  shortDay,
  slots,
  onPick,
  onClear,
  today = false,
  className,
}: DayColumnProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <p
        className={cn(
          'text-xs font-extrabold uppercase tracking-overline',
          today ? 'text-sky-on' : 'text-ink-3',
        )}
      >
        {shortDay ?? day}
        <Show when={today}>
          <span className="ml-1 font-sans normal-case tracking-normal text-sky">· today</span>
        </Show>
      </p>

      <Repeat each={[...slots]}>
        {(slot: DaySlot) => (
          <MealSlot
            key={slot.id}
            day={slot.meal}
            meal={slot.planned}
            cooked={slot.cooked ?? false}
            missing={slot.missing ?? false}
            onPick={onPick === undefined ? undefined : () => onPick(slot.id)}
            onClear={onClear === undefined ? undefined : () => onClear(slot.id)}
          />
        )}
      </Repeat>
    </div>
  );
}

export interface PlanSummaryProps {
  readonly plannedCount: number;
  readonly totalSlots: number;
  readonly toBuy: number;
  readonly estimate?: string;
  readonly className?: string;
}

/**
 * What a week's plan adds up to.
 *
 * Visual spec: 464-plan-summary.html
 *
 * **The spend is always approximate** — it is derived from market prices we
 * have seen, not from receipts, and stating it flatly would be a claim the
 * product cannot back.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/464-plan-summary.html */
export function PlanSummary({
  plannedCount,
  totalSlots,
  toBuy,
  estimate,
  className,
}: PlanSummaryProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-6 gap-y-2 rounded-blade border border-line-2 bg-paper-2 px-4 py-3',
        className,
      )}
    >
      <span className="text-sm text-ink-2">
        <b className="font-mono font-bold tnum text-ink">{plannedCount}</b> of{' '}
        <span className="font-mono tnum">{totalSlots}</span> planned
      </span>
      <span className="text-sm text-ink-2">
        <b className="font-mono font-bold tnum text-ink">{toBuy}</b>{' '}
        {toBuy === 1 ? 'thing' : 'things'} to buy
      </span>
      <Show when={estimate !== undefined}>
        <span className="text-sm text-ink-2">
          roughly <b className="font-mono font-bold tnum text-ink">≈{estimate}</b>
        </span>
      </Show>
    </div>
  );
}

/** Loading a day. The slot rail is known before its meals are. */
export function DayColumnSkeleton({
  slots = 2,
  className,
}: {
  readonly slots?: number;
  readonly className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn('flex min-w-0 flex-col gap-2', className)}>
      <span className="block h-[13px] w-10 animate-shimmer rounded-[3px] bg-skeleton" />
      {Array.from({ length: slots }, (_, i) => (
        <span key={i} className="block h-[64px] w-full animate-shimmer rounded-blade-sm bg-skeleton" />
      ))}
    </div>
  );
}

/**
 * Planned, but the kitchen cannot cover it.
 *
 * **Not a load failure — the plan is real and stays on screen.** This says the
 * ingredients are short, which is actionable, so it links to the market list
 * rather than offering a retry that would change nothing.
 */
export function DayColumnShort({
  day,
  missingCount,
  onOpenMarket,
  className,
}: {
  readonly day: string;
  readonly missingCount: number;
  readonly onOpenMarket?: () => void;
  readonly className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <span className="text-xs font-extrabold uppercase tracking-overline text-ink-3">{day}</span>
      <div className="rounded-blade-sm border border-warning-border bg-warning-soft p-3">
        <p className="text-sm font-extrabold text-warning-onsoft">
          Short {missingCount} {missingCount === 1 ? 'thing' : 'things'}
        </p>
        <Show when={onOpenMarket !== undefined}>
          <button
            type="button"
            onClick={onOpenMarket}
            className="mt-1 text-xs font-extrabold text-sky hover:underline"
          >
            Add to market list
          </button>
        </Show>
      </div>
    </div>
  );
}

/**
 * The kitchen covers the whole plan.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/464-plan-summary.html
 *
 * The good outcome, and it gets said plainly — a summary that only ever speaks
 * up about shortfalls trains the user to read its silence as an error.
 */
export function PlanSummaryCovered({ className }: { readonly className?: string }) {
  return (
    <p className={cn('text-sm font-extrabold text-good-onsoft', className)}>
      Everything on this plan is already in your kitchen.
    </p>
  );
}

/** Built from an old count. The plan is real; the coverage may have moved. */
export function PlanSummaryStale({
  age,
  onRefresh,
  className,
}: {
  readonly age: string;
  readonly onRefresh?: () => void;
  readonly className?: string;
}) {
  return (
    <p className={cn('flex flex-wrap items-center gap-2 text-sm text-ink-3', className)}>
      <span>Based on your kitchen as of {age}.</span>
      <Show when={onRefresh !== undefined}>
        <button
          type="button"
          onClick={onRefresh}
          className="font-extrabold text-sky hover:underline"
        >
          Recheck
        </button>
      </Show>
    </p>
  );
}
