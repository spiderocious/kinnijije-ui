import type { ReactNode } from 'react';
import { Show } from 'meemaw';

import { Blob, BlobThinking, KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';

/**
 * The error and wait states.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/155-cooking-loader.html
 *                                                          158-error-cold.html
 *                                                          159-error-warm.html
 *                                                          175-feature-disabled.html
 *
 * The three failures are genuinely different and must not share a component:
 *
 * - **Cold** — nothing to show. The content is gone, so the error replaces it.
 * - **Warm** — a refresh failed but the cache is still good. The content
 *   **stays mounted** and the error is a banner above it.
 * - **Disabled** — policy, not failure. There is nothing to retry.
 */

export interface ErrorStateProps {
  readonly title: string;
  /** Names the FIX, not the failure. "Check your connection", not "network error". */
  readonly body: string;
  /** REQUIRED — an error with no way forward is a dead end. */
  readonly onRetry: () => void;
  readonly retryLabel?: string;
  /** A second way out, when retrying may not be the answer. */
  readonly secondary?: ReactNode;
  readonly className?: string;
}

/** Nothing to show. The error replaces the content. */
export function ErrorState({
  title,
  body,
  onRetry,
  retryLabel = 'Try again',
  secondary,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-blade-lg border border-critical-border bg-critical-soft px-6 py-9 text-center',
        className,
      )}
    >
      <Blob name="error" size={64} expression="unsure" />
      <p className="font-display text-lg font-extrabold tracking-display text-critical-onsoft">
        {title}
      </p>
      {/* The copy names the fix, not the failure. */}
      <p className="max-w-[46ch] text-sm text-ink-2">{body}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button icon="cycle" onClick={onRetry}>
          {retryLabel}
        </Button>
        {secondary}
      </div>
    </div>
  );
}

export interface WarmErrorProps {
  /** REQUIRED — the way back to fresh data. */
  readonly onRetry: () => void;
  /** How old the cached content is. */
  readonly age?: string;
  readonly title?: string;
  readonly className?: string;
}

/**
 * A refresh failed, but the cache is good.
 *
 * **This is a BANNER, never a replacement** — the content stays mounted
 * underneath. If there is no cache to keep, use `ErrorState` instead: showing
 * a warm error above nothing is worse than an honest cold one.
 */
export function WarmError({
  onRetry,
  age,
  title = 'Could not refresh',
  className,
}: WarmErrorProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-blade border border-caution-border bg-caution-soft px-4 py-3',
        className,
      )}
    >
      <KoboyoIcon name="offlineCache" size={18} className="shrink-0 text-caution-onsoft" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-caution-onsoft">{title}</p>
        <p className="text-sm text-ink-2">
          Showing what we had{age !== undefined ? ` from ${age}` : ''}.
        </p>
      </div>
      <Button variant="secondary" size="sm" icon="cycle" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export interface FeatureDisabledProps {
  /** Which switch is off, in the user's words — "Photo capture". */
  readonly flag: string;
  /** REQUIRED — a lock that names no other route is a dead end. */
  readonly alternative: string;
  readonly icon?: KoboyoIconName;
  readonly action?: ReactNode;
  readonly className?: string;
}

/**
 * A feature is switched off.
 *
 * **Caution-toned, never critical — policy is not failure.** And there is
 * deliberately **no retry**: retrying does not flip a flag, and offering one
 * teaches a user to press a button that cannot work.
 */
export function FeatureDisabled({
  flag,
  alternative,
  icon = 'lockShownOpenClosed',
  action,
  className,
}: FeatureDisabledProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-blade-lg border border-caution-border bg-caution-soft px-6 py-8 text-center',
        className,
      )}
    >
      <KoboyoIcon name={icon} size={32} className="text-caution-onsoft" alone />
      <p className="font-display text-md font-extrabold tracking-display text-caution-onsoft">
        {flag} is paused
      </p>
      {/* The other route, named. */}
      <p className="max-w-[44ch] text-sm text-ink-2">{alternative}</p>
      <Show when={action !== undefined}>
        <div className="mt-1">{action}</div>
      </Show>
    </div>
  );
}

export interface CookingLoaderProps {
  /** REQUIRED — a loader with no explanation is a stall. */
  readonly message: string;
  readonly sub?: string;
  readonly size?: number;
  readonly className?: string;
}

/**
 * The character loader.
 *
 * **Reserved for waits over about two seconds.** A short wait gets a skeleton;
 * a character that appears and vanishes inside 400ms is a flicker, and it makes
 * a fast product feel slow.
 */
export function CookingLoader({ message, sub, size = 88, className }: CookingLoaderProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-8 text-center', className)}>
      <BlobThinking size={size} label={message} />
      <p className="font-display text-md font-extrabold tracking-display">{message}</p>
      <Show when={sub !== undefined}>
        <p className="max-w-[42ch] text-sm text-ink-2">{sub}</p>
      </Show>
    </div>
  );
}
