import type { ElementType, ReactNode } from 'react';

import { cn } from '@shared/utils/cn';

/**
 * The base surface every specific card is built from.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/196-card.html
 *
 * **Its absence was the single load-bearing gap in the shipped system** — ten
 * sites across the consumer app hand-wrote `border-2 + shadow-paint + rounded`,
 * and the admin wrote the same string three times inside one file.
 *
 * The `loud` / `quiet` prop is the pane/plate distinction in one place:
 *
 * - **loud** — 2.5px ink border, full drop-edge. For objects that ACT.
 * - **quiet** — hairline, no shadow. For objects that HOLD.
 *
 * **An empty card does not render.** It never becomes a placeholder box — an
 * empty bordered rectangle reads as a loading failure.
 */

const variantMap = {
  loud: 'border-bold border-ink shadow-drop',
  quiet: 'border-hair border-line-2 shadow-none',
} as const;

const paddingMap = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-pad',
  lg: 'p-6',
} as const;

export type CardVariant = keyof typeof variantMap;
export type CardPadding = keyof typeof paddingMap;

export interface CardProps {
  /** `loud` acts (drop-edge); `quiet` holds (hairline). */
  readonly variant?: CardVariant;
  readonly padding?: CardPadding;
  /** Renders as a different element — `article`, `li`, `section`. */
  readonly as?: ElementType;
  readonly className?: string;
  /** An empty card does not render at all. */
  readonly children?: ReactNode;
}

export function Card({
  variant = 'loud',
  padding = 'md',
  as: Component = 'div',
  className,
  children,
}: CardProps) {
  // Never a placeholder box.
  if (children === undefined || children === null || children === false) return null;

  return (
    <Component
      className={cn(
        'rounded-blade-lg bg-white',
        variantMap[variant],
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </Component>
  );
}

/** Same box, same padding — nothing shifts when the content lands. */
export function CardSkeleton({
  variant = 'loud',
  lines = 3,
}: {
  readonly variant?: CardVariant;
  readonly lines?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-blade-lg bg-white p-pad', variantMap[variant])}
    >
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className="h-[16px] animate-shimmer rounded-[4px] bg-paper-2"
            style={{ width: index === lines - 1 ? '55%' : '100%' }}
          />
        ))}
      </div>
    </div>
  );
}
