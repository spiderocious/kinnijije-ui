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

  /**
   * Hide this banner ONLY when every problem is already visible on a field.
   *
   * A `_root` error belongs to the whole request and no input can render it, so
   * hiding the banner would leave the person with a form that refuses to submit
   * and nothing on screen explaining why. Same for a field this form does not
   * render — the message has nowhere else to go.
   */
  const fieldKeys = Object.keys(error.fieldErrors ?? {});
  const everyProblemHasAField =
    error.code === 'validation_error' &&
    fieldKeys.length > 0 &&
    !fieldKeys.includes('_root');

  if (everyProblemHasAField) return null;

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
