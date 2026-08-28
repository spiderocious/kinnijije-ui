import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { rootRoute } from '@app/app.root-route';
import { ROUTES } from '@shared/constants/routes';

export const marketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.MARKET,
  component: lazyRouteComponent(() => import('./screen/market-route')),
});
