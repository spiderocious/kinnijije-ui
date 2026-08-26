import { Suspense } from 'react';

import { Outlet } from '@tanstack/react-router';

import { Loader2 } from '@icons';
import { AppHeader } from '@ui/components/app-header/app-header';

function RouteFallback() {
  return (
    <div className="flex justify-center py-24" role="status" aria-live="polite">
      <Loader2 size={24} className="animate-spin text-content-muted" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Layout shared by every route. Rendered by the root route.
 */
export function AppEntrypoint() {
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
