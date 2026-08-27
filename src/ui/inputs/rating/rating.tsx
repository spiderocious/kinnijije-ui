import { useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * Star rating.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/58-rating.html
 *
 * **`value` is NULLABLE**: `null` means unrated, `0` means rated zero. Those are
 * different facts, and collapsing them makes "nobody has rated this" render as
 * "everybody hated it".
 *
 * **`count` renders beside it** — an average with no sample size is not a fact.
 * 5.0 from one person and 4.6 from four hundred are not comparable, and a bare
 * average invites exactly that comparison.
 */

export interface RatingProps {
  readonly value: number | null;
  readonly onChange?: (value: number) => void;
  readonly max?: number;
  readonly readOnly?: boolean;
  /**
   * Rating closed — the window to rate has passed.
   *
   * **Not the same as `readOnly`.** `readOnly` shows a real rating someone else
   * gave, at full ink; `disabled` means this rating is no longer possible, and
   * it dims to say so.
   */
  readonly disabled?: boolean;
  /** How many people rated. Required for an average to mean anything. */
  readonly count?: number;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly label?: string;
  readonly className?: string;
}

const STAR_PX = { sm: 15, md: 19, lg: 26 } as const;

export function Rating({
  value,
  onChange,
  max = 5,
  readOnly = false,
  disabled = false,
  count,
  size = 'md',
  label = 'Rating',
  className,
}: RatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const stars = Array.from({ length: max }, (_, index) => index + 1);
  const shown = hover ?? value;
  const interactive = !readOnly && !disabled && onChange !== undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2',
        disabled && 'pointer-events-none opacity-[0.42]',
        className,
      )}
    >
      <span
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={
          value === null
            ? `${label}: not rated`
            : `${label}: ${value} out of ${max}${count !== undefined ? `, from ${count}` : ''}`
        }
        className="inline-flex items-center gap-[2px]"
        onPointerLeave={() => setHover(null)}
      >
        <Repeat each={stars}>
          {(star: number) => {
            const filled = shown !== null && star <= shown;
            const mark = (
              <KoboyoIcon
                name="ratingStar"
                size={STAR_PX[size]}
                className={cn(
                  'transition-colors duration-fast',
                  filled ? 'text-caution' : 'text-line-2',
                )}
              />
            );

            if (!interactive) return <span key={star}>{mark}</span>;

            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={value === star}
                aria-label={`${star} of ${max}`}
                onPointerEnter={() => setHover(star)}
                onClick={() => onChange(star)}
                className="rounded-[3px] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
              >
                {mark}
              </button>
            );
          }}
        </Repeat>
      </span>

      {/* An average with no sample size is not a fact. */}
      <Show when={count !== undefined}>
        <span className="font-mono text-xs tnum text-ink-3">
          {value !== null && `${value} · `}
          {count}
        </span>
      </Show>

      <Show when={value === null && count === undefined}>
        <span className="text-xs text-ink-4">Not rated</span>
      </Show>
    </span>
  );
}
