import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

const screen = lazyRouteComponent(() => import('../hero/screen/hero-screen'));

/**
 * The marketing landing, still at `/`.
 *
 * The decide flow lives at `/decide` until it has been tested against real
 * traffic. Making it the front door is a one-line change here and one in
 * `decide.routes.ts`.
 */
export const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ENTRY,
  component: screen,
});

/**
 * The same page at `/why`.
 *
 * Exists now rather than later so the decide flow can link to it by its
 * permanent name, and so the eventual swap does not also have to introduce a
 * new URL.
 */
export const whyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.WHY,
  component: screen,
});
