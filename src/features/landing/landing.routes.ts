import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

/**
 * The marketing page, at `/why`.
 *
 * `/` renders the decide flow, so this keeps its own URL rather than being
 * deleted: it still answers "what is this" for somebody who wants that before
 * deciding, and the flow's header links to it.
 */
export const whyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.WHY,
  component: lazyRouteComponent(() => import('../hero/screen/hero-screen')),
});
