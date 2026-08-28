import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { rootRoute } from '@app/app.root-route';
import { ROUTES } from '@shared/constants/routes';

export const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.CHAT,
  component: lazyRouteComponent(() => import('./screen/chat-route')),
});
