import type { ErrorComponentProps } from '@tanstack/react-router';

import { AlertCircle } from '@icons';
import { AppButton } from '@ui/primitives/app-button/app-button';

/**
 * Route-level boundary so a broken feature cannot crash the whole application.
 */
export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-start gap-4 px-6 py-24">
      <AlertCircle size={32} className="text-error" aria-hidden="true" />
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-content-muted">{message}</p>
      <AppButton variant="secondary" onClick={reset}>
        Try again
      </AppButton>
    </div>
  );
}
