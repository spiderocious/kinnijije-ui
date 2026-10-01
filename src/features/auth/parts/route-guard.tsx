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
   * Whether this route is the retired onboarding flow. Such a route renders
   * nothing and forwards a signed-in visitor to the app.
   */
  readonly isOnboardingRoute?: boolean;
}

/**
 * Gates a route on the session.
 *
 * Two outcomes:
 *   not signed in → login
 *   signed in     → render
 *
 * ONBOARDING IS NO LONGER A GATE. A new account goes straight into the app,
 * so "has not onboarded" sends nobody anywhere — including older accounts
 * that never finished it, which must not be marched back through a flow that
 * has been retired. The onboarding route itself now forwards to the app, so a
 * bookmarked or emailed link to it still lands somewhere real.
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
  const { isSignedIn, isLoading } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });

  useEffect(() => {
    if (isLoading) return;

    if (!isSignedIn) {
      // ALREADY on the sign-in page? Then there is nothing to do.
      //
      // Without this the guard re-fires after its own navigate — `pathname` is
      // a dependency — and builds `?next=/login?next=/login?next=…`, growing
      // the url on every pass until the tab runs out of memory and Chrome
      // shows "Aw, Snap". That is the crash.
      if (pathname === redirectTo) return;

      // Carry where they were going, so signing in finishes the journey rather
      // than dumping them on the kitchen and making them navigate again.
      void navigate({
        to: redirectTo,
        search: { [NEXT_PARAM]: buildNext(pathname, searchStr) } as never,
        replace: true,
      });
      return;
    }

    // Onboarding is retired: anybody arriving at it — from history, a
    // bookmark or an old email — goes on to the app's default tab.
    if (isOnboardingRoute) {
      void navigate({ to: ROUTES.ENTRY, replace: true });
    }
  }, [isLoading, isSignedIn, isOnboardingRoute, navigate, redirectTo, pathname, searchStr]);

  const allowed = isSignedIn && !isOnboardingRoute;

  return <Show when={!isLoading && allowed}>{children}</Show>;
}

/**
 * The inverse: for login and register. Someone already signed in has no
 * business on the sign-in page, so they are moved along.
 */
export function GuestOnly({ children }: { readonly children: ReactNode }) {
  const { isSignedIn, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isSignedIn) return;
    void navigate({ to: ROUTES.ENTRY, replace: true });
  }, [isLoading, isSignedIn, navigate]);

  return <Show when={!isLoading && !isSignedIn}>{children}</Show>;
}
