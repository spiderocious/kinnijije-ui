import mixpanel from 'mixpanel-browser';

import { ENV, IS_DEVELOPMENT } from '@shared/config/env';

/**
 * Mixpanel, wrapped so nothing else in the app imports the SDK directly.
 *
 * Every export here is a no-op when `VITE_MIXPANEL_TOKEN` is unset. That is
 * the normal state of a fresh clone and of the test runner, and neither should
 * have to care — a missing token is a configuration fact, not an error.
 */

/** Read once. Flipping the token at runtime is not a thing we support. */
const token = import.meta.env.VITE_MIXPANEL_TOKEN;

let started = false;

export function initAnalytics(): void {
  // Guarded because React 19 StrictMode mounts effects twice in development,
  // and `mixpanel.init` on an already-initialised instance warns.
  if (!token || started) return;

  mixpanel.init(token, {
    // Page views are tracked by the router subscription in `use-page-tracking`,
    // which knows about client-side navigation. The SDK's own autocapture
    // would only ever see the first load.
    autocapture: false,
    track_pageview: false,
    persistence: 'localStorage',
    debug: IS_DEVELOPMENT,
  });

  mixpanel.register({ app_env: ENV.APP_ENV });
  started = true;
}

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (!started) return;
  mixpanel.track(name, properties);
}
