/**
 * Every polling interval in the app, in one place.
 *
 * They are NOT all the same number — what is being waited on differs, and so
 * does the right cadence:
 *
 *   - watching one job you started is worth checking often at first
 *   - a background list of everything running is not
 *
 * The rule for picking one: how long does a person stare at this before it
 * changes, and what does an extra request cost? Extraction usually finishes in
 * two to four seconds, so a flat three-second poll would make a two-second job
 * feel like a three-second one. Hence the backoff below.
 */

/**
 * Backoff schedule for watching a single job.
 *
 * Each entry says "until this many milliseconds have elapsed, poll at this
 * interval". Past the last threshold the final interval holds.
 *
 * Fast at the start because that is where most jobs finish; slow later because
 * a job still running at thirty seconds is not about to finish in the next
 * half-second, and by then the requests are pure waste.
 */
export const JOB_POLL_BACKOFF: readonly { readonly untilMs: number; readonly everyMs: number }[] = [
  { untilMs: 5_000, everyMs: 800 },
  { untilMs: 15_000, everyMs: 2_000 },
  { untilMs: 45_000, everyMs: 4_000 },
  { untilMs: Number.POSITIVE_INFINITY, everyMs: 8_000 },
];

/**
 * The list of all jobs, on the queue screen.
 *
 * Nobody is waiting on a specific outcome here — it is a status board — so it
 * refreshes at a human's reading pace rather than a machine's.
 */
export const JOB_LIST_POLL_MS = 15_000;

/**
 * How long to keep polling one job before giving up.
 *
 * A read that has not finished in two minutes is not going to; saying so beats
 * a progress bar that never moves.
 */
export const JOB_POLL_TIMEOUT_MS = 120_000;

/**
 * How long to keep checking ONE photo before letting it through unchecked.
 *
 * Shorter than a full read: the check runs on the small model, and an
 * unanswered check is not a rejection — the photo is used anyway.
 */
export const PHOTO_CHECK_TIMEOUT_MS = 60_000;

/**
 * How long to wait after queueing the weekly reading before re-reading it.
 *
 * Not a poll — a single delayed refetch. The job writes the reading, and there
 * is nothing to watch, so one look a few seconds later is enough.
 */
export const WEEK_READING_SETTLE_MS = 4_000;

/**
 * The interval for the elapsed time, given how long we have been waiting.
 *
 * Exported so both the React Query poller and any hand-rolled loop pick the
 * same cadence from the same table.
 */
export function jobPollInterval(elapsedMs: number): number {
  for (const stage of JOB_POLL_BACKOFF) {
    if (elapsedMs < stage.untilMs) return stage.everyMs;
  }
  // Unreachable while the last threshold is Infinity, but a table is data and
  // data gets edited.
  return JOB_POLL_BACKOFF[JOB_POLL_BACKOFF.length - 1]?.everyMs ?? 8_000;
}
