import type { ReactNode } from 'react';

import { X } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The content label, kept deliberately distinct from the status family.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/147-tag.html
 *
 * **A tag labels what something IS; a status says where it is in its LIFE.**
 * Cuisines, dietary marks and categories are tags. Published / draft is not.
 *
 * Tags use `neutral` or `info` ONLY — `success`, `caution` and `critical`
 * belong to `Status`. A green tag would read as a lifecycle claim, which is
 * precisely the collision the status contract exists to prevent.
 */

const toneMap = {
  neutral: 'bg-neutral-soft text-neutral-onsoft border-neutral-border',
  info: 'bg-info-soft text-info-onsoft border-info-border',
} as const;

export type TagTone = keyof typeof toneMap;

export interface TagProps {
  /** `neutral` or `info` only — the other three belong to Status. */
  readonly tone?: TagTone;
  readonly size?: 'sm' | 'md';
  /** Renders a remove control. Requires `onRemove`. */
  readonly onRemove?: () => void;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Tag({ tone = 'neutral', size = 'md', onRemove, className, children }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap rounded-blade-xs border font-semibold',
        size === 'sm' ? 'px-2 py-[2px] text-xs' : 'px-[10px] py-1 text-sm',
        toneMap[tone],
        className,
      )}
    >
      {children}
      {onRemove !== undefined && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove tag"
          // A pill on a blade — the remove control is one of the two exceptions.
          className="grid h-4 w-4 place-items-center rounded-round transition-colors hover:bg-ink/10 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
        >
          <X size={11} strokeWidth={3} />
        </button>
      )}
    </span>
  );
}

/** A skeleton in the shape a tag row will become. */
export function TagSkeleton({ width = 72 }: { readonly width?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-[26px] animate-shimmer rounded-blade-xs bg-skeleton"
      style={{ width }}
    />
  );
}

/**
 * A recipe with no tags.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/147-tag.html
 *
 * **Says nothing rather than showing an empty rail.** A row of zero tags with a
 * heading above it reads as a fetch that failed; absence of tags is not a
 * failure, so the group collapses and the caller renders this only where the
 * absence is itself worth stating.
 */
export function TagGroupEmpty({
  message = 'No tags',
  className,
}: {
  readonly message?: string;
  readonly className?: string;
}) {
  return <span className={cn('text-sm text-ink-4', className)}>{message}</span>;
}
