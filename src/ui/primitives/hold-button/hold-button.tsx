import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * Press and hold — the middle rung between a plain tap and a typed confirmation.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/34-hold-button.html
 *
 * Used where a typed confirmation is too heavy but a single tap is too light:
 * unsaving a favourite, discarding a draft. Releasing early cancels and the fill
 * retreats — an interrupted hold must never commit.
 *
 * Under `prefers-reduced-motion` the fill still advances, because it is progress
 * feedback rather than decoration; only its easing flattens.
 */

const DEFAULT_DURATION_MS = 1200;
const TICK_MS = 16;

export interface HoldButtonProps {
  /** Fires once the hold completes. Never fires on an interrupted hold. */
  readonly onConfirm: () => void;
  /** How long the hold must last. */
  readonly durationMs?: number;
  readonly disabled?: boolean;
  readonly icon?: KoboyoIconName;
  /** Destructive is the common case, so it is the default. */
  readonly destructive?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function HoldButton({
  onConfirm,
  durationMs = DEFAULT_DURATION_MS,
  disabled = false,
  icon,
  destructive = true,
  className,
  children,
}: HoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const frame = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (frame.current !== null) {
      window.clearInterval(frame.current);
      frame.current = null;
    }
    startedAt.current = null;
    setHolding(false);
    setProgress(0);
  }, []);

  const start = useCallback(() => {
    if (disabled || frame.current !== null) return;
    setHolding(true);
    startedAt.current = performance.now();

    frame.current = window.setInterval(() => {
      const started = startedAt.current;
      if (started === null) return;

      const elapsed = performance.now() - started;
      const next = Math.min(1, elapsed / durationMs);
      setProgress(next);

      if (next >= 1) {
        stop();
        onConfirm();
      }
    }, TICK_MS);
  }, [disabled, durationMs, onConfirm, stop]);

  // A hold interrupted by unmount must not leave a timer running.
  useEffect(() => stop, [stop]);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={holding ? 'Keep holding to confirm' : undefined}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          start();
        }
      }}
      onKeyUp={stop}
      onBlur={stop}
      className={cn(
        'relative inline-flex h-ctrl select-none items-center justify-center gap-2 overflow-hidden px-6',
        'rounded-blade-lg border-bold border-ink font-display text-[15px] font-extrabold',
        'cursor-pointer transition-[transform,box-shadow] duration-press ease-kj',
        'active:translate-x-[3px] active:translate-y-[4px] active:shadow-none',
        'focus-visible:outline-none focus-visible:shadow-[var(--drop),0_0_0_4px_var(--sky-glow)]',
        'disabled:opacity-[0.42] disabled:cursor-not-allowed disabled:pointer-events-none',
        destructive
          ? 'bg-white text-critical-onsoft border-critical shadow-drop'
          : 'bg-white text-ink shadow-drop',
        className,
      )}
    >
      {/* The fill. Advances while held, retreats the moment it is released. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 transition-[width]',
          destructive ? 'bg-critical-soft' : 'bg-sky-soft',
          holding ? 'duration-0' : 'duration-fast ease-kj-out',
        )}
        style={{ width: `${progress * 100}%` }}
      />

      <span className="relative z-base inline-flex items-center gap-2">
        {icon !== undefined && <KoboyoIcon name={icon} size={17} className="shrink-0" />}
        {holding ? 'Keep holding…' : children}
      </span>
    </button>
  );
}
