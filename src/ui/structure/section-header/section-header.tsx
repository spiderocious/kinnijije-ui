import type { ReactNode } from 'react';
import { Repeat, Show } from 'meemaw';

import { Blob } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The label above a group of things.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/200-section-header.html
 *
 * Carries an optional count and at most one action. The count is part of the
 * header rather than a separate badge because a group whose size you cannot see
 * is one you cannot tell is truncated.
 */

export interface SectionHeaderProps {
  readonly title: string;
  readonly count?: number;
  /** At most one control. */
  readonly action?: ReactNode;
  /** Quieter, for a subordinate group inside a section. */
  readonly level?: 'section' | 'group';
  readonly className?: string;
}

export function SectionHeader({
  title,
  count,
  action,
  level = 'section',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', className)}>
      <h2
        className={cn(
          'min-w-0 truncate',
          level === 'section'
            ? 'font-display text-lg font-extrabold tracking-display'
            : 'text-xs font-extrabold uppercase tracking-overline text-ink-3',
        )}
      >
        {title}
        <Show when={count !== undefined}>
          <span
            className={cn(
              'ml-2 font-mono tnum',
              level === 'section' ? 'text-md text-ink-3' : 'text-ink-4',
            )}
          >
            · {count}
          </span>
        </Show>
      </h2>

      <Show when={action !== undefined}>
        <div className="shrink-0">{action}</div>
      </Show>
    </div>
  );
}

export interface RecentIngredientsProps {
  readonly items: readonly string[];
  readonly onAdd: (name: string) => void;
  /** Recents from cache. */
  readonly staleLabel?: string;
  readonly className?: string;
}

/**
 * The one-tap way back to what you usually have.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/239-recent-ingredients.html
 *
 * This is the closest the product comes to remembering a kitchen without asking
 * anyone to maintain one — it is derived from what was typed before, and
 * tapping is optional.
 */
export function RecentIngredients({
  items,
  onAdd,
  staleLabel,
  className,
}: RecentIngredientsProps) {
  if (items.length === 0) return null;

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
        Or pick from recent
        <Show when={staleLabel !== undefined}>
          <span className="ml-2 font-mono normal-case tracking-normal text-ink-4">
            {staleLabel}
          </span>
        </Show>
      </p>

      <ul className="flex flex-wrap gap-2">
        <Repeat each={[...items]}>
          {(item: string) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => onAdd(item)}
                className="rounded-pill border border-line-2 bg-white px-3 py-[6px] text-sm font-semibold text-ink-2 transition-colors hover:border-sky-edge hover:bg-sky-soft hover:text-sky-on focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
              >
                + {item}
              </button>
            </li>
          )}
        </Repeat>
      </ul>
    </div>
  );
}

export interface AvatarProps {
  /** WHO it stands for — an email or id, never a random seed. */
  readonly name: string;
  readonly size?: number;
  /** A display name shown beside the creature. */
  readonly label?: string;
  readonly sublabel?: string;
  readonly className?: string;
}

/**
 * A person, rendered.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/89-avatar.html
 *
 * A thin wrapper over `Blob` for the common "creature + name + detail" row, so
 * an account row does not re-implement the layout at every call site.
 */
/** Visual spec: design-system/projects/kinnijije-v2/preview/90-avatar-group.html */
export function Avatar({ name, size = 36, label, sublabel, className }: AvatarProps) {
  if (label === undefined) {
    return <Blob name={name} size={size} className={className} />;
  }

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-3', className)}>
      <Blob name={name} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-ctrl font-semibold text-ink">{label}</span>
        <Show when={sublabel !== undefined}>
          <span className="block truncate font-mono text-xs text-ink-3">{sublabel}</span>
        </Show>
      </span>
    </span>
  );
}

/**
 * The header's rail, before its title arrives.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/200-section-header.html
 *
 * A section that loads its title late must still hold the space, or every row
 * beneath it shifts down when the words appear.
 */
export function SectionHeaderSkeleton({ className }: { readonly className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center justify-between gap-3', className)}>
      <span className="block h-[17px] w-40 animate-shimmer rounded-[3px] bg-paper-2" />
      <span className="block h-[13px] w-16 animate-shimmer rounded-[3px] bg-paper-2" />
    </div>
  );
}

/**
 * A person's mark, loading.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/89-avatar.html
 *
 * The blob is generated from the name, so there is no image to fail — an avatar
 * "error" is a missing NAME, and that renders as this same neutral disc rather
 * than a broken-image glyph or a guessed set of initials.
 */
export function AvatarSkeleton({
  size = 36,
  withLabel = false,
  className,
}: {
  readonly size?: number;
  readonly withLabel?: boolean;
  readonly className?: string;
}) {
  return (
    <span aria-hidden="true" className={cn('flex items-center gap-2.5', className)}>
      <span
        className="block shrink-0 animate-shimmer rounded-round bg-paper-2"
        style={{ width: size, height: size }}
      />
      {withLabel && (
        <span className="flex flex-col gap-1">
          <span className="block h-[13px] w-24 animate-shimmer rounded-[3px] bg-paper-2" />
          <span className="block h-[11px] w-32 animate-shimmer rounded-[3px] bg-paper-2" />
        </span>
      )}
    </span>
  );
}
