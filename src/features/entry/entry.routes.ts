import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

/**
 * Every route-level component is lazy loaded. No exceptions.
 */
export const entryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ENTRY,
  component: lazyRouteComponent(() => import('./screen/entry-screen')),
});
