import type { ReactNode } from 'react';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Figure } from '../figure/figure';

/**
 * The value-pair family — four shapes that are genuinely different.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/85-key-value.html
 *                                                          86-data-split.html
 *                                                          87-data-value.html
 *                                                          88-price-display.html
 *
 * These look similar enough to be tempting to merge, and merging them is wrong:
 *
 * - `KeyValue` has a KEY and a VALUE on one line — for a dense list of facts.
 * - `DataSplit` is a key and value on OPPOSITE edges — for a receipt or a total.
 * - `DataValue` has **no key at all**, only a title and a figure — for where
 *   the context already says what the number is.
 * - `PriceDisplay` is a figure with a currency, which needs its own alignment
 *   rules because a naira sign and a digit are not the same width.
 */

export interface KeyValueProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly icon?: KoboyoIconName;
  readonly className?: string;
}

/** A key and a value, inline. For a dense run of facts. */
export function KeyValue({ label, value, icon, className }: KeyValueProps) {
  return (
    <div className={cn('flex items-baseline gap-2 text-ctrl', className)}>
      <Show when={icon !== undefined}>
        <KoboyoIcon name={icon ?? 'info'} size={14} className="shrink-0 self-center text-ink-3" />
      </Show>
      <dt className="shrink-0 text-ink-3">{label}</dt>
      <dd className="min-w-0 font-semibold text-ink">{value}</dd>
    </div>
  );
}

export interface DataSplitProps {
  readonly label: string;
  readonly value: ReactNode;
  /** Heavier rule and weight — for the last line of a receipt. */
  readonly total?: boolean;
  readonly className?: string;
}

/**
 * Key left, value right, edge to edge.
 *
 * The gap between them is what makes a column of these scannable — a receipt
 * where every value starts right after its label cannot be read down.
 */
export function DataSplit({ label, value, total = false, className }: DataSplitProps) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 py-2',
        total ? 'border-t-bold border-ink pt-3 font-extrabold' : 'border-b border-line',
        className,
      )}
    >
      <span className={cn('min-w-0 truncate', total ? 'text-ink' : 'text-ink-2')}>{label}</span>
      <span className={cn('shrink-0', total ? 'text-ink' : 'text-ink')}>{value}</span>
    </div>
  );
}

export interface DataValueProps {
  readonly title: string;
  readonly value: number | string;
  readonly unit?: string;
  readonly approximate?: boolean;
  readonly caption?: string;
  readonly className?: string;
}

/**
 * A title and a figure — **no key**.
 *
 * Structurally distinct from `KeyValue`: there is nothing to look up, only a
 * thing and its measure. Used where the surrounding context already says what
 * the number is.
 */
export function DataValue({
  title,
  value,
  unit,
  approximate = false,
  caption,
  className,
}: DataValueProps) {
  return (
    <div className={className}>
      <p className="font-display text-md font-extrabold tracking-display">{title}</p>
      <Figure value={value} unit={unit} approximate={approximate} size="xl" />
      <Show when={caption !== undefined}>
        <p className="mt-1 text-sm text-ink-3">{caption}</p>
      </Show>
    </div>
  );
}

export interface PriceDisplayProps {
  readonly amount: number | string;
  readonly currency?: string;
  readonly approximate?: boolean;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
  /** A struck-through original, for a comparison. */
  readonly was?: number | string;
  readonly className?: string;
}

/**
 * Money.
 *
 * The currency mark sits **before** the figure and at a smaller size, because a
 * ₦ set at the same size as the digits reads as another digit. Everything is
 * tabular so a column of prices aligns on the decimal.
 */
export function PriceDisplay({
  amount,
  currency = '₦',
  approximate = false,
  size = 'md',
  was,
  className,
}: PriceDisplayProps) {
  const markSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-md', xl: 'text-lg' }[size];

  return (
    <span className={cn('inline-flex items-baseline gap-1', className)}>
      <span className={cn('font-semibold text-ink-3', markSize)}>{currency}</span>
      <Figure value={amount} approximate={approximate} size={size} />
      <Show when={was !== undefined}>
        <span className="ml-1 font-mono text-sm tnum text-ink-4 line-through">
          {currency}
          {was}
        </span>
      </Show>
    </span>
  );
}

export interface MetadataGroupProps {
  readonly items: readonly { readonly label: string; readonly value: ReactNode }[];
  readonly className?: string;
}

/** A run of key-values, separated by a middot. For a card's meta line. */
export function MetadataGroup({ items, className }: MetadataGroupProps) {
  return (
    <dl className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm', className)}>
      <Repeat each={[...items]}>
        {(item: { label: string; value: ReactNode }, index: number) => (
          <span key={item.label} className="inline-flex items-baseline gap-1">
            <Show when={index > 0}>
              <span aria-hidden="true" className="mr-1 text-ink-4">
                ·
              </span>
            </Show>
            <dt className="sr-only">{item.label}</dt>
            <dd className="text-ink-2">{item.value}</dd>
          </span>
        )}
      </Repeat>
    </dl>
  );
}

export interface LastRefreshedProps {
  readonly at: string;
  readonly onRefresh?: () => void;
  readonly className?: string;
}

/**
 * When this was last true.
 *
 * Every cached surface in the system owes one of these — a number with no age
 * beside it is a number claiming to be current.
 */
export function LastRefreshed({ at, onRefresh, className }: LastRefreshedProps) {
  return (
    <p className={cn('flex items-center gap-2 font-mono text-xs text-ink-4', className)}>
      <KoboyoIcon name="historyClockArrow" size={12} />
      {at}
      <Show when={onRefresh !== undefined}>
        <button
          type="button"
          onClick={onRefresh}
          className="font-sans font-extrabold text-ink-3 underline decoration-2 underline-offset-2 hover:text-sky-on"
        >
          Refresh
        </button>
      </Show>
    </p>
  );
}
