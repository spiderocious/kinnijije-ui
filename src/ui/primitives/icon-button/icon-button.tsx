import type { ButtonHTMLAttributes } from 'react';

import { KoboyoIcon, Loader2, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The icon-only action.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/22-button-icon.html
 *
 * Square by height, blade-cut, and it MUST carry an accessible label — there is
 * no visible text to fall back on. `label` is a required prop rather than a
 * documented convention, because a required prop is the only version of that
 * rule a build can enforce.
 *
 * `icon` takes a koboyo slug, never arbitrary markup — an icon button whose
 * glyph is passed as children drifts in size at every call site.
 */

const variantMap = {
  primary: 'bg-sky text-sky-onbase hover:bg-sky-deep active:bg-sky-press',
  secondary: 'bg-white text-ink hover:bg-sky-soft active:bg-sky-200',
  tertiary: 'bg-transparent border-transparent shadow-none text-ink-2 hover:bg-paper-2 hover:text-ink',
} as const;

const sizeMap = {
  sm: 'h-ctrl-sm w-ctrl-sm rounded-blade-sm',
  md: 'h-ctrl w-ctrl rounded-blade',
  lg: 'h-ctrl-lg w-ctrl-lg rounded-blade-lg',
} as const;

const destructiveMap = {
  primary: 'bg-critical text-critical-on hover:bg-[#DC4F4C]',
  secondary: 'bg-white text-critical-onsoft border-critical hover:bg-critical-soft',
  tertiary: 'text-critical-onsoft hover:bg-critical-soft',
} as const;

const iconSizeMap = { sm: 16, md: 19, lg: 22 } as const;

export type IconButtonVariant = keyof typeof variantMap;
export type IconButtonSize = keyof typeof sizeMap;

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** A koboyo glyph slug. Never arbitrary markup. */
  readonly icon: KoboyoIconName;
  /** REQUIRED — there is no visible text to fall back on. */
  readonly label: string;
  readonly variant?: IconButtonVariant;
  readonly size?: IconButtonSize;
  readonly destructive?: boolean;
  readonly loading?: boolean;
  /** An unread count. Renders as a pill on the top-right corner. */
  readonly badge?: number;
}

export function IconButton({
  icon,
  label,
  variant = 'secondary',
  size = 'md',
  destructive = false,
  loading = false,
  badge,
  disabled,
  className,
  ...rest
}: IconButtonProps) {
  const iconSize = iconSizeMap[size];

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled === true || loading}
        aria-busy={loading}
        className={cn(
          'inline-flex shrink-0 items-center justify-center p-0',
          'cursor-pointer border-bold border-ink shadow-drop',
          'transition-[transform,box-shadow,background-color] duration-press ease-kj',
          variant !== 'tertiary' &&
            'active:translate-x-[3px] active:translate-y-[4px] active:shadow-none',
          'focus-visible:outline-none focus-visible:shadow-[var(--drop),0_0_0_4px_var(--sky-glow)]',
          'disabled:opacity-[0.42] disabled:cursor-not-allowed disabled:pointer-events-none',
          sizeMap[size],
          variantMap[variant],
          destructive && destructiveMap[variant],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <Loader2 size={iconSize} className="animate-spin" aria-hidden="true" />
        ) : (
          <KoboyoIcon name={icon} size={iconSize} />
        )}
      </button>

      {badge !== undefined && badge > 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-pill border-hair border-ink bg-critical px-1 font-mono text-[10px] font-bold tnum text-critical-on"
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </span>
  );
}
