import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import { KoboyoIcon, Loader2, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The base action.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/21-button.html
 * Tokens:      _foundation.css — --sky, --blade-lg, --drop, --t-press
 *
 * Three variants and two INDEPENDENT modifiers — never a flat cross-product.
 * The shipped library spelled `crit` and `crit-solid` into the variant list,
 * which is why it had no destructive tertiary and no on-dark treatment for cook
 * mode. `destructive` and `onDark` compose with every variant and are resolved
 * internally.
 *
 * There are deliberately no radius / height / padding / textStyle props: every
 * call site would drift, and the blade would stop being a law.
 *
 * `loading` never replaces children — it swaps the leading icon only, so the
 * button keeps its own name and never changes width mid-press.
 */

const variantMap = {
  primary: 'bg-sky text-sky-onbase hover:bg-sky-deep active:bg-sky-press',
  secondary: 'bg-white text-ink hover:bg-sky-soft active:bg-sky-200',
  tertiary: [
    'bg-transparent border-transparent shadow-none text-sky-on px-[10px]',
    'underline decoration-sky decoration-[3px] underline-offset-4',
    'hover:bg-sky-soft hover:decoration-sky-deep',
    'active:translate-x-0 active:translate-y-0 active:shadow-none',
  ].join(' '),
} as const;

const sizeMap = {
  sm: 'h-ctrl-sm text-[13.5px] px-4 rounded-blade-sm',
  md: 'h-ctrl text-[15px] px-6 rounded-blade-lg',
  lg: 'h-ctrl-lg text-[17px] px-8 rounded-blade-xl',
} as const;

/** Destructive resolved per variant — never a sky button in red clothing. */
const destructiveMap = {
  primary: 'bg-critical text-critical-on hover:bg-[#DC4F4C] active:bg-[#DC4F4C]',
  secondary: 'bg-white text-critical-onsoft border-critical hover:bg-critical-soft',
  tertiary: 'bg-transparent text-critical-onsoft decoration-critical hover:bg-critical-soft',
} as const;

/** On-dark resolved per variant — cook mode runs on an ink ground. */
const onDarkMap = {
  primary: 'border-white',
  secondary: 'border-white bg-transparent text-white hover:bg-white/10',
  tertiary: 'text-white decoration-white hover:bg-white/10',
} as const;

export type ButtonVariant = keyof typeof variantMap;
export type ButtonSize = keyof typeof sizeMap;

interface ButtonOwnProps {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Composes with every variant. Never expressed as its own variant. */
  readonly destructive?: boolean;
  /** Composes with every variant. Cook mode sits on ink. */
  readonly onDark?: boolean;
  /** Swaps the leading icon only. The label holds and the width never changes. */
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
  /** A koboyo glyph before the label. Replaced by the spinner while loading. */
  readonly icon?: KoboyoIconName;
  /** A koboyo glyph after the label. */
  readonly iconEnd?: KoboyoIconName;
  readonly children: ReactNode;
}

type ButtonAsButton = ButtonOwnProps & {
  readonly as?: 'button';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps>;

type ButtonAsAnchor = ButtonOwnProps & {
  readonly as: 'a';
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps>;

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

/** The icon size that reads correctly inside each control height. */
const iconSizeMap = { sm: 15, md: 17, lg: 19 } as const;

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    destructive = false,
    onDark = false,
    loading = false,
    fullWidth = false,
    icon,
    iconEnd,
    className,
    children,
  } = props;

  const iconSize = iconSizeMap[size];

  const classes = cn(
    // Base — the blade, the drop-edge, and the press it travels into.
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-display font-extrabold cursor-pointer no-underline',
    'border-bold border-ink shadow-drop',
    'transition-[transform,box-shadow,background-color] duration-press ease-kj',
    // The press: the control travels exactly its own shadow offset and the
    // shadow goes to zero, so it lands flush.
    variant !== 'tertiary' && 'active:translate-x-[3px] active:translate-y-[4px] active:shadow-none',
    'focus-visible:outline-none focus-visible:shadow-[var(--drop),0_0_0_4px_var(--sky-glow)]',
    // Disabled fades but keeps its edge — it is still a button.
    'disabled:opacity-[0.42] disabled:cursor-not-allowed disabled:pointer-events-none',
    'aria-disabled:opacity-[0.42] aria-disabled:cursor-not-allowed aria-disabled:pointer-events-none',
    sizeMap[size],
    variantMap[variant],
    destructive && destructiveMap[variant],
    onDark && onDarkMap[variant],
    fullWidth && 'w-full',
    className,
  );

  const content = (
    <>
      {loading ? (
        <Loader2 size={iconSize} className="shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        icon !== undefined && <KoboyoIcon name={icon} size={iconSize} className="shrink-0" />
      )}
      <span className={cn(loading && 'opacity-[0.85]')}>{children}</span>
      {iconEnd !== undefined && (
        <KoboyoIcon name={iconEnd} size={iconSize} className="shrink-0" />
      )}
    </>
  );

  if (props.as === 'a') {
    const { as: _as, variant: _v, size: _s, destructive: _d, onDark: _o, loading: _l,
      fullWidth: _f, icon: _i, iconEnd: _ie, children: _c, className: _cn, ...rest } = props;
    return (
      <a className={classes} aria-busy={loading} {...rest}>
        {content}
      </a>
    );
  }

  const { as: _as, variant: _v, size: _s, destructive: _d, onDark: _o, loading: _l,
    fullWidth: _f, icon: _i, iconEnd: _ie, children: _c, className: _cn, disabled, ...rest } = props;

  return (
    <button
      type="button"
      disabled={disabled === true || loading}
      aria-busy={loading}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
}
