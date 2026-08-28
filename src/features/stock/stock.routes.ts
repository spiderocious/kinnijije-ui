import { createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { rootRoute } from '@app/app.root-route';
import { ROUTES } from '@shared/constants/routes';

export const stockRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.STOCK,
  component: lazyRouteComponent(() => import('./screen/stock-route')),
});

export const addStockRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.STOCK_ADD,
  component: lazyRouteComponent(() => import('./screen/add-stock-route')),
});

/** Parameterised — registered after every literal /stock path. */
export const stockItemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stock/$stockId',
  component: lazyRouteComponent(() => import('./screen/stock-item-route')),
});
