import { Show } from 'meemaw';

import { KoboyoIcon, Loader2, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { Stepper } from '@ui/inputs';
import { Figure, Stat } from '@ui/display';
import { Panel } from '@ui/structure';
import type { StorageKind } from '../stock/stock';

/**
 * The remaining stock components.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/402-stock-count.html
 *                                                          404-expiry-chip.html
 *                                                          409-stock-group.html
 *                                                          410-stock-summary.html
 *                                                          412-shelf-life.html
 *                                                          413-stock-empty.html
 */

/* ---------- 402 · Stock count ---------- */

export interface StockCountProps {
  readonly value: number;
  readonly onChange: (value: number) => void;
  /** The unit changes with the measurement preference. */
  readonly unit: string;
  readonly name: string;
  readonly max?: number;
  /**
   * The change is in flight. The value stays on screen and readable — replacing
   * it with a spinner loses the number the user is trying to adjust.
   */
  readonly committing?: boolean;
  readonly className?: string;
}

/**
 * A count with its unit.
 *
 * **Distinct from a plain `Stepper`: it carries a unit, and the unit changes
 * with the measurement preference.** Six "medium" tomatoes and 500g of tomatoes
 * are not the same quantity, and a stepper that drops the unit makes them look
 * like they are.
 */
export function StockCount({
  value,
  onChange,
  unit,
  name,
  max = 99,
  committing = false,
  className,
}: StockCountProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* `min={0}` is what disables only the minus at zero — the stepper owns
          that, so there is no separate "at zero" state to remember here. */}
      <Stepper
        value={value}
        onChange={onChange}
        label={name}
        min={0}
        max={max}
        disabled={committing}
      />
      {/* The unit is never dropped. */}
      <span className="text-sm font-semibold text-ink-3">{unit}</span>
      <Show when={committing}>
        <Loader2 size={14} className="animate-spin text-ink-4" aria-label="Saving" />
      </Show>
    </div>
  );
}

/** Loading a count into a known shape — the stepper's own measure. */
export function StockCountSkeleton({ className }: { readonly className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-3', className)}>
      <span className="block h-ctrl w-[128px] animate-shimmer rounded-blade-sm bg-skeleton" />
      <span className="block h-[14px] w-10 animate-shimmer rounded-[3px] bg-skeleton" />
    </div>
  );
}

/* ---------- 404 · Expiry chip ---------- */

export interface ExpiryChipProps {
  readonly daysLeft: number;
  /** Past this, nothing renders — a chip on everything is a chip on nothing. */
  readonly window?: number;
  readonly className?: string;
}

/**
 * A countdown on one item.
 *
 * **It only appears inside the window that matters** — three days for fresh
 * produce, a week for dairy. A chip on everything is a chip on nothing, and a
 * kitchen where every row shouts has no way to say "this one".
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/404-expiry-chip.html */
export function ExpiryChip({ daysLeft, window = 3, className }: ExpiryChipProps) {
  // Outside the window, it does not render at all.
  if (daysLeft > window) return null;

  const past = daysLeft < 0;
  const today = daysLeft === 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-blade-xs border px-2 py-[2px] text-xs font-extrabold',
        past
          ? 'border-critical-border bg-critical-soft text-critical-onsoft'
          : 'border-caution-border bg-caution-soft text-caution-onsoft',
        className,
      )}
    >
      <KoboyoIcon name="expiryLabel" size={11} />
      {past
        ? 'past its best'
        : today
          ? 'use today'
          : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
    </span>
  );
}

/* ---------- 412 · Shelf life ---------- */

export interface ShelfLifeProps {
  readonly typicalDays: number;
  readonly storage: StorageKind;
  readonly className?: string;
}

/**
 * How long a thing usually keeps.
 *
 * **It is a general estimate, not a claim about the cook's fridge**, and the
 * copy says so every time. Stating "4 days" flatly about someone else's
 * refrigerator is a claim the product has no way to back.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/412-shelf-life.html */
export function ShelfLife({ typicalDays, storage, className }: ShelfLifeProps) {
  return (
    <p className={cn('flex items-center gap-2 text-xs text-ink-3', className)}>
      <KoboyoIcon name="historyClockArrow" size={12} />
      {/* Hedged, every time. */}
      Usually keeps about{' '}
      <Figure value={typicalDays} unit={typicalDays === 1 ? 'day' : 'days'} size="sm" muted /> in the{' '}
      {storage} — yours may differ.
    </p>
  );
}

