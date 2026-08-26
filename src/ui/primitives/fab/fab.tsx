import type { ButtonHTMLAttributes } from 'react';

import { KoboyoIcon, Loader2, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The floating add.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/33-fab.html
 *
 * Circular by exception to the blade — a blade on a floating circle reads as
 * damage. **At most one per screen**, reserved for the action a user takes
 * repeatedly on a list: add an ingredient, add a recipe.
 *
 * Like `IconButton`, `label` is required: there is no visible text.
 */

export interface FabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  readonly icon?: KoboyoIconName;
  /** REQUIRED — there is no visible text to fall back on. */
  readonly label: string;
  readonly loading?: boolean;
  /** Unset, the FAB is positioned by its parent. */
  readonly floating?: boolean;
}

export function Fab({
  icon = 'plus',
  label,
  loading = false,
  floating = true,
  disabled,
  className,
  ...rest
}: FabProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled === true || loading}
      aria-busy={loading}
      className={cn(
        'inline-flex h-ctrl-lg w-ctrl-lg shrink-0 items-center justify-center',
        // One of the blade's two exceptions.
        'rounded-round border-bold border-ink bg-sky text-sky-onbase shadow-drop-lg',
        'cursor-pointer transition-[transform,box-shadow,background-color] duration-press ease-kj',
        'hover:bg-sky-deep active:translate-x-[4px] active:translate-y-[5px] active:bg-sky-press active:shadow-none',
        'focus-visible:outline-none focus-visible:shadow-[var(--drop-lg),0_0_0_4px_var(--sky-glow)]',
        'disabled:opacity-[0.42] disabled:cursor-not-allowed disabled:pointer-events-none',
        floating && 'fixed bottom-6 right-6 z-sticky',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={24} className="animate-spin" aria-hidden="true" />
      ) : (
        <KoboyoIcon name={icon} size={24} />
      )}
    </button>
  );
}
