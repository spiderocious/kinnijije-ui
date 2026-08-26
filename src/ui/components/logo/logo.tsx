import { Cookie } from '@icons';
import { cn } from '@shared/utils/cn';

const sizeMap = {
  sm: { icon: 16, text: 'text-base' },
  md: { icon: 22, text: 'text-xl' },
  lg: { icon: 32, text: 'text-3xl' },
} as const;

interface LogoProps {
  size?: keyof typeof sizeMap;
  variant?: 'full' | 'icon-only';
  className?: string;
}

export function Logo({ size = 'md', variant = 'full', className }: LogoProps) {
  const dimensions = sizeMap[size];

  return (
    <span className={cn('inline-flex items-center gap-2 text-primary', className)}>
      <Cookie size={dimensions.icon} aria-hidden="true" />
      {variant === 'full' ? (
        <span className={cn('font-bold tracking-tight text-content', dimensions.text)}>
          Cookiepot
        </span>
      ) : (
        <span className="sr-only">Cookiepot</span>
      )}
    </span>
  );
}
