import type { ReactNode } from 'react';
import { Show } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Figure } from '@ui/display';
import { Button } from '@ui/primitives';

/**
 * The standing kitchen — the pantry the v1 PRD deliberately excluded.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/400-stock-item.html
 *                                                          401-stock-level.html
 *                                                          403-freshness.html
 *                                                          404-expiry-chip.html
 *                                                          405-storage-tag.html
 *                                                          411-restock-suggestion.html
 *
 * **The pantry is only ever maintained by side-effects of what the cook already
 * does** — cooking a meal decrements it, ticking a market item increments it,
 * one photo seeds it. No screen in this system asks a person to do stock-taking
 * as a chore; that is the friction the PRD says kills these products.
 *
 * If it ever needs manual upkeep, remove it.
 */

export type StockLevel = 'plenty' | 'low' | 'out' | 'untracked';
export type StorageKind = 'fridge' | 'freezer' | 'shelf' | 'counter';
export type Freshness = 'fresh' | 'soon' | 'past';

const LEVEL_FILL: Record<StockLevel, string> = {
  plenty: 'bg-success w-full',
  low: 'bg-caution w-1/3',
  out: 'bg-critical w-[6%]',
  untracked: 'w-0',
};

const LEVEL_LABEL: Record<StockLevel, string> = {
  plenty: 'Plenty',
  low: 'Running low',
  out: 'Out',
  untracked: 'Not tracked',
};

const STORAGE_ICON: Record<StorageKind, KoboyoIconName> = {
  fridge: 'fridge',
  freezer: 'freezer',
  shelf: 'shelf',
  counter: 'choppingBoard',
};

const FRESHNESS_CLASS: Record<Freshness, string> = {
  fresh: 'bg-success',
  soon: 'bg-caution',
  past: 'bg-critical',
};

const FRESHNESS_LABEL: Record<Freshness, string> = {
  fresh: 'Fresh',
  soon: 'Use soon',
  past: 'Past its best',
};

/**
 * The three-state meter. **Thresholds belong to the item, not to the bar** —
 * two onions is fine, two cups of rice is not. This renders the level it is
 * given; it never decides one.
 */
export function StockLevelBar({
  level,
  staleLabel,
  className,
}: {
  readonly level: StockLevel;
  readonly staleLabel?: string;
  readonly className?: string;
}) {
  return (
    <div className={className}>
      <div
        role="meter"
        aria-valuetext={LEVEL_LABEL[level]}
        aria-label="Stock level"
        className={cn(
          'h-[6px] overflow-hidden rounded-pill',
          // Untracked is a dashed rail, not a zero bar — they mean different things.
          level === 'untracked' ? 'border border-dashed border-line-2' : 'bg-paper-3',
        )}
      >
        <div className={cn('h-full rounded-pill transition-all duration-base', LEVEL_FILL[level])} />
      </div>
      <Show when={staleLabel !== undefined}>
        <p className="mt-1 font-mono text-xs text-ink-4">{staleLabel}</p>
      </Show>
    </div>
  );
}

/** The dot. Absent for non-perishables. */
export function FreshnessDot({ freshness }: { readonly freshness: Freshness }) {
  return (
    <span
      aria-label={FRESHNESS_LABEL[freshness]}
      title={FRESHNESS_LABEL[freshness]}
      className={cn('inline-block h-[8px] w-[8px] shrink-0 rounded-round', FRESHNESS_CLASS[freshness])}
    />
  );
}

/** Where it lives. */
/** Visual spec: design-system/projects/kinnijije-v2/preview/405-storage-tag.html */
export function StorageTag({ storage }: { readonly storage: StorageKind }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-3">
      <KoboyoIcon name={STORAGE_ICON[storage]} size={12} />
      <span className="capitalize">{storage}</span>
    </span>
  );
}

export interface StockItemProps {
  readonly name: string;
  readonly icon?: KoboyoIconName;
  /** DERIVED from quantity vs. the item's own low threshold, never passed raw. */
  readonly level: StockLevel;
  readonly quantity: number;
  readonly unit: string;
  readonly storage?: StorageKind;
  /** Absent for non-perishables. */
  readonly freshness?: Freshness;
  /** A count with no date is never shown as current. */
  readonly staleLabel?: string;
  /** Archived — kept for history, not counted. */
  readonly archived?: boolean;
  /** The count failed to load; the item still renders. */
  readonly countFailed?: boolean;
  /**
   * The row's trailing control — an "add to list" button on the low-stock board.
   *
   * Its own `loading` (adding) and `disabled` (already on the list) live on the
   * `Button` the caller passes, so the row does not grow two props that only
   * one of its two boards would ever use.
   */
  readonly trailing?: ReactNode;
  readonly onPress?: () => void;
}

/**
 * The atom of the pantry. Four facts — what, how much, how fresh, where it
 * lives — because a pantry entry with only a name is a shopping list, not a
 * kitchen.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/406-row-stock.html
 *                                                          407-row-low-stock.html
 *
 * The low-stock board renders the same anatomy — the row does not change shape
 * when an item runs down, only its level does.
 */
