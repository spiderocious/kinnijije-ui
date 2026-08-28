import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { rootRoute } from '@app/app.root-route';
import { ROUTES } from '@shared/constants/routes';

export const suggestionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.SUGGESTIONS,
  component: lazyRouteComponent(() => import('./screen/suggestions-route')),
});

export const favouritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.FAVOURITES,
  component: lazyRouteComponent(() => import('./screen/favourites-route')),
});

/** Parameterised — registered after every literal path in the tree. */
export const mealRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meals/$mealId',
  component: lazyRouteComponent(() => import('./screen/meal-route')),
});

export const cookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cook/$mealId',
  component: lazyRouteComponent(() => import('./screen/cook-route')),
});
