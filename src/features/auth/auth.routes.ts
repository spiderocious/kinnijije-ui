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

/** Both unauthenticated — somebody who cannot sign in is the whole audience. */
export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.FORGOT_PASSWORD,
  component: lazyRouteComponent(() => import('./screen/forgot-password-route')),
});

export const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.RESET_PASSWORD,
  component: lazyRouteComponent(() => import('./screen/reset-password-route')),
});
