import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { rootRoute } from '@app/app.root-route';
import { ROUTES } from '@shared/constants/routes';

export const weekRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.WEEK,
  component: lazyRouteComponent(() => import('./screen/week-route')),
});
