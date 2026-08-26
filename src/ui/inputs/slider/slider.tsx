import { cn } from '@shared/utils/cn';
import type { FieldTriad } from '../field-contract';

/**
 * The range control, always paired with its own readout.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/65-slider.html
 *
 * For a value where the approximate position matters more than the exact
 * number. **It always shows its value as a figure**, because a handle position
 * alone is not a fact — a user cannot report "about two-thirds" to anyone.
 *
 * The track and knob are drawn as ordinary elements underneath a transparent
 * native `<input type="range">`, which keeps every keyboard, pointer and
 * assistive-tech behaviour of the real control while letting the visuals carry
 * the stance. Styling the vendor pseudo-elements directly cannot express the
 * filled portion without a second element anyway.
 */

export interface SliderProps extends FieldTriad {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly label: string;
  /** A unit shown after the readout — "min", "servings". */
  readonly unit?: string;
  /** Formats the readout. Defaults to the raw number. */
  readonly format?: (value: number) => string;
  readonly className?: string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit,
  format,
  disabled = false,
  readOnly = false,
  invalid = false,
  className,
}: SliderProps) {
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const locked = disabled || readOnly;

  return (
    <div className={cn('w-full', disabled && 'opacity-[0.42]', className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-extrabold text-ink-2">{label}</span>
        {/* The figure is not optional — a handle position alone is not a fact. */}
        <span
          className={cn(
            'font-mono text-md font-bold tnum',
            invalid ? 'text-critical-onsoft' : 'text-ink',
          )}
        >
          {format?.(value) ?? value}
          {unit !== undefined && <span className="ml-1 text-sm text-ink-3">{unit}</span>}
        </span>
      </div>

      <div className="group relative h-[22px]">
        {/* Track */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-[10px] -translate-y-1/2 overflow-hidden rounded-pill border border-ink bg-paper-3"
        >
          <div
            className={cn('h-full', invalid ? 'bg-critical' : 'bg-sky')}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Knob */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2',
            'rounded-round border-bold border-ink bg-white',
            'group-focus-within:shadow-[0_0_0_4px_var(--sky-glow)]',
          )}
          style={{ left: `${percent}%` }}
        />

        {/* The real control, transparent on top — every native behaviour kept. */}
        <input
          type="range"
          aria-label={label}
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={locked}
          onChange={(event) => onChange(Number(event.target.value))}
          className={cn(
            'absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0',
            'focus-visible:outline-none',
            locked && 'cursor-not-allowed',
          )}
        />
      </div>
    </div>
  );
}
