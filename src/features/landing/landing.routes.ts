import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

const screen = lazyRouteComponent(() => import('../hero/screen/hero-screen'));

/**
 * `/` sends everybody to the decide flow.
 *
 * A REDIRECT rather than rendering the flow at `/` directly, so there is one
 * canonical URL for it. Two paths serving the same screen splits search
 * ranking between them and makes a shared link ambiguous about which one was
 * meant.
 *
 * `throw redirect` in `beforeLoad` happens before anything renders, so nobody
 * sees the marketing page flash first. `replace` keeps `/` out of the back
 * stack: pressing Back from the flow should leave the site, not bounce through
 * a redirect that immediately sends them forward again.
 */
export const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ENTRY,
  beforeLoad: () => {
    throw redirect({ to: ROUTES.DECIDE, replace: true });
  },
});

/**
 * The marketing page, at `/why`.
 *
 * Kept whole rather than deleted: it still answers "what is this" for somebody
 * who wants that before deciding, and the flow's header links to it.
 */
export const whyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.WHY,
  component: screen,
});
