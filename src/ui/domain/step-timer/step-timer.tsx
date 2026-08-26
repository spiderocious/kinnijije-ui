import { useEffect, useRef, useState } from 'react';

import { cn } from '@shared/utils/cn';
import { IconButton } from '@ui/primitives';

/**
 * The per-step countdown, and what it does when it ends.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/263-step-timer.html
 *
 * A real countdown for one step. It survives navigation WITHIN cook mode;
 * leaving cook mode ends it.
 *
 * **On completion: a soft chime and a persistent banner, never a modal.** The
 * cook is at a pot with both hands full — a modal over the step they are
 * reading is the worst possible moment to steal the screen.
 *
 * The last ten seconds pulse once a second, so a cook glancing over sees the
 * end coming without reading the digits.
 */

const PULSE_THRESHOLD_S = 10;

function format(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export type TimerState = 'idle' | 'running' | 'paused' | 'done';

export interface StepTimerProps {
  /** The full duration. */
  readonly seconds: number;
  /** Fires once, when the countdown reaches zero. */
  readonly onDone: () => void;
  readonly disabled?: boolean;
  readonly size?: number;
  readonly className?: string;
}

export function StepTimer({
  seconds,
  onDone,
  disabled = false,
  size = 132,
  className,
}: StepTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [state, setState] = useState<TimerState>('idle');
  const interval = useRef<number | null>(null);
  // Held in a ref so the ticking effect never restarts when the parent
  // re-renders with a new inline callback.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (state !== 'running') return;

    interval.current = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval.current ?? undefined);
          interval.current = null;
          setState('done');
          onDoneRef.current();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (interval.current !== null) window.clearInterval(interval.current);
      interval.current = null;
    };
  }, [state]);

  const progress = seconds === 0 ? 0 : (seconds - remaining) / seconds;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pulsing = state === 'running' && remaining <= PULSE_THRESHOLD_S && remaining > 0;

  return (
    <div className={cn('flex flex-col items-center gap-3', disabled && 'opacity-[0.42]', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          role="timer"
          aria-label={`${format(remaining)} remaining`}
          className={cn(pulsing && 'animate-pulse')}
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
            stroke={state === 'done' ? 'var(--success)' : 'var(--sky)'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke var(--t-base)' }}
          />
        </svg>

        <div className="absolute inset-0 grid place-items-center">
          {/* Counts down in place — the figure never tweens. */}
          <span
            className={cn(
              'font-mono text-2xl font-bold tnum',
              state === 'done' ? 'text-success-onsoft' : 'text-ink',
            )}
          >
            {format(remaining)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {state === 'running' ? (
          <IconButton icon="pause" label="Pause timer" onClick={() => setState('paused')} disabled={disabled} />
        ) : (
          <IconButton
            icon="play"
            label={state === 'done' ? 'Restart timer' : 'Start timer'}
            variant="primary"
            disabled={disabled || seconds === 0}
            onClick={() => {
              if (state === 'done') setRemaining(seconds);
              setState('running');
            }}
          />
        )}
        <IconButton
          icon="undo"
          label="Reset timer"
          disabled={disabled || state === 'idle'}
          onClick={() => {
            setRemaining(seconds);
            setState('idle');
          }}
        />
      </div>

      <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-3">{state}</p>
    </div>
  );
}

/** This step has no timer. */
export function NoTimer() {
  return (
    <p className="rounded-blade-xs border border-dashed border-line-2 bg-paper-2 px-4 py-3 text-center text-sm text-ink-3">
      No timer on this step
    </p>
  );
}
