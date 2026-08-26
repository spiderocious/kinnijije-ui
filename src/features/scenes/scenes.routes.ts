import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { rootRoute } from '@app/app.root-route';

/**
 * Every scene is reachable standalone at `/scenes/<id>`, at a real viewport
 * with no viewer chrome — so it can be opened on a phone, shared, or tested
 * the way it will actually be used.
 *
 * `?frame=desktop` forces the desktop composition on a wide screen; without it
 * the scene picks its frame from the viewport.
 */
export const sceneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: `${ROUTES.SCENES}/$sceneId`,
  component: lazyRouteComponent(() => import('./screen/scene-screen')),
  validateSearch: (search: Record<string, unknown>): { frame?: 'phone' | 'desktop' } => {
    const frame = search['frame'];
    return frame === 'phone' || frame === 'desktop' ? { frame } : {};
  },
});

/** The index — a list of every scene, for finding one by name. */
export const sceneIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.SCENES,
  component: lazyRouteComponent(() => import('./screen/scene-index-screen')),
});
