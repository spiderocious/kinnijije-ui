import { Link } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { Logo } from '@ui/components';

export function AppHeader() {
  return (
    <header className="border-b border-line-2">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link to={ROUTES.ROOT} aria-label="Kinnijije home">
          <Logo />
        </Link>
      </div>
    </header>
  );
}
