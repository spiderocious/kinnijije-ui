import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';

const sizeMap = {
  sm: { icon: 18, text: 'text-md' },
  md: { icon: 26, text: 'text-xl' },
  lg: { icon: 38, text: 'text-3xl' },
} as const;

interface LogoProps {
  size?: keyof typeof sizeMap;
  variant?: 'full' | 'icon-only';
  className?: string;
}

/**
 * The wordmark. Baloo 2 — the display face shouts, which is the whole point of
 * a name on a signboard.
 */
export function Logo({ size = 'md', variant = 'full', className }: LogoProps) {
  const dimensions = sizeMap[size];

  return (
    <span className={cn('inline-flex items-center gap-2 text-sky', className)}>
      <KoboyoIcon name="cookingPot" size={dimensions.icon} />
      {variant === 'full' ? (
        <span className={cn('font-display font-extrabold tracking-display text-ink', dimensions.text)}>
          Kinnijije
        </span>
      ) : (
        <span className="sr-only">Kinnijije</span>
      )}
    </span>
  );
}
