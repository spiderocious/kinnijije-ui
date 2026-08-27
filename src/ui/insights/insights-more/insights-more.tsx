import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Figure, PriceDisplay } from '@ui/display';

/**
 * The remaining insight components.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/442-nutrition-balance.html
 *                                                          445-spend-estimate.html
 *                                                          446-repeat-meal.html
 */

/* ---------- 442 · Nutrition balance ---------- */

export type FoodCategory = 'grains' | 'protein' | 'greens' | 'other';

const CATEGORY_LABEL: Record<FoodCategory, string> = {
  grains: 'Grains and starch',
  protein: 'Protein',
  greens: 'Greens and veg',
  other: 'Everything else',
};

const CATEGORY_CLASS: Record<FoodCategory, string> = {
  grains: 'bg-dish-fill',
  greens: 'bg-greens-fill',
  protein: 'bg-berry-fill',
  other: 'bg-paper-3',
};

export interface NutritionBalanceProps {
  readonly shares: Readonly<Record<FoodCategory, number>>;
  readonly mealCount: number;
  readonly className?: string;
}

/**
 * What the week looked like, by rough category.
 *
 * **Not calories, not macros** — the PRD explicitly excludes both. This is a
 * shape, and **the copy never pretends otherwise**: a product that cannot see
 * what went into the pot has no business reporting a gram figure.
 */
/** Below this, the shape would be noise rather than a pattern. */
const MIN_MEALS_FOR_A_SHAPE = 3;

