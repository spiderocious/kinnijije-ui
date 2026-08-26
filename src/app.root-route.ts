import { createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import { AppEntrypoint } from './app.entrypoint';
import { NotFoundScreen, RouteErrorBoundary } from '@ui/components';

export interface AppRouterContext {
  queryClient: QueryClient;
}

/**
 * Root route. Every feature route is registered as a child of this one,
 * so the entrypoint layout and error boundary wrap the whole tree.
 */
export const rootRoute = createRootRouteWithContext<AppRouterContext>()({
  component: AppEntrypoint,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: NotFoundScreen,
});
