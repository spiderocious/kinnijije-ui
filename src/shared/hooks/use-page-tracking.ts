import { useEffect } from 'react';

import { ROUTES } from '@shared/constants/routes';
import { EVENTS, analytics } from '@shared/services/analytics';
import { router } from '@app/app.router';

import { useFeatures } from './use-features';

/**
 * The paths that send a page view, and what they send.
 *
 * An allowlist rather than "everything": these are the entry points whose
 * traffic decides product direction, and an allowlist means an in-app screen
 * cannot start reporting itself by accident when somebody adds a route.
 *
 * `/` and `/decide` render the SAME screen — the flow is now the front door and
 * the old path is kept as an alias — so both are listed and the event carries
 * which one was used. Merging them would hide how much traffic still arrives on
 * the shared links.
 */
const TRACKED: Record<string, { event: typeof EVENTS[keyof typeof EVENTS]; isAlias: boolean }> = {
  [ROUTES.ENTRY]: { event: EVENTS.DECIDE_LANDING_VIEWED, isAlias: false },
  [ROUTES.DECIDE]: { event: EVENTS.DECIDE_LANDING_VIEWED, isAlias: true },
  [ROUTES.WHY]: { event: EVENTS.WHY_PAGE_VIEWED, isAlias: false },
};

/** Remembers whether this browser has been here before, for `is_returning`. */
const SEEN_KEY = 'kj.seen';

function isReturning(): boolean {
  try {
    const seen = localStorage.getItem(SEEN_KEY) !== null;
    if (!seen) localStorage.setItem(SEEN_KEY, '1');
    return seen;
  } catch {
    // Private mode, or storage blocked. Not knowing is fine.
    return false;
  }
}

/**
 * Turns analytics on once the server allows it, then reports page views.
 *
 * Mounted once, by the root route's layout, so the router subscription lives
 * for the whole session rather than being torn down on every navigation.
 */
export function usePageTracking(): void {
  const { analytics_client: allowed } = useFeatures();

  // Split from the subscription below: this runs again when the flag arrives,
  // while the subscription must be set up exactly once.
  useEffect(() => {
    analytics.enable(allowed);

    /**
     * Which surface this is.
     *
     * The console and the product share an origin, so without this a handful
     * of operators clicking all day looks like the most engaged cohort in the
     * product. Every product report should filter `app_surface != admin`.
     */
    analytics.register({
      app_surface: router.state.location.pathname.startsWith('/admin') ? 'admin' : 'web',
    });
  }, [allowed]);

  useEffect(() => {
    function report(pathname: string) {
      const tracked = TRACKED[pathname];
      if (tracked === undefined) return;

      analytics.track(tracked.event, {
        path: pathname,
        is_alias: tracked.isAlias,
        is_returning: isReturning(),
      });
    }

    // The first load happens before any router event fires.
    report(router.state.location.pathname);

    // `onResolved` rather than `onBeforeLoad`: a navigation that is cancelled
    // or redirected mid-flight is not a visit.
    return router.subscribe('onResolved', ({ toLocation }) => {
      report(toLocation.pathname);
    });
  }, []);
}