export function NutritionBalance({ shares, mealCount, className }: NutritionBalanceProps) {
  const categories: FoodCategory[] = ['grains', 'protein', 'greens', 'other'];
  const total = categories.reduce((sum, key) => sum + shares[key], 0) || 1;

  // Fewer than three meals is not enough to draw a shape. Rendering the bar
  // anyway would turn one dinner into a claim about the whole week — and this
  // is the component whose entire job is to be honest about roughness.
  if (mealCount < MIN_MEALS_FOR_A_SHAPE) {
    return (
      <div className={cn('rounded-blade border border-line-2 bg-white p-4', className)}>
        <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
          Roughly, this week
        </p>
        <p className="mt-3 text-sm text-ink-3">
          Not enough meals yet to show a balance. Cook{' '}
          {MIN_MEALS_FOR_A_SHAPE - mealCount} more and this fills in.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-blade border border-line-2 bg-white p-4', className)}>
      <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
        Roughly, this week
      </p>

      {/* One bar, four bands — a shape rather than a figure. */}
      <div className="mt-3 flex h-4 overflow-hidden rounded-pill border border-line-2">
        <Repeat each={categories}>
          {(key: FoodCategory) => (
            <span
              key={key}
              aria-label={`${CATEGORY_LABEL[key]}: about ${Math.round((shares[key] / total) * 100)}%`}
              className={CATEGORY_CLASS[key]}
              style={{ width: `${(shares[key] / total) * 100}%` }}
            />
          )}
        </Repeat>
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        <Repeat each={categories}>
          {(key: FoodCategory) => (
            <li key={key} className="flex items-center gap-2 text-sm">
              <span className={cn('h-3 w-3 shrink-0 rounded-[3px]', CATEGORY_CLASS[key])} />
              <span className="min-w-0 flex-1 text-ink-2">{CATEGORY_LABEL[key]}</span>
              <span className="font-mono text-xs tnum text-ink-3">
                {Math.round((shares[key] / total) * 100)}%
              </span>
            </li>
          )}
        </Repeat>
      </ul>

      {/* The copy never pretends to more than it has. */}
      <p className="mt-3 text-xs text-ink-3">
        A rough shape from {mealCount} cooked {mealCount === 1 ? 'meal' : 'meals'} — worked out
        from what the recipes call for, not from what went in the pot. No calories, no macros.
      </p>
    </div>
  );
}

/* ---------- 445 · Spend estimate ---------- */

export interface SpendEstimateProps {
  readonly amount: string;
  readonly currency?: string;
  readonly period: string;
  /** How the figure was reached — the hedge is part of the component. */
  readonly basis?: string;
  readonly onImprove?: () => void;
  readonly className?: string;
}

/**
 * The rough spend.
 *
 * **Hedged, because the product cannot know the real figure.** It is derived
 * from market prices we have seen, not from receipts — so the `≈` is on the
 * number and the basis is stated underneath, every time.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/445-spend-estimate.html */
export function SpendEstimate({
  amount,
  currency = '₦',
  period,
  basis = 'From market prices we have seen, not from your receipts.',
  onImprove,
  className,
}: SpendEstimateProps) {
  return (
    <div className={cn('rounded-blade border border-line-2 bg-white p-4', className)}>
      <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">{period}</p>
      {/* Always approximate. There is no exact branch. */}
      <div className="mt-1">
        <PriceDisplay amount={amount} currency={currency} approximate size="xl" />
      </div>
      <p className="mt-2 text-sm text-ink-2">{basis}</p>
      <Show when={onImprove !== undefined}>
        <button
          type="button"
          onClick={onImprove}
          className="mt-2 text-sm font-extrabold text-sky-on underline decoration-2 underline-offset-2 hover:text-sky-deep"
        >
          Upload a receipt to get closer
        </button>
      </Show>
    </div>
  );
}

/* ---------- 446 · Repeat meal ---------- */

export interface RepeatMealProps {
  readonly name: string;
  readonly times: number;
  readonly period: string;
  readonly onCookAgain?: () => void;
  readonly className?: string;
}

/**
 * The repetition observation.
 *
 * **Deliberately non-judgemental.** Cooking the same thing six times is a
 * perfectly good way to live, and a product that implies otherwise is one
 * people stop opening. It states the count and offers to make it easy — it
 * never suggests variety.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/446-repeat-meal.html */
export function RepeatMeal({ name, times, period, onCookAgain, className }: RepeatMealProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-blade border border-line-2 bg-white px-4 py-3',
        className,
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-blade-xs bg-dish-fill text-dish-line">
        <KoboyoIcon name="repeat" size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{name}</span>
        {/* A count, not a verdict. */}
        <span className="block text-xs text-ink-3">
          <Figure value={times} unit={times === 1 ? 'time' : 'times'} size="sm" muted /> {period}
        </span>
      </span>
      <Show when={onCookAgain !== undefined}>
        <button
          type="button"
          onClick={onCookAgain}
          className="shrink-0 text-sm font-extrabold text-sky-on underline decoration-2 underline-offset-2 hover:text-sky-deep"
        >
          Cook it again
        </button>
      </Show>
    </div>
  );
}

/** Same bar, loading. The band structure is known before the shares are. */
export function NutritionBalanceSkeleton({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-blade border border-line-2 bg-white p-4', className)}
    >
      <span className="block h-[12px] w-28 animate-shimmer rounded-[3px] bg-paper-2" />
      <span className="mt-3 block h-4 w-full animate-shimmer rounded-pill bg-paper-2" />
      <span className="mt-3 block h-[12px] w-40 animate-shimmer rounded-[3px] bg-paper-2" />
    </div>
  );
}

/**
 * Nothing bought this week.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/445-spend-estimate.html
 *
 * **Not ₦0.** A week with no logged shopping is missing data, not a free week,
 * and a spend card that reports zero teaches the user to distrust the number
 * the week they DO shop.
 */
export function SpendEstimateEmpty({ className }: { readonly className?: string }) {
  return (
    <p className={cn('text-sm text-ink-3', className)}>
      Nothing logged this week, so there is no estimate to give.
    </p>
  );
}

/** Nothing repeated. A real and unremarkable answer. */
export function RepeatMealEmpty({ className }: { readonly className?: string }) {
  return (
    <p className={cn('text-sm text-ink-3', className)}>
      You have not cooked the same thing twice yet.
    </p>
  );
}
