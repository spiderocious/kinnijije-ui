import { loginRoute, registerRoute } from '@features/auth/auth.routes';
import { kitchenRoute } from '@features/kitchen/kitchen.routes';
import { landingRoute } from '@features/landing/landing.routes';
import { onboardingRoute } from '@features/onboarding/onboarding.routes';
import { previewRoute } from '@features/preview/preview.routes';
import { sceneIndexRoute, sceneRoute } from '@features/scenes/scenes.routes';

import { rootRoute } from './app.root-route';

/**
 * Top-level route tree. Features own their own route definitions;
 * this file only composes them.
 */
export const routeTree = rootRoute.addChildren([
  // The product, in the order a new cook meets it.
  landingRoute,
  registerRoute,
  loginRoute,
  onboardingRoute,
  kitchenRoute,

  // Design-system surfaces, not product screens.
  previewRoute,
  sceneIndexRoute,
  sceneRoute,
]);
