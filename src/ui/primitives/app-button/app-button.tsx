import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Loader2 } from '@icons';
import { cn } from '@shared/utils/cn';

const variantMap = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-surface text-content border border-border hover:bg-border/40',
  ghost: 'bg-transparent text-content-muted hover:text-content hover:bg-surface',
} as const;

const sizeMap = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
} as const;

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantMap;
  size?: keyof typeof sizeMap;
  isLoading?: boolean;
  children: ReactNode;
}

export function AppButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  children,
  ...rest
}: AppButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled ?? isLoading}
      aria-busy={isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        variantMap[variant],
        sizeMap[size],
        className,
      )}
      {...rest}
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
