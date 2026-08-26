import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { KoboyoIcon, Loader2, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The lightweight repeatable action — the blade's one yield.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/23-button-pill.html
 *
 * A pill button is for floating, repeatable actions — a chip-shaped filter, a
 * re-suggest control — where the shape signals "lightweight, repeatable" rather
 * than "commit".
 *
 * **A pill is never the primary commit.** "Suggest meals", "Start cooking" and
 * "Publish" are blade-cut. If the action changes the screen, it wears the blade.
 *
 * There is deliberately no `destructive` prop: a destructive action always
 * commits, so it is never a pill.
 */

const variantMap = {
  primary: 'bg-sky text-sky-onbase hover:bg-sky-deep active:bg-sky-press',
  secondary: 'bg-white text-ink hover:bg-sky-soft active:bg-sky-200',
} as const;

const sizeMap = {
  sm: 'h-ctrl-sm text-[13.5px] px-4',
  md: 'h-ctrl text-[15px] px-5',
} as const;

const iconSizeMap = { sm: 15, md: 17 } as const;

export type PillButtonVariant = keyof typeof variantMap;
export type PillButtonSize = keyof typeof sizeMap;

export interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: PillButtonVariant;
  readonly size?: PillButtonSize;
  readonly loading?: boolean;
  readonly icon?: KoboyoIconName;
  readonly children: ReactNode;
}

export function PillButton({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className,
  children,
  ...rest
}: PillButtonProps) {
  const iconSize = iconSizeMap[size];

  return (
    <button
      type="button"
      disabled={disabled === true || loading}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap',
        'font-display font-extrabold cursor-pointer',
        // The one shape in the system that is not blade-cut.
        'rounded-pill border-bold border-ink shadow-drop',
        'transition-[transform,box-shadow,background-color] duration-press ease-kj',
        'active:translate-x-[3px] active:translate-y-[4px] active:shadow-none',
        'focus-visible:outline-none focus-visible:shadow-[var(--drop),0_0_0_4px_var(--sky-glow)]',
        'disabled:opacity-[0.42] disabled:cursor-not-allowed disabled:pointer-events-none',
        sizeMap[size],
        variantMap[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} className="shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        icon !== undefined && <KoboyoIcon name={icon} size={iconSize} className="shrink-0" />
      )}
      <span className={cn(loading && 'opacity-[0.85]')}>{children}</span>
    </button>
  );
}
