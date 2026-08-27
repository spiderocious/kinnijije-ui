import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

/** Every route-level component is lazy loaded. No exceptions. */
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.LOGIN,
  component: lazyRouteComponent(() => import('./screen/login-route')),
});

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.REGISTER,
  component: lazyRouteComponent(() => import('./screen/register-route')),
});
