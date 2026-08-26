import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@shared/utils/cn';

/**
 * The applied-filter toggle.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/26-filter-chip.html
 *
 * A toggle that looks like a chip. It carries its own count when active,
 * because "filtered" with no visible count is how a user loses track of why a
 * list is short.
 *
 * `count` renders only when pressed — an unapplied filter has no count to show.
 * A chip applied with zero results STAYS on screen so it can be removed; that
 * is the whole reason the count exists.
 */

export interface FilterChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'children'> {
  /** Whether the filter is applied. */
  readonly pressed: boolean;
  readonly onPressedChange: (pressed: boolean) => void;
  /** Result count. Renders only while pressed. `undefined` while re-filtering. */
  readonly count?: number;
  /** Shows an ellipsis in the count slot while the list re-filters. */
  readonly loading?: boolean;
  readonly children: ReactNode;
}

export function FilterChip({
  pressed,
  onPressedChange,
  count,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'inline-flex h-ctrl-sm items-center gap-2 whitespace-nowrap px-4',
        'rounded-blade-xs border border-ink text-[13.5px] font-extrabold',
        'cursor-pointer transition-colors duration-fast ease-kj',
        'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
        'disabled:opacity-[0.42] disabled:cursor-not-allowed disabled:pointer-events-none',
        pressed
          ? 'bg-sky text-sky-onbase shadow-drop-sm'
          : 'bg-white text-ink-2 shadow-none hover:bg-sky-soft hover:text-ink',
        className,
      )}
      {...rest}
    >
      <span>{children}</span>
      {pressed && (loading || count !== undefined) && (
        <>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <span className="font-mono text-xs tnum">{loading ? '…' : count}</span>
        </>
      )}
    </button>
  );
}
