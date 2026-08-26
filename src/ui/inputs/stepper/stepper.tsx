import type { KeyboardEvent } from 'react';

import { Minus, Plus } from '@icons';
import { cn } from '@shared/utils/cn';
import type { FieldTriad } from '../field-contract';

/**
 * The nudge control for servings and portions.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/43-stepper.html
 *
 * **Both controls are always visible.** A stepper that hides its minus until
 * hover is unusable on a phone with wet hands — which is the actual posture of
 * the person using this.
 *
 * **Only the END that is reached disables, never the whole control.** At the
 * minimum the minus greys out and the plus stays live.
 *
 * Shift+Arrow uses `largeStep` — a 40-serving recipe should not need 36 taps.
 * The number never tweens; the digit swaps in place.
 */

export interface StepperProps extends FieldTriad {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** Used by Shift+Arrow. */
  readonly largeStep?: number;
  readonly label: string;
  /** A unit shown after the number — "serves", "portions". */
  readonly unit?: string;
  readonly className?: string;
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  largeStep = 5,
  label,
  unit,
  disabled = false,
  readOnly = false,
  invalid = false,
  className,
}: StepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;
  const locked = disabled || readOnly;

  function commit(next: number) {
    if (locked) return;
    onChange(Math.min(max, Math.max(min, next)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const delta = event.shiftKey ? largeStep : step;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      commit(value + delta);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      commit(value - delta);
    }
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-blade border-bold p-1',
        invalid ? 'border-critical bg-critical-soft' : 'border-ink bg-white',
        disabled && 'opacity-[0.42] pointer-events-none',
        readOnly && 'border-dashed',
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        // Only this end disables — the other stays live.
        disabled={atMin || locked}
        onClick={() => commit(value - step)}
        className={cn(
          'grid h-ctrl-sm w-ctrl-sm shrink-0 place-items-center rounded-blade-xs',
          'transition-colors duration-fast ease-kj',
          'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
          'disabled:opacity-[0.3] disabled:cursor-not-allowed',
          'hover:bg-sky-soft active:bg-sky-200',
        )}
      >
        <Minus size={16} strokeWidth={3} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        readOnly={readOnly}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          if (!Number.isNaN(next)) commit(next);
        }}
        className={cn(
          'w-[52px] bg-transparent text-center font-mono text-md font-bold tnum text-ink outline-none',
        )}
      />

      {unit !== undefined && (
        <span className="pr-1 text-sm font-semibold text-ink-3">{unit}</span>
      )}

      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={atMax || locked}
        onClick={() => commit(value + step)}
        className={cn(
          'grid h-ctrl-sm w-ctrl-sm shrink-0 place-items-center rounded-blade-xs',
          'transition-colors duration-fast ease-kj',
          'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
          'disabled:opacity-[0.3] disabled:cursor-not-allowed',
          'hover:bg-sky-soft active:bg-sky-200',
        )}
      >
        <Plus size={16} strokeWidth={3} />
      </button>
    </div>
  );
}
