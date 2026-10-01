import { useEffect, useRef } from 'react';

import { useRouterState, type ErrorComponentProps } from '@tanstack/react-router';

import { AlertCircle } from '@icons';
import { ENV } from '@shared/config/env';
import { EVENTS, analytics } from '@shared/services/analytics';
import { Button } from '@ui/primitives';

/**
 * Everything worth knowing about a thrown value.
 *
 * Handles the non-Error case deliberately: `throw 'something'` and a rejected
 * promise carrying a plain object both reach a boundary, and `error.message`
 * on those is `undefined` — which reports as a crash with no cause.
 */
function describe(error: unknown): {
  name: string;
  message: string;
  stack: string | null;
  /** The API error code, when the thrown value carries one. */
  code: string | null;
  status: number | null;
} {
  if (error instanceof Error) {
    // `ApiError` adds `code` and `status`; reading them off the Error rather
    // than importing it keeps this component free of a feature dependency.
    const extra = error as Error & { code?: unknown; status?: unknown };
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
      code: typeof extra.code === 'string' ? extra.code : null,
      status: typeof extra.status === 'number' ? extra.status : null,
    };
  }

  return {
    name: typeof error,
    // Stringified, because something that is not an Error still has to be
    // reported as something rather than as nothing.
    message: typeof error === 'string' ? error : JSON.stringify(error) || 'unknown',
    stack: null,
    code: null,
    status: null,
  };
}

/** Truncated so one enormous stack cannot blow a property-size limit. */
const STACK_LIMIT = 2000;

/**
 * Route-level boundary so a broken feature cannot crash the whole application.
 *
 * Also the ONE place a client-side crash becomes visible. Without this, a
 * render error is invisible to everybody but the person looking at it: the
 * server returned 200, the logs are clean, and nothing was recorded.
 */
export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
  const detail = describe(error);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });

  /**
   * Reported once per error, not once per render.
   *
   * A boundary re-renders — on a parent update, on a resize, on StrictMode's
   * double mount in development — and reporting in the render body would send
   * the same crash several times and inflate every count derived from it.
   */
  const reported = useRef<string | null>(null);

  useEffect(() => {
    const fingerprint = `${detail.name}:${detail.message}:${pathname}`;
    if (reported.current === fingerprint) return;
    reported.current = fingerprint;

    analytics.track(EVENTS.APP_ERROR_BOUNDARY, {
      error_name: detail.name,
      error_message: detail.message,
      // Truncated: a stack can run to tens of kilobytes, and the top frames
      // are the ones that identify the fault.
      error_stack: detail.stack === null ? null : detail.stack.slice(0, STACK_LIMIT),
      error_code: detail.code,
      http_status: detail.status,
      /**
       * Where it happened. The path is the single most useful property here —
       * "every crash is on /cook/:id" is an answer, "there were 14 crashes" is
       * not.
       */
      path: pathname,
      // The raw query string, so a crash that depends on a parameter is
      // reproducible. It carries no credentials — tokens live in storage.
      search: searchStr,
      /**
       * Which deployment. Not a build sha — there is no version global wired
       * into the build yet, and inventing one here would be a second thing to
       * keep in step. `app_env` rides on every event via the service anyway.
       */
      app_env: ENV.APP_ENV,
      user_agent: navigator.userAgent,
      viewport: `${String(window.innerWidth)}x${String(window.innerHeight)}`,
    });

    // Logged as well as tracked: analytics can be switched off or blocked, and
    // a crash is the one thing that must still be visible in a console when
    // somebody is debugging it.
    // eslint-disable-next-line no-console -- a caught crash warrants it
    console.error('[error boundary]', detail.name, detail.message, {
      path: pathname,
      search: searchStr,
      stack: detail.stack,
    });
  }, [detail.name, detail.message, detail.stack, detail.code, detail.status, pathname, searchStr]);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-start gap-4 px-6 py-24">
      <AlertCircle size={32} className="text-critical" aria-hidden="true" />
      <h1 className="font-display text-2xl font-extrabold tracking-display">Something went wrong</h1>
      <p className="text-sm text-ink-2">{detail.message}</p>
      <Button variant="secondary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
