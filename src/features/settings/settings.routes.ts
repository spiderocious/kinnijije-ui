import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { rootRoute } from '@app/app.root-route';
import { ROUTES } from '@shared/constants/routes';

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.SETTINGS,
  component: lazyRouteComponent(() => import('./screen/settings-route')),
});
