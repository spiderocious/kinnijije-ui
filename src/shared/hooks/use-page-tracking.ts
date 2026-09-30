import { useEffect } from 'react';

import { ROUTES } from '@shared/constants/routes';
import { initAnalytics, trackEvent } from '@shared/services/analytics';
import { router } from '@app/app.router';

/**
 * The only paths we send page views for, for now.
 *
 * Deliberately an allowlist rather than "everything": these two are the pages
 * whose traffic we are currently deciding `/decide` against, and an allowlist
 * means the in-app screens cannot start reporting themselves by accident when
 * somebody adds a route.
 */
const TRACKED: Record<string, string> = {
  [ROUTES.ENTRY]: 'Landing Viewed',
  [ROUTES.DECIDE]: 'Decide Viewed',
};

/**
 * Sends one page-view event per visit to a tracked path.
 *
 * Subscribes to the router rather than reading `useRouterState`, so this does
 * not re-render the tree it is mounted in on every navigation.
 */
export function usePageTracking(): void {
  useEffect(() => {
    initAnalytics();

    function report(pathname: string) {
      const event = TRACKED[pathname];
      if (event === undefined) return;
      trackEvent(event, { path: pathname });
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
