import { useEffect, useState } from 'react';

/**
 * A counter that keeps creeping up, and survives a reload.
 *
 * The drift is derived from ELAPSED TIME since the server's snapshot, never
 * from a timer that starts at mount. That is the whole trick: a timer-based
 * counter restarts at the base on every refresh, so somebody who reloads
 * watches the number jump backwards, which is exactly what makes a counter
 * look fabricated. Deriving it from a timestamp means two tabs agree, a reload
 * lands where it left off, and the number only ever moves forward.
 *
 * Each tick adds a RANDOM amount rather than a fixed one, because a counter
 * that goes up by exactly one every time reads as a loop. The randomness is
 * seeded from the tick index, so it is deterministic: the same moment always
 * produces the same total, which is what keeps a reload consistent.
 */

/**
 * Two ticks a second, each adding 1 to 4.
 *
 * The DISPLAY walks to the new value one number at a time (see CountUp), so
 * these two rates have to stay in proportion: at most 4 per 500ms is 8 a
 * second arriving, and the display steps 8.3 a second. That is deliberately
 * comfortable rather than exact — if the source ever outran the display, the
 * number would lag further behind the longer the page stayed open.
 */
const TICK_MS = 500;

/** Each tick adds somewhere in this range, inclusive. */
const MIN_STEP = 1;
const MAX_STEP = 4;

/**
 * A stable pseudo-random step for tick `n`.
 *
 * Deterministic on purpose: `Math.random()` here would mean the number changed
 * every time it was recomputed, so two tabs would disagree and a reload would
 * land somewhere new. Hashing the index gives the same spread with none of that.
 */
function stepFor(n: number, salt: number): number {
  // xorshift-ish scramble: cheap, and spreads adjacent indices well.
  let x = (n + 1) * 2654435761 + salt * 40503;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  const spread = MAX_STEP - MIN_STEP + 1;
  return MIN_STEP + (Math.abs(x) % spread);
}

/**
 * The running total at this instant.
 *
 * Sums every step that has "happened" since the snapshot. Summing rather than
 * multiplying by an average is what makes it reproducible: the same elapsed
 * time always yields the same total, on any device.
 */
export function driftedValue(base: number, asOf: string, salt = 0, now = Date.now()): number {
  const started = Date.parse(asOf);
  if (Number.isNaN(started)) return base;

  const ticks = Math.floor(Math.max(0, now - started) / TICK_MS);

  // A snapshot is at most a few hours old, so this loop is bounded — but a
  // stale one (a tab left open overnight) must not spin for a million
  // iterations, so past a cap it uses the mean step instead.
  const CAP = 20_000;
  if (ticks > CAP) {
    const mean = (MIN_STEP + MAX_STEP) / 2;
    return base + Math.floor(ticks * mean);
  }

  let total = 0;
  for (let i = 0; i < ticks; i += 1) total += stepFor(i, salt);
  return base + total;
}

export function useLiveStat(
  base: number | undefined,
  asOf: string | undefined,
  salt = 0,
): number | undefined {
  const [value, setValue] = useState<number | undefined>(() =>
    base === undefined || asOf === undefined ? undefined : driftedValue(base, asOf, salt),
  );

  useEffect(() => {
    if (base === undefined || asOf === undefined) {
      setValue(undefined);
      return;
    }

    setValue(driftedValue(base, asOf, salt));

    const id = setInterval(() => {
      setValue(driftedValue(base, asOf, salt));
    }, TICK_MS);

    return () => { clearInterval(id); };
  }, [base, asOf, salt]);

  return value;
}

/**
 * A different salt per counter, so the three do not move in lockstep.
 *
 * Identical jumps across three numbers at the same instant reads as one
 * animation rather than three independent figures.
 */
export const TICK_SALTS = {
  decided: 1,
  today: 7,
  cooked: 13,
} as const;
