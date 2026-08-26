import { Link } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';

export function NotFoundScreen() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-4 px-6 py-24">
      <p className="font-mono text-sm font-bold text-ink-3">404</p>
      <h1 className="font-display text-2xl font-extrabold tracking-display">Page not found</h1>
      <p className="text-sm text-ink-2">
        The page you are looking for does not exist or has moved.
      </p>
      <Link to={ROUTES.ROOT} className="text-sm font-extrabold text-sky-on hover:underline">
        Back home
      </Link>
    </div>
  );
}
