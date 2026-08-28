import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

export const heroRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.HERO,
  component: lazyRouteComponent(() => import('./screen/hero-screen')),
});
