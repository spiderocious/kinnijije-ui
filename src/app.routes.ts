import { entryRoute } from '@features/entry/entry.routes';
import { previewRoute } from '@features/preview/preview.routes';
import { sceneIndexRoute, sceneRoute } from '@features/scenes/scenes.routes';

import { rootRoute } from './app.root-route';

/**
 * Top-level route tree. Features own their own route definitions;
 * this file only composes them.
 */
export const routeTree = rootRoute.addChildren([
  entryRoute,
  previewRoute,
  sceneIndexRoute,
  sceneRoute,
]);
