import { createRouter } from '@tanstack/react-router';

import { queryClient } from '@shared/services/query-client';

import { routeTree } from './app.routes';

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
