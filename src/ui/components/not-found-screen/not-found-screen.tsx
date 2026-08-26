import { Link } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';

export function NotFoundScreen() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-4 px-6 py-24">
      <p className="text-sm font-semibold text-content-muted">404</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-content-muted">
        The page you are looking for does not exist or has moved.
      </p>
      <Link to={ROUTES.ROOT} className="text-sm font-semibold text-primary hover:underline">
        Back home
      </Link>
    </div>
  );
}
