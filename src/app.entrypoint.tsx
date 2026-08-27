import { Suspense } from 'react';

import { Outlet, useRouterState } from '@tanstack/react-router';

import { Loader2 } from '@icons';
import { ROUTES } from '@shared/constants/routes';

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
  // The viewer and the scenes own their whole chrome — a product header above
  // either would compete with the thing being reviewed, and a scene has to
  // render at the real viewport to be worth looking at.
  const isViewer = useRouterState({
    select: (state) =>
      state.location.pathname.startsWith(ROUTES.PREVIEW) ||
      state.location.pathname.startsWith(ROUTES.SCENES),
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
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
