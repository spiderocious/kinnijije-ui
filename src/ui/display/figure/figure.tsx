import { cn } from '@shared/utils/cn';

/**
 * The tabular number primitive.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/20-figure.html
 *                                                          133-status-approximate.html
 *
 * Every count, time, price and quantity in the system renders through this.
 *
 * **The `≈` marker is owned here, not remembered by a screen.** AI quantities
 * are estimates and AI cook times are padded 30%, so an approximate figure must
 * always carry its tell — the shipped app showed the same AI recipe as `≈30M`
 * in favourites and `30 MIN` on two other screens, which is exactly what
 * happens when the marker is a screen's responsibility.
 *
 * **Numbers never tween.** The digit swaps in place; a counting animation makes
 * a figure unreadable for the duration and implies precision that is not there.
 */

const sizeMap = {
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-xl',
  xl: 'text-2xl',
  '2xl': 'text-3xl',
  '3xl': 'text-4xl',
} as const;

export type FigureSize = keyof typeof sizeMap;

export interface FigureProps {
  readonly value: number | string;
  /** A unit after the number — "min", "g", "₦". */
  readonly unit?: string;
  /**
   * An AI estimate. Renders the `≈` prefix. Derive this from the recipe's
   * source — never pass it separately, or the two can disagree.
   */
  readonly approximate?: boolean;
  readonly size?: FigureSize;
  /** Dims the figure — used for a secondary or superseded value. */
  readonly muted?: boolean;
  readonly className?: string;
}

export function Figure({
  value,
  unit,
  approximate = false,
  size = 'md',
  muted = false,
  className,
}: FigureProps) {
  return (
    <span
      className={cn(
        'font-mono font-bold tnum',
        sizeMap[size],
        muted ? 'text-ink-3' : 'text-ink',
        className,
      )}
    >
      {approximate && (
        <span aria-hidden="true" className="mr-[1px] text-ink-3">
          ≈
        </span>
      )}
      {/* Screen readers get the word, not the glyph. */}
      {approximate && <span className="sr-only">about </span>}
      {value}
      {unit !== undefined && (
        <span className={cn('ml-1 font-semibold', muted ? 'text-ink-4' : 'text-ink-3')}>
          {unit}
        </span>
      )}
    </span>
  );
}

/** A skeleton at the figure's true measure. */
export function FigureSkeleton({
  size = 'md',
  width = 64,
}: {
  readonly size?: FigureSize;
  readonly width?: number;
}) {
  const heights: Record<FigureSize, string> = {
    sm: 'h-[18px]',
    md: 'h-[22px]',
    lg: 'h-[28px]',
    xl: 'h-[34px]',
    '2xl': 'h-[42px]',
    '3xl': 'h-[54px]',
  };
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block animate-shimmer rounded-[4px] bg-paper-2', heights[size])}
      style={{ width }}
    />
  );
}
