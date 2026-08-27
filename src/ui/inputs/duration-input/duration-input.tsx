import { Show } from 'meemaw';

import { cn } from '@shared/utils/cn';
import { Figure } from '@ui/display';
import type { FieldTriad } from '../field-contract';

/**
 * A DURATION — minutes and seconds for a step timer.
 *
 * Not to be confused with `TimeInput`, which is a clock time (`HH:MM`). "20
 * minutes" and "20:00" are different facts, and the two controls are kept
 * apart so a recipe cannot ask for one and store the other.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/61-time.html
 *
 * Mono and tabular, because a column of step durations is read down, not across
 * — proportional digits make "5" and "15" fail to line up, and a cook scanning
 * a recipe reads the column, not each row.
 *
 * **The displayed duration renders through `Figure`**, so a duration cannot be
 * formatted two ways in one product. The editor and the read-only view of the
 * same number are guaranteed to agree.
 *
 * **`null` is "no timer on this step", not zero.** A step with no timer and a
 * step with a zero-second timer are different things, and only one of them is
 * a mistake.
 */

export interface DurationInputProps extends FieldTriad {
  /** `null` means this step has no timer. */
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
  readonly unit?: 'min' | 'sec';
  readonly max?: number;
  readonly label?: string;
  readonly className?: string;
}

export function DurationInput({
  value,
  onChange,
  unit = 'min',
  max = 240,
  label = 'Duration',
  disabled = false,
  readOnly = false,
  invalid = false,
  className,
}: DurationInputProps) {
  const outOfRange = value !== null && (value < 0 || value > max);
  const showsError = invalid || outOfRange;

  // Read-only keeps FULL INK with a dashed edge — the value is real and current,
  // it simply cannot be changed here. Dimming it would say it does not matter.
  if (readOnly) {
    return (
      <span className={cn('inline-flex items-center', className)}>
        {value === null ? (
          <span className="text-sm text-ink-4" aria-label="No timer on this step">
            —
          </span>
        ) : (
          <Figure value={value} unit={unit} />
        )}
      </span>
    );
  }

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <span className="inline-flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          aria-label={label}
          aria-invalid={showsError ? true : undefined}
          min={0}
          max={max}
          disabled={disabled}
          value={value ?? ''}
          placeholder="—"
          onChange={(event) => {
            const raw = event.target.value;
            // An emptied field means "no timer", not zero.
            onChange(raw === '' ? null : Number(raw));
          }}
          className={cn(
            'h-ctrl w-[86px] rounded-blade-sm border-bold bg-white px-3',
            'text-right font-mono text-md font-bold tnum text-ink',
            'transition-[border-color,box-shadow] duration-fast',
            'focus:border-sky focus:shadow-[0_0_0_4px_var(--sky-glow)] focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-[0.42]',
            showsError ? 'border-critical bg-critical-soft' : 'border-line-2',
          )}
        />
        <span className="text-sm font-semibold text-ink-3">{unit}</span>
      </span>

      <Show when={outOfRange}>
        <span role="alert" className="text-sm font-semibold text-critical">
          Enter a value between 0 and {max} {unit}.
        </span>
      </Show>
    </div>
  );
}
