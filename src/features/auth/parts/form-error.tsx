import { Callout } from '@ui/feedback';
import type { ApiError } from '@shared/services/api-client';

/**
 * Renders whatever the server said went wrong.
 *
 * The message is displayed **verbatim** — the backend already resolved the
 * right copy from its message registry, so a hardcoded string here would be
 * drift waiting to happen. We branch on `code`, never on the message text, and
 * never on `rejection_reason`, which the backend is free to rename.
 */
export function FormError({ error }: { readonly error: ApiError | null }) {
  if (error === null) return null;

  // Field-level problems are shown on the fields themselves; repeating them
  // up here would say the same thing twice.
  const isFieldOnly =
    error.code === 'validation_error' &&
    error.fieldErrors !== undefined &&
    Object.keys(error.fieldErrors).length > 0;

  if (isFieldOnly) return null;

  // Being rate-limited or hitting a server fault is a "wait and retry", not a
  // "you did something wrong" — a softer tone reads more honestly.
  const isTransient = error.code === 'rate_limited' || error.status >= 500;

  const wait =
    error.retryAfterSeconds !== undefined ? ` Try again in ${formatWait(error.retryAfterSeconds)}.` : '';

  return (
    <Callout
      tone={isTransient ? 'caution' : 'critical'}
      title={error.message}
      {...(wait.length > 0 && { body: wait.trim() })}
      className="mb-4"
    />
  );
}

/** Rate limits carry a real wait — "try again later" gives a person nothing to act on. */
function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? 'a minute' : `${minutes} minutes`;
}
