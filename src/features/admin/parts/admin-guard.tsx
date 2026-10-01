import { useEffect, type ReactNode } from 'react';

import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { usePermissions } from '@shared/hooks/use-permissions';
import type { Scope } from '@shared/constants/permissions';
import { buildNext, NEXT_PARAM } from '@features/auth/hooks/use-next-path';
import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { Button } from '@ui/primitives';

/**
 * Gates the console.
 *
 * The admin routes had NO guard — every screen rendered for anybody who typed
 * the url. The requests behind them all 403, so no data leaked, but showing the
 * shell of a console to a stranger is its own problem: it advertises what
 * exists and looks like a way in.
 *
 * Three outcomes:
 *   not signed in       → the console sign-in, carrying where they were going
 *   signed in, no role  → told plainly, with a way back to the app
 *   admin or above      → render
 *
 * This is CONVENIENCE, not security. The server enforces a role AND a scope on
 * every one of the 69 admin endpoints, and that is what actually protects the
 * data — a hidden route is not a permission.
 *
 * `scope` narrows it further: a staff member with `recipes:write` and nothing
 * else gets the same honest card on /admin/users rather than a screen of 403s.
 */
export function AdminGuard({
  children,
  scope,
}: {
  readonly children: ReactNode;
  /** The scope this screen needs. Omit for one any staff member may open. */
  readonly scope?: Scope;
}) {
  const { isStaff, can, isLoading } = usePermissions();
  const isSignedIn = isStaff;
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });

  // Staff AND, where a screen names one, holding its scope.
  const isOperator = isStaff && (scope === undefined || can(scope));

  useEffect(() => {
    if (isLoading || isSignedIn) return;

    // Already on the console sign-in? Nothing to do — see the redirect loop
    // this exact check exists to prevent in RouteGuard.
    if (pathname === ROUTES.ADMIN_LOGIN) return;

    void navigate({
      to: ROUTES.ADMIN_LOGIN,
      search: { [NEXT_PARAM]: buildNext(pathname, searchStr) } as never,
      replace: true,
    });
  }, [isLoading, isSignedIn, navigate, pathname, searchStr]);

  // Nothing while the session resolves. Rendering the signed-out view first and
  // correcting a tick later flashes a login screen at an operator who is
  // already signed in.
  if (isLoading) return null;

  /**
   * Signed in, but not an operator.
   *
   * Told plainly instead of bounced. Somebody who lands here from a shared
   * link deserves to know why it did not work, and silently redirecting an
   * account that IS signed in reads as a bug.
   */
  if (isSignedIn && !isOperator) {
    return (
      <div className="counter grid min-h-dvh place-items-center bg-paper px-5">
        <div className="w-full max-w-[420px] rounded-blade border border-line bg-white p-8 text-center">
          <KoboyoIcon name="lockShownOpenClosed" size={36} className="text-ink-3" alone />
          <h1 className="mt-4 font-display text-xl font-extrabold tracking-display">
            Not your console
          </h1>
          <p className="mt-2 text-sm text-ink-2">
            {isStaff
              ? 'Your account does not have access to this part of the console. Somebody who manages staff can change that.'
              : 'This account does not have console access. If that is wrong, somebody with an admin account can change it.'}
          </p>
          <Button
            className="mt-5"
            fullWidth
            onClick={() => {
              void navigate({ to: ROUTES.KITCHEN });
            }}
          >
            Back to my kitchen
          </Button>
        </div>
      </div>
    );
  }

  return <Show when={isOperator}>{children}</Show>;
}
