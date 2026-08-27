import type { ReactNode } from 'react';

import { Link } from '@tanstack/react-router';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';

interface AuthShellProps {
  readonly title: string;
  readonly subtitle: string;
  readonly children: ReactNode;
  readonly footer: ReactNode;
}

/**
 * The frame both auth screens share.
 *
 * Centred and width-capped rather than stretched: a form is easier to read in a
 * column, so the desktop layout gives it more air, not more width.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-ground">
      <div className="grid min-h-dvh place-items-center px-5 py-10 sm:px-6">
        <div className="w-full max-w-[400px]">
          <header className="mb-7 text-center">
            <Link to={ROUTES.ENTRY} aria-label="KinniJije home">
              <KoboyoIcon name="cookingPot" size={40} className="text-sky" alone />
            </Link>
            <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-display sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-ink-2 sm:text-md">{subtitle}</p>
          </header>

          {children}

          <footer className="mt-6 text-center text-sm text-ink-2">{footer}</footer>
        </div>
      </div>
    </div>
  );
}
