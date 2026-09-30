import { useEffect, useRef, useState } from 'react';

/**
 * A number that animates to its value, then keeps up as the value grows.
 *
 * Two DIFFERENT behaviours, and conflating them is what made the earlier
 * version unreadable:
 *
 *   1. ARRIVAL. The first real value eases up from zero, once. That is the
 *      flourish, and it happens exactly one time.
 *
 *   2. DRIFT. Every later increase steps up from where it already is, one
 *      whole number at a time, so 13 → 16 is visibly 14, 15, 16. It never
 *      restarts from zero, because restarting is what made the number look
 *      like it was flickering rather than counting.
 *
 * A short pause after arrival keeps the two from running into each other.
 */
interface CountUpProps {
  readonly value: number;
  readonly suffix?: string | undefined;
  /** How long the one arrival animation takes. */
  readonly durationMs?: number;
  /** Quiet beat between arriving and starting to drift. */
  readonly settleMs?: number;
  /**
   * How long one +1 step takes while drifting.
   *
   * Must stay comfortably faster than the source's own rate, or the display
   * falls further behind the longer the page is open. The source adds at most
   * 8 a second; 90ms a step is 11 a second.
   */
  readonly stepMs?: number;
  readonly className?: string | undefined;
}

export function CountUp({
  value,
  suffix = '',
  durationMs = 900,
  settleMs = 1000,
  stepMs = 90,
  className,
}: CountUpProps) {
  const [shown, setShown] = useState(0);

  /** The value the display is walking towards. */
  const target = useRef(value);
  /** What is on screen right now, without waiting for a re-render. */
  const current = useRef(0);
  /** Set once the arrival animation has finished and the pause has elapsed. */
  const ready = useRef(false);
  const raf = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  target.current = value;

  // ── 1 · Arrival, once ────────────────────────────────────────────────
  useEffect(() => {
    // Nothing to animate until the real number arrives.
    if (value <= 0 || ready.current) return;

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const finish = () => {
      timer.current = setTimeout(() => {
        ready.current = true;
      }, settleMs);
    };

    if (reduced) {
      current.current = value;
      setShown(value);
      ready.current = true;
      return;
    }

    const from = value;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / durationMs);
      // easeOutCubic: quick, then settling rather than stopping dead.
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from * eased);
      current.current = next;
      setShown(next);

      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      if (timer.current !== null) clearTimeout(timer.current);
    };
    // Deliberately keyed on the FIRST real value only: re-running this on every
    // drift is precisely the bug it replaces.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value > 0]);

  // ── 2 · Drift, one number at a time ──────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (!ready.current) return;
      if (current.current >= target.current) return;

      // One step per beat. Never a jump: seeing 14 and 15 go past is the
      // whole point of a counter.
      current.current += 1;
      setShown(current.current);
    }, stepMs);

    return () => { clearInterval(id); };
  }, [stepMs]);

  return (
    <span className={className}>
      {/* The final value is in the DOM for assistive tech from the start, so a
          screen reader never announces a number mid-count. */}
      <span aria-hidden="true">
        {shown.toLocaleString()}
        {suffix}
      </span>
      <span className="sr-only">
        {value.toLocaleString()}
        {suffix}
      </span>
    </span>
  );
}
