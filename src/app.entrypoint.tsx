import { Suspense } from 'react';

import { Outlet, useRouterState } from '@tanstack/react-router';

import { Loader2 } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { AppHeader } from '@ui/components';

function RouteFallback() {
  return (
    <div className="flex justify-center py-24" role="status" aria-live="polite">
      <Loader2 size={24} className="animate-spin text-ink-3" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Layout shared by every route. Rendered by the root route.
 */
export function AppEntrypoint() {
  // The design-system viewer owns its whole chrome — a product header above it
  // would compete with the specimen it is framing.
  const isViewer = useRouterState({
    select: (state) => state.location.pathname.startsWith(ROUTES.PREVIEW),
  });

  if (isViewer) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
