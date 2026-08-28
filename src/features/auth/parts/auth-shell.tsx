import type { ReactNode } from 'react';

import { Link } from '@tanstack/react-router';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';

import { AuthArt } from './auth-art';

interface AuthShellProps {
  readonly title: string;
  readonly subtitle: string;
  readonly children: ReactNode;
  readonly footer: ReactNode;
}

/**
 * The frame both auth screens share.
 *
 * Phone: one centred column. Desktop: the form takes the LEFT half and the
 * illustration the right — a form centred in a wide viewport leaves the eye
 * nowhere to rest, and stretching it to fill instead makes it harder to read.
 *
 * The form column stays width-capped inside its half for exactly that reason.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-ground lg:grid lg:grid-cols-2">
      <div className="grid min-h-dvh place-items-center px-5 py-10 sm:px-6 lg:min-h-0 lg:px-10">
        <div className="w-full max-w-[400px]">
          <header className="mb-7 text-center lg:text-left">
            <Link to={ROUTES.ENTRY} aria-label="KinniJije home">
              <KoboyoIcon name="cookingPot" size={40} className="text-sky" alone />
            </Link>
            <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-display sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-ink-2 sm:text-md">{subtitle}</p>
          </header>

          {children}

          <footer className="mt-6 text-center text-sm text-ink-2 lg:text-left">{footer}</footer>
        </div>
      </div>

      <AuthArt />
    </div>
  );
}
