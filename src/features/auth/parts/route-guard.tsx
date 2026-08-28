import { useEffect, type ReactNode } from 'react';

import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';

import { buildNext, NEXT_PARAM } from '../hooks/use-next-path';
import { useSession } from '../hooks/use-session';

interface RouteGuardProps {
  readonly children: ReactNode;
  /** Where an unauthenticated visitor is sent. */
  readonly redirectTo?: string;
  /**
   * Whether this route is part of onboarding itself. Onboarding routes must
   * NOT bounce an un-onboarded user back to onboarding — that is an infinite
   * redirect.
   */
  readonly isOnboardingRoute?: boolean;
}

/**
 * Gates a route on the session.
 *
 * Three outcomes, in order:
 *   not signed in            → login
 *   signed in, not onboarded → onboarding (unless this IS onboarding)
 *   signed in and onboarded  → render
 *
 * Nothing renders while the session is still loading. Rendering the signed-out
 * view first and correcting a tick later shows a login flash to someone who is
 * already signed in.
 */
export function RouteGuard({
  children,
  redirectTo = ROUTES.LOGIN,
  isOnboardingRoute = false,
}: RouteGuardProps) {
  const { isSignedIn, hasOnboarded, isLoading } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });

  useEffect(() => {
    if (isLoading) return;

    if (!isSignedIn) {
      // Carry where they were going, so signing in finishes the journey rather
      // than dumping them on the kitchen and making them navigate again.
      void navigate({
        to: redirectTo,
        search: { [NEXT_PARAM]: buildNext(pathname, searchStr) } as never,
        replace: true,
      });
      return;
    }

    if (!hasOnboarded && !isOnboardingRoute) {
      void navigate({ to: ROUTES.ONBOARDING, replace: true });
      return;
    }

    // Someone who has finished onboarding should not be able to walk back
    // into it from history — send them on to the app.
    if (hasOnboarded && isOnboardingRoute) {
      void navigate({ to: ROUTES.KITCHEN, replace: true });
    }
  }, [
    isLoading,
    isSignedIn,
    hasOnboarded,
    isOnboardingRoute,
    navigate,
    redirectTo,
    pathname,
    searchStr,
  ]);

  const allowed = isSignedIn && (isOnboardingRoute ? !hasOnboarded : hasOnboarded);

  return <Show when={!isLoading && allowed}>{children}</Show>;
}

/**
 * The inverse: for login and register. Someone already signed in has no
 * business on the sign-in page, so they are moved along.
 */
export function GuestOnly({ children }: { readonly children: ReactNode }) {
  const { isSignedIn, hasOnboarded, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isSignedIn) return;
    void navigate({ to: hasOnboarded ? ROUTES.KITCHEN : ROUTES.ONBOARDING, replace: true });
  }, [isLoading, isSignedIn, hasOnboarded, navigate]);

  return <Show when={!isLoading && !isSignedIn}>{children}</Show>;
}
