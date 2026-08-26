import type { ReactNode } from 'react';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Figure } from '@ui/display';

/**
 * The insight unit — an observation, with its evidence.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/440-insight-card.html
 *                                                          441-insight-evidence.html
 *                                                          443-week-strip.html
 *                                                          444-streak.html
 *                                                          447-variety-meter.html
 *
 * **`evidence` is a REQUIRED prop** — the same rule as `Meal.Provenance` and
 * `Chat.AI.Source`. An observation with no working shown is indistinguishable
 * from a guess, and this product's whole posture is showing its working.
 *
 * Two rules that keep insights trustworthy:
 *
 * 1. **Under four observations, nothing renders.** A pattern claimed from two
 *    data points is a guess wearing a chart, and it costs more trust than
 *    silence.
 * 2. **An insight never renders an error state — it renders nothing.** A failed
 *    computation is not an observation, and a card saying "could not compute"
 *    teaches a user that this section is unreliable.
 */

/** The minimum history before a pattern may be claimed. */
export const MIN_OBSERVATIONS = 4;

export interface EvidenceRow {
  readonly id: string;
  readonly label: string;
  /** "Monday · rice" */
  readonly detail: string;
}

export interface InsightProps {
  readonly title: string;
  readonly body?: string;
  readonly icon?: KoboyoIconName;
  /**
   * REQUIRED. What the observation was derived from — either a set of rows the
   * user can inspect, or a stated source when it came from a count.
   */
  readonly evidence:
    | { readonly kind: 'rows'; readonly summary: string; readonly rows: readonly EvidenceRow[] }
    | { readonly kind: 'count'; readonly summary: string };
  /** Derived from an old count. */
  readonly staleLabel?: string;
  readonly actions?: ReactNode;
  /** Opens the evidence. One tap from every insight. */
  readonly onInspect?: () => void;
  readonly className?: string;
}

export function InsightCard({
  title,
  body,
  icon,
  evidence,
  staleLabel,
  actions,
  onInspect,
  className,
}: InsightProps) {
  return (
    <article className={cn('rounded-blade-lg border border-line-2 bg-white p-5', className)}>
      <div className="flex items-start gap-3">
        {icon !== undefined && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-blade-xs bg-sky-soft text-sky-on">
            <KoboyoIcon name={icon} size={20} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-md font-extrabold leading-snug tracking-display">
            {title}
          </h3>
          <Show when={body !== undefined}>
            <p className="mt-1 text-sm text-ink-2">{body}</p>
          </Show>
        </div>
      </div>

      {/* The required slot. A claim you cannot inspect is not evidence. */}
      <button
        type="button"
        onClick={onInspect}
        disabled={onInspect === undefined}
        className={cn(
          'mt-3 flex items-center gap-[6px] text-xs font-extrabold text-ink-3',
          onInspect !== undefined &&
            'transition-colors hover:text-sky-on focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
        )}
      >
        <KoboyoIcon name="checklistPaper" size={13} />
        {evidence.summary}
        {staleLabel !== undefined && <span className="text-ink-4"> — {staleLabel}</span>}
      </button>

      <Show when={actions !== undefined}>
        <div className="mt-4">{actions}</div>
      </Show>
    </article>
  );
}

/** The receipts behind an observation. One tap from every insight. */
export function InsightEvidence({
  evidence,
}: {
  readonly evidence: InsightProps['evidence'];
}) {
  if (evidence.kind === 'count') {
    return (
      <p className="rounded-blade-sm border border-dashed border-line-2 bg-paper-2 px-4 py-4 text-center text-sm text-ink-3">
        This one comes from your kitchen count, not from meals.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
        {evidence.summary}
      </p>
      <ul className="divide-y divide-line rounded-blade-sm border border-line-2 bg-white">
        <Repeat each={[...evidence.rows]}>
          {(row: EvidenceRow) => (
            <li key={row.id} className="flex items-baseline justify-between gap-3 px-4 py-2">
              <span className="min-w-0 truncate text-sm font-semibold text-ink">{row.label}</span>
              <span className="shrink-0 font-mono text-xs text-ink-3">{row.detail}</span>
            </li>
          )}
        </Repeat>
      </ul>
    </div>
  );
}

export function InsightSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-blade-lg border border-line-2 bg-white p-5">
      <div className="flex gap-3">
        <span className="h-10 w-10 shrink-0 animate-shimmer rounded-blade-xs bg-paper-2" />
        <div className="flex-1">
          <div className="h-[18px] w-4/5 animate-shimmer rounded-[4px] bg-paper-2" />
          <div className="mt-2 h-[14px] w-3/5 animate-shimmer rounded-[4px] bg-paper-2" />
        </div>
      </div>
      <div className="mt-3 h-[13px] w-2/5 animate-shimmer rounded-[3px] bg-paper-2" />
    </div>
  );
}

/* ---------- The week strip ---------- */

export interface WeekDay {
  readonly label: string;
  readonly cooked: boolean;
  /** What was cooked, for the tooltip. */
  readonly meal?: string;
}

/**
 * Seven days, at a glance.
 *
 * A blank day is **not** a failure — it is a day the product knows nothing
 * about, and it is drawn as an empty square rather than a red one.
 */
export function WeekStrip({
  days,
  className,
}: {
  readonly days: readonly WeekDay[];
  readonly className?: string;
}) {
  return (
    <div className={cn('flex gap-[6px]', className)}>
      <Repeat each={[...days]}>
        {(day: WeekDay) => (
          <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              title={day.meal}
              className={cn(
                'grid h-10 w-full place-items-center rounded-blade-xs border',
                day.cooked
                  ? 'border-success-border bg-success-soft text-success-onsoft'
                  : 'border-dashed border-line-2 bg-paper-2',
              )}
            >
              {day.cooked && <KoboyoIcon name="cookingPot" size={16} />}
            </div>
            <span className="font-mono text-xs text-ink-3">{day.label}</span>
          </div>
        )}
      </Repeat>
    </div>
  );
}

/**
 * A run of days cooked.
 *
 * Deliberately **not** a gamified score — no points, no levels, no "don't break
 * the chain" pressure. It states a fact and stops. A streak that punishes a
 * missed day is how a cooking app becomes a chore.
 */
export function Streak({
  days,
  className,
}: {
  readonly days: number;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 rounded-blade border border-line-2 bg-white px-4 py-3',
        className,
      )}
    >
      <KoboyoIcon name="fire" size={22} className="shrink-0 text-caution" />
      <div>
        <Figure value={days} size="xl" />
        <p className="text-xs text-ink-3">{days === 1 ? 'day cooking' : 'days cooking'}</p>
      </div>
    </div>
  );
}

/** How varied the week has been. States a fact; makes no judgement. */
export function VarietyMeter({
  distinct,
  total,
  className,
}: {
  readonly distinct: number;
  readonly total: number;
  readonly className?: string;
}) {
  const ratio = total === 0 ? 0 : distinct / total;

  return (
    <div className={cn('rounded-blade border border-line-2 bg-white p-4', className)}>
      <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">Variety</p>
      <p className="mt-1">
        <Figure value={distinct} size="2xl" />
        <span className="ml-2 text-sm text-ink-3">
          distinct meals in <span className="font-mono tnum">{total}</span>
        </span>
      </p>
      <div className="mt-3 h-[8px] overflow-hidden rounded-pill bg-paper-3">
        <div
          className="h-full rounded-pill bg-sky transition-all duration-base"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}
