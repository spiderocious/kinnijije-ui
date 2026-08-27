import { Repeat } from 'meemaw';

import { cn } from '@shared/utils/cn';

/**
 * Progress, in both modes, with the rule about which to use.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/152-progress-linear.html
 *                                                          153-progress-circular.html
 *                                                          154-progress-stepper.html
 *
 * **Determinate** when there is a real number (an upload). **Indeterminate**
 * when there is not (a query).
 *
 * **Never fake a percentage.** A bar that reaches 90% and waits is worse than a
 * marching one — it makes a promise the system cannot keep, and the user learns
 * not to trust the next bar either. Omit `value` for indeterminate.
 *
 * A determinate bar never animates backwards.
 */

const toneMap = {
  sky: 'bg-sky',
  success: 'bg-success',
  caution: 'bg-caution',
  critical: 'bg-critical',
  ai: 'bg-grape',
} as const;

export type ProgressTone = keyof typeof toneMap;

interface ProgressBase {
  readonly tone?: ProgressTone;
  /** "2 of 3 photos · 62%" */
  readonly label?: string;
  readonly className?: string;
}

type ProgressMode =
  /** A real number is known. */
  | { readonly value: number; readonly indeterminate?: false }
  /** No number is known — never pass a guessed percentage. */
  | { readonly indeterminate: true; readonly value?: undefined };

export type ProgressProps = ProgressBase & ProgressMode;

export function Progress(props: ProgressProps) {
  const { tone = 'sky', label, className } = props;
  const indeterminate = props.indeterminate === true;
  const value = indeterminate ? 0 : Math.min(100, Math.max(0, props.value ?? 0));

  return (
    <div className={className}>
      {label !== undefined && (
        <p className="mb-2 flex items-center justify-between gap-3 text-sm font-extrabold text-ink-2">
          {label}
        </p>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-[10px] overflow-hidden rounded-pill border border-ink bg-paper-3"
      >
        {indeterminate ? (
          // A 28% band marches — honest that no number is known.
          <div className={cn('h-full w-[28%] rounded-pill', toneMap[tone])}
            style={{ animation: 'kj-march 1.3s linear infinite' }} />
        ) : (
          <div
            className={cn('h-full rounded-pill transition-[width] duration-base ease-kj-out', toneMap[tone])}
            style={{ width: `${value}%` }}
          />
        )}
      </div>
    </div>
  );
}

export interface StepProgressProps {
  /** 1-indexed. */
  readonly current: number;
  readonly total: number;
  /**
   * Defaults FALSE — do not look navigable unless you are. A stepper that
   * looks clickable but is not is a small betrayal.
   */
  readonly clickable?: boolean;
  /**
   * Flow locked — the steps show but none can be jumped to.
   *
   * Used where the sequence is enforced server-side. The dots stay visible so
   * the user still knows how long the flow is; hiding them would make a locked
   * flow feel endless.
   */
  readonly locked?: boolean;
  readonly onStepClick?: (step: number) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

/** Position in a stepped flow. */
export function StepProgress({
  current,
  total,
  clickable = false,
  onStepClick,
  disabled = false,
  locked = false,
  className,
}: StepProgressProps) {
  const steps = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <div className={cn('flex flex-col gap-2', disabled && 'opacity-[0.42]', className)}>
      <div className="flex items-center gap-[6px]">
        <Repeat each={steps}>
          {(step: number) => {
            const shared = cn(
              'h-[8px] rounded-pill transition-all duration-fast ease-kj',
              step === current ? 'w-7 bg-sky' : 'w-[8px]',
              step < current && 'bg-sky-300',
              step > current && 'bg-line-2',
            );

            // `locked` blocks navigation but does NOT dim: the flow is real and
            // in progress, it simply cannot be re-entered out of order.
            if (clickable && !disabled && !locked && step < current) {
              return (
                <button
                  key={step}
                  type="button"
                  aria-label={`Go back to step ${step}`}
                  onClick={() => onStepClick?.(step)}
                  className={cn(shared, 'cursor-pointer hover:bg-sky')}
                />
              );
            }
            return <span key={step} aria-hidden="true" className={shared} />;
          }}
        </Repeat>
      </div>
      <p className="font-mono text-xs tnum text-ink-3">
        Step {current} of {total}
      </p>
    </div>
  );
}

export interface CircularProgressProps {
  readonly value?: number;
  readonly indeterminate?: boolean;
  readonly size?: number;
  readonly tone?: ProgressTone;
  readonly label?: string;
}

const CIRCLE_STROKE: Record<ProgressTone, string> = {
  sky: 'var(--sky)',
  success: 'var(--success)',
  caution: 'var(--caution)',
  critical: 'var(--critical)',
  ai: 'var(--grape)',
};

/** The ring, for a compact slot where a bar would not fit. */
export function CircularProgress({
  value = 0,
  indeterminate = false,
  size = 44,
  tone = 'sky',
  label,
}: CircularProgressProps) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(indeterminate && 'animate-spin')}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--paper-3)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={CIRCLE_STROKE[tone]}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={indeterminate ? circumference * 0.72 : offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: indeterminate ? undefined : 'stroke-dashoffset var(--t-base) var(--ease-out)' }}
      />
    </svg>
  );
}
