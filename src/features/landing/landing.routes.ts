import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

export const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ENTRY,
  component: lazyRouteComponent(() => import('../hero/screen/hero-screen')),
});
