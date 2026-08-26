import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

/**
 * The design-system viewer route. Lazy loaded like every other route-level
 * component — the whole component library should not be in the entry bundle.
 */
export const previewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.PREVIEW,
  component: lazyRouteComponent(() => import('./screen/preview-screen')),
});
