import { cn } from '@shared/utils/cn';

/**
 * A count attached to another object.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/146-badge.html
 *
 * Always critical-toned by design, because **a badge exists to pull attention**
 * — a neutral badge is just text.
 *
 * Two rules the type enforces rather than documents:
 *
 * 1. **A count of 0 renders NOTHING.** Never a zero badge — "0 unread" is not
 *    news, and a permanent badge stops meaning anything.
 * 2. **Over `max` renders "99+"**, never a four-digit badge that reflows the
 *    thing it is attached to.
 */

export interface BadgeProps {
  readonly count: number;
  readonly max?: number;
  /** Count not yet known — renders the dot, not a number. */
  readonly loading?: boolean;
  /** Announced to screen readers, e.g. "3 unread notifications". */
  readonly label?: string;
  readonly className?: string;
}

export function Badge({ count, max = 99, loading = false, label, className }: BadgeProps) {
  if (loading) {
    return (
      <span
        aria-label={label}
        className={cn(
          'inline-block h-[10px] w-[10px] rounded-round border-hair border-ink bg-critical',
          className,
        )}
      />
    );
  }

  // Zero renders nothing at all — never a "0".
  if (count <= 0) return null;

  return (
    <span
      aria-label={label}
      className={cn(
        'inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-pill px-[6px]',
        'border-hair border-ink bg-critical font-mono text-xs font-bold tnum text-critical-on',
        'animate-pop',
        className,
      )}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