export function StockItem({
  name,
  icon = 'basket',
  level,
  quantity,
  unit,
  storage,
  freshness,
  staleLabel,
  archived = false,
  countFailed = false,
  trailing,
  onPress,
}: StockItemProps) {
  const content = (
    <>
      <span
        className={cn(
          'grid h-11 w-11 shrink-0 place-items-center rounded-blade-xs',
          level === 'out' ? 'bg-critical-soft text-critical-onsoft' : 'bg-dish-fill text-dish-line',
        )}
      >
        <KoboyoIcon name={icon} size={22} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {freshness !== undefined && <FreshnessDot freshness={freshness} />}
          <span className="truncate font-semibold text-ink">{name}</span>
        </span>
        <span className="mt-[3px] flex items-center gap-2">
          {storage !== undefined && <StorageTag storage={storage} />}
        </span>
        <StockLevelBar level={level} staleLabel={staleLabel} className="mt-2 max-w-[160px]" />
      </span>

      <span className="shrink-0 text-right">
        {countFailed ? (
          <span className="font-mono text-md font-bold text-ink-4">—</span>
        ) : (
          <Figure value={quantity} unit={unit} size="lg" muted={level === 'out'} />
        )}
      </span>
    </>
  );

  const classes = cn(
    'flex w-full items-center gap-3 px-pad py-row-y text-left',
    onPress !== undefined && 'transition-colors hover:bg-paper-2',
    archived && 'opacity-50',
  );

  if (onPress !== undefined && !archived) {
    return (
      <li className="flex items-center">
        <button
          type="button"
          onClick={onPress}
          className={cn(
            classes,
            'flex-1 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_var(--sky-glow)]',
          )}
        >
          {content}
        </button>
        {/* Outside the row's button — a button inside a button is invalid and
            steals the press from whichever the browser decides wins. */}
        <Show when={trailing !== undefined}>
          <span className="shrink-0 pr-pad">{trailing}</span>
        </Show>
      </li>
    );
  }

  return (
    <li className={cn(classes, 'items-center')}>
      <span className="flex flex-1 items-center gap-3">{content}</span>
      <Show when={trailing !== undefined}>
        <span className="shrink-0">{trailing}</span>
      </Show>
    </li>
  );
}

/** Never bought — a suggestion, not a zero. */
export function StockUntracked({
  name,
  onTrack,
}: {
  readonly name: string;
  readonly onTrack?: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-pad py-row-y">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-blade-xs border border-dashed border-line-2 text-ink-4">
        <KoboyoIcon name="emptyBox" size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink-3">{name}</span>
        <span className="text-xs text-ink-4">not tracked yet</span>
      </span>
      <Button variant="secondary" size="sm" onClick={onTrack}>
        Track it
      </Button>
    </li>
  );
}

export interface RestockSuggestionProps {
  readonly name: string;
  /** Why it matters — "4 saved meals need it". */
  readonly reason: string;
  readonly onAdd?: () => void;
}

/** A nudge, with its reason attached — a suggestion with no why is a nag. */
/** Visual spec: design-system/projects/kinnijije-v2/preview/411-restock-suggestion.html */
export function RestockSuggestion({ name, reason, onAdd }: RestockSuggestionProps) {
  return (
    <div className="flex items-center gap-3 rounded-blade border border-caution-border bg-caution-soft px-4 py-3">
      <KoboyoIcon name="shoppingCart" size={18} className="shrink-0 text-caution-onsoft" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-caution-onsoft">{name}</p>
        <p className="text-xs text-ink-2">{reason}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onAdd}>
        Add to list
      </Button>
    </div>
  );
}

/** Row-shaped, at the true measure. */
export function StockItemSkeleton() {
  return (
    <li aria-hidden="true" className="flex items-center gap-3 px-pad py-row-y">
      <span className="h-11 w-11 shrink-0 animate-shimmer rounded-blade-xs bg-skeleton" />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="h-[16px] w-1/2 animate-shimmer rounded-[4px] bg-skeleton" />
        <span className="h-[6px] w-[160px] animate-shimmer rounded-pill bg-skeleton" />
      </span>
      <span className="h-[26px] w-[64px] shrink-0 animate-shimmer rounded-[4px] bg-skeleton" />
    </li>
  );
}

/**
 * Unassigned storage — a neutral, not a guess.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/405-storage-tag.html
 *
 * **The app does not infer where something is kept.** Guessing "fridge" for a
 * yam is how shelf-life estimates go wrong, and shelf life is what this tag
 * feeds. Unknown stays unknown until someone says otherwise.
 */
export function StorageTagUnassigned({ className }: { readonly className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-blade-xs border border-dashed border-line-2 px-2 py-[2px] text-xs font-semibold text-ink-4',
        className,
      )}
    >
      Not set
    </span>
  );
}

/** Not enough history to suggest anything. The strip is simply absent. */
export function RestockNoHistory({ className }: { readonly className?: string }) {
  return (
    <p className={cn('text-sm text-ink-4', className)}>
      Once you have shopped a few times, suggestions show up here.
    </p>
  );
}
