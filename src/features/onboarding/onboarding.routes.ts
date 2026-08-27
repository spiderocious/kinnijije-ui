import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

export const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.ONBOARDING,
  component: lazyRouteComponent(() => import('./screen/onboarding-route')),
});
