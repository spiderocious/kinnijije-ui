import type { ElementType, ReactNode } from 'react';

import { cn } from '@shared/utils/cn';

/**
 * The three type primitives.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/17-heading.html
 *                                                          18-text.html
 *                                                          19-caption.html
 *
 * **Every axis here is independent.** Size does not imply a tag, weight does
 * not imply a size, and truncation is a line count rather than a boolean. Fused
 * axes are how a design system ends up with `variant="large-bold-heading"` and
 * no way to express the fourteenth case.
 */

/* ---------- Heading ---------- */

const HEADING_SIZE = {
  1: 'text-4xl',
  2: 'text-3xl',
  3: 'text-2xl',
  4: 'text-xl',
  5: 'text-lg',
  6: 'text-md',
} as const;

export type HeadingLevel = keyof typeof HEADING_SIZE;

export interface HeadingProps {
  /** Sets the SIZE only. */
  readonly level?: HeadingLevel;
  /**
   * Sets the TAG only.
   *
   * A page may legitimately need an `h1`-sized `h2` — a section heading that
   * reads as the page's title without claiming to be it. Fusing the two axes
   * forces a choice between correct outlines and correct typography.
   */
  readonly as?: ElementType;
  readonly color?: 'default' | 'muted' | 'inverse';
  readonly truncate?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

const COLOR = {
  default: 'text-ink',
  muted: 'text-ink-2',
  inverse: 'text-ink-inv',
} as const;

export function Heading({
  level = 2,
  as,
  color = 'default',
  truncate = false,
  className,
  children,
}: HeadingProps) {
  const Component = as ?? (`h${level}` as ElementType);
  return (
    <Component
      className={cn(
        // No `weight` prop: the display face is always 800 here. A lighter
        // voice is `Text`, not a thin heading.
        'font-display font-extrabold tracking-display',
        HEADING_SIZE[level],
        COLOR[color],
        truncate && 'truncate',
        className,
      )}
    >
      {children}
    </Component>
  );
}

/* ---------- Text ---------- */

const TEXT_SIZE = { lg: 'text-md', base: 'text-base', sm: 'text-sm' } as const;

export interface TextProps {
  readonly size?: keyof typeof TEXT_SIZE;
  /** INDEPENDENT of size — never fused into one `variant`. */
  readonly weight?: 'default' | 'strong';
  /** A LINE COUNT, not a boolean. `1` is a single-line ellipsis. */
  readonly truncate?: 1 | 2 | 3;
  readonly color?: 'default' | 'muted' | 'inverse';
  readonly as?: ElementType;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Note there is no `disabled` prop.
 *
 * **A disabled control dims its whole subtree**, so text inside one inherits
 * that treatment. A `disabled` here would let a paragraph dim independently of
 * the control it sits in, and the two greys would drift apart.
 */
export function Text({
  size = 'base',
  weight = 'default',
  truncate,
  color = 'default',
  as: Component = 'p',
  className,
  children,
}: TextProps) {
  return (
    <Component
      className={cn(
        TEXT_SIZE[size],
        weight === 'strong' ? 'font-extrabold' : 'font-normal',
        COLOR[color],
        truncate === 1 && 'truncate',
        truncate === 2 && 'line-clamp-2',
        truncate === 3 && 'line-clamp-3',
        className,
      )}
    >
      {children}
    </Component>
  );
}

/* ---------- Caption ---------- */

export interface CaptionProps {
  /** For the ink surface — the inverse mode, not a dimmer grey. */
  readonly onDark?: boolean;
  readonly as?: ElementType;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Hints, timestamps and credits. */
export function Caption({
  onDark = false,
  as: Component = 'span',
  className,
  children,
}: CaptionProps) {
  return (
    <Component
      className={cn('text-xs', onDark ? 'text-ink-inv/70' : 'text-ink-3', className)}
    >
      {children}
    </Component>
  );
}

/* ---------- Their states ---------- */

/** A heading whose words have not arrived. Holds the line's true height. */
export function HeadingSkeleton({
  level = 2,
  width = 220,
}: {
  readonly level?: HeadingLevel;
  readonly width?: number;
}) {
  const heights = { 1: 52, 2: 42, 3: 33, 4: 27, 5: 23, 6: 20 } as const;
  return (
    <span
      aria-hidden="true"
      className="block animate-shimmer rounded-[4px] bg-paper-2"
      style={{ width, height: heights[level] }}
    />
  );
}

/** Body copy loading. Varied widths, and a short last line like real prose. */
export function TextSkeleton({ lines = 3 }: { readonly lines?: number }) {
  const widths = ['96%', '88%', '92%', '78%'];
  return (
    <span aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className="block h-[13px] animate-shimmer rounded-[3px] bg-paper-2"
          style={{ width: i === lines - 1 ? '54%' : widths[i % widths.length] }}
        />
      ))}
    </span>
  );
}

/** A caption reporting cached data — it states its age rather than hiding it. */
export function CaptionStale({
  age,
  onDark = false,
  className,
}: {
  readonly age: string;
  readonly onDark?: boolean;
  readonly className?: string;
}) {
  return (
    <Caption onDark={onDark} className={className}>
      Cached · {age}
    </Caption>
  );
}
