/**
 * A circuit breaker for runaway request loops.
 *
 * Exists because of a real incident: an effect on the Ask screen re-fired
 * `POST /decide` on every render and sent thousands of requests in seconds.
 * The underlying bug is fixed, but "we fixed that one" is not a defence — any
 * effect with an unstable dependency can do this again, and the browser will
 * happily saturate a phone's connection and somebody's data plan while it
 * happens.
 *
 * So this sits under `apiClient` and refuses to let any single endpoint be
 * called more than a sane number of times in a short window. It is a LAST
 * RESORT, deliberately set far above anything legitimate: polling a turn every
 * 700ms is roughly 85 calls a minute, and a person tapping fast might manage
 * ten. Thirty in ten seconds to the same endpoint is not a user.
 */

/** Per endpoint, not global: one chatty screen must not break the rest. */
const WINDOW_MS = 10_000;

/** Above this, something is wrong. Well clear of the fastest honest caller. */
const MAX_IN_WINDOW = 30;

/** How long an endpoint stays cut off once it trips. */
const COOLDOWN_MS = 30_000;

interface Bucket {
  /** Timestamps inside the window. */
  hits: number[];
  /** When the breaker opened, or null while it is closed. */
  trippedAt: number | null;
}

const buckets = new Map<string, Bucket>();

/**
 * Collapses a path to the shape of the endpoint.
 *
 * `/ask/sessions/asks_01abc/turns/askt_02def` and the same call for another
 * session are ONE endpoint for this purpose: a loop usually hammers one path
 * with one id, but a loop that creates a new session each time would otherwise
 * look like a thousand different endpoints and slip through.
 */
function endpointOf(path: string): string {
  return path
    .split('?')[0]!
    .split('/')
    .map((segment) => (/[_-]?\d|^[0-9a-f]{16,}$/.test(segment) ? ':id' : segment))
    .join('/');
}

export class RequestFloodError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string) {
    super('Too many requests were sent too quickly. Please reload the page.');
    this.name = 'RequestFloodError';
    this.endpoint = endpoint;
  }
}

/**
 * Records a call and throws once an endpoint is clearly looping.
 *
 * Throwing rather than silently dropping: a dropped request leaves a promise
 * that never settles and a screen that spins forever, which is harder to
 * diagnose than a loud failure. The error names the endpoint so the console
 * says exactly what ran away.
 */
export function guardRequest(path: string): void {
  const key = endpointOf(path);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [], trippedAt: null };

  if (bucket.trippedAt !== null) {
    if (now - bucket.trippedAt < COOLDOWN_MS) throw new RequestFloodError(key);
    // Cooled off. Start clean rather than resuming mid-flood.
    bucket.trippedAt = null;
    bucket.hits = [];
  }

  bucket.hits = bucket.hits.filter((at) => now - at < WINDOW_MS);
  bucket.hits.push(now);

  if (bucket.hits.length > MAX_IN_WINDOW) {
    bucket.trippedAt = now;
    buckets.set(key, bucket);
    // eslint-disable-next-line no-console -- the one place a console line is
    // the right tool: this is a developer-facing alarm about a bug in our code.
    console.error(
      `[request-guard] ${key} was called ${String(bucket.hits.length)} times in ` +
        `${String(WINDOW_MS / 1000)}s and has been cut off. This is a loop, not a user.`,
    );
    throw new RequestFloodError(key);
  }

  buckets.set(key, bucket);
}

/** For tests, and for a deliberate recovery after a reload. */
export function resetRequestGuard(): void {
  buckets.clear();
}