/* ---------- 409 · Stock group ---------- */

export interface StockGroupProps {
  readonly storage: StorageKind;
  readonly count: number;
  readonly lowCount?: number;
  readonly children: React.ReactNode;
  readonly className?: string;
}

const STORAGE_ICON: Record<StorageKind, KoboyoIconName> = {
  fridge: 'fridge',
  freezer: 'freezer',
  shelf: 'shelf',
  counter: 'choppingBoard',
};

/**
 * The pantry, grouped by where things live.
 *
 * **Grouped by storage location, because that is how a person checks a
 * kitchen** — they open the fridge, then the cupboard. An alphabetical list
 * makes someone walk the room four times.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/409-stock-group.html */
export function StockGroup({
  storage,
  count,
  lowCount = 0,
  children,
  className,
}: StockGroupProps) {
  return (
    <Panel className={className}>
      <Panel.Header
        title={
          <span className="inline-flex items-center gap-2">
            <KoboyoIcon name={STORAGE_ICON[storage]} size={16} className="text-ink-3" />
            {storage.charAt(0).toUpperCase() + storage.slice(1)}
          </span>
        }
        action={
          <span className="flex items-center gap-3">
            <Show when={lowCount > 0}>
              <span className="text-xs font-extrabold text-caution-onsoft">{lowCount} low</span>
            </Show>
            <span className="font-mono text-xs text-ink-3">{count}</span>
          </span>
        }
      />
      <Panel.List>{children}</Panel.List>
    </Panel>
  );
}

/* ---------- 410 · Stock summary ---------- */

export interface StockSummaryProps {
  readonly total: number;
  readonly low: number;
  readonly useSoon: number;
  readonly makeable: number;
  readonly countedAt?: string;
  readonly className?: string;
}

/**
 * The whole pantry as four figures.
 *
 * The top of the kitchen dashboard. **It exists so a cook can decide in two
 * seconds whether they need to look further** — which is why it is four numbers
 * rather than a chart.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/410-stock-summary.html */
export function StockSummary({
  total,
  low,
  useSoon,
  makeable,
  countedAt,
  className,
}: StockSummaryProps) {
  return (
    <div className={className}>
      <Show when={countedAt !== undefined}>
        <p className="mb-3 font-mono text-xs text-ink-3">counted {countedAt}</p>
      </Show>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Things in" value={total} weight="compact" />
        <Stat label="Running low" value={low} weight="compact" />
        <Stat label="Use soon" value={useSoon} weight="compact" />
        <Stat label="Could make" value={makeable} weight="compact" />
      </div>
    </div>
  );
}

/* ---------- 413 · Stock empty ---------- */

export interface StockEmptyProps {
  readonly onPhotograph: () => void;
  readonly onAddByHand?: () => void;
  readonly className?: string;
}

/**
 * Before anything is tracked.
 *
 * **The way in is a photo of a shelf, not a form** — asking someone to type
 * forty items is exactly the chore the PRD warns kills these products. Adding
 * by hand is offered second, and skipping entirely is always allowed.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/413-stock-empty.html */
export function StockEmpty({ onPhotograph, onAddByHand, className }: StockEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-blade-lg border border-dashed border-line-2 bg-paper-2 px-6 py-9 text-center',
        className,
      )}
    >
      <span className="grid h-14 w-14 place-items-center rounded-blade-sm bg-sky-soft text-sky-on">
        <KoboyoIcon name="takingPhotoCamera" size={28} />
      </span>
      <p className="font-display text-lg font-extrabold tracking-display">
        Let us see your kitchen
      </p>
      <p className="max-w-[44ch] text-sm text-ink-2">
        One photo of a shelf or inside your fridge. We will read what is there and you can fix
        anything we get wrong.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {/* The photo route is primary — the form is not the way in. */}
        <Button icon="takingPhotoCamera" onClick={onPhotograph}>
          Photograph a shelf
        </Button>
        <Show when={onAddByHand !== undefined}>
          <Button variant="secondary" onClick={onAddByHand}>
            Add a few by hand
          </Button>
        </Show>
      </div>
      <p className="text-sm text-ink-3">You can skip this — suggestions work without it.</p>
    </div>
  );
}
