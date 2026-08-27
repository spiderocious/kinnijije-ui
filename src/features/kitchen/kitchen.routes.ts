import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

export const kitchenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.KITCHEN,
  component: lazyRouteComponent(() => import('./screen/kitchen-route')),
});
