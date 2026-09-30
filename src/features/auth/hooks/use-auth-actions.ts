import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';

import { ROUTES } from '@shared/constants/routes';
import type { ApiError } from '@shared/services/api-client';

import { carryOverDraft } from '@features/decide/services/decide-carryover';
import { decideDraft } from '@features/decide/services/decide-draft';

import { useNextPath } from './use-next-path';
import { authApi } from '../services/auth.api';
import type { AuthSession, LoginPayload, RegisterPayload } from '../types/auth.types';
import { useSession } from './use-session';

/**
 * Where someone lands after signing in.
 *
 * The decision is the SERVER's — `has_onboarded` comes off the user object —
 * so a cleared browser or a second device cannot make someone repeat
 * onboarding, and cannot skip it either.
 */
function landingRouteFor(session: AuthSession): string {
  return session.user.has_onboarded ? ROUTES.KITCHEN : ROUTES.ONBOARDING;
}

export function useRegister() {
  const { signIn } = useSession();
  const navigate = useNavigate();

  return useMutation<AuthSession, ApiError, RegisterPayload>({
    mutationFn: authApi.register,
    onSuccess: (session) => {
      signIn(session);

      /**
       * A guest converting from the decide flow has already answered every
       * question onboarding asks, so replaying their draft lets the new
       * account skip onboarding entirely and land on the meal they chose.
       *
       * Deliberately not awaited before navigating: the account exists and the
       * session is live, so making somebody watch a spinner for two writes
       * that cannot fail visibly would be worse than landing them immediately.
       * A failure leaves the draft in place to be retried.
       */
      const draft = decideDraft.get();
      if (draft !== null && draft.verdict !== null) {
        void carryOverDraft(draft).then((result) => {
          void navigate({
            to: result.mealId !== null ? ROUTES.MEAL(result.mealId) : landingRouteFor(session),
          });
        });
        return;
      }

      // A brand-new account has never onboarded, so this is always onboarding —
      // but it is read off the response rather than assumed, so the rule stays
      // true if registration ever pre-completes it.
      void navigate({ to: landingRouteFor(session) });
    },
  });
}

export function useLogin() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const next = useNextPath();

  return useMutation<AuthSession, ApiError, LoginPayload>({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      signIn(session);

      // Back to whatever they were trying to reach — but ONLY once onboarding
      // is done. Somebody who has never set up a kitchen cannot use the page
      // they were sent to anyway, and the guard would only bounce them here
      // again.
      if (next !== null && session.user.has_onboarded) {
        void navigate({ to: next as never });
        return;
      }

      void navigate({ to: landingRouteFor(session) });
    },
  });
}

export function useSignOut() {
  const { signOut } = useSession();
  const navigate = useNavigate();

  return () => {
    signOut();
    void navigate({ to: ROUTES.ENTRY });
  };
}

/** Asking for a reset link. Succeeds whatever the address — see the api. */
export function useForgotPassword() {
  return useMutation<void, ApiError, string>({
    mutationFn: authApi.forgotPassword,
  });
}

/** Spending a reset link. Every session is revoked, so they sign in fresh. */
export function useResetPassword() {
  return useMutation<void, ApiError, { token: string; newPassword: string }>({
    mutationFn: ({ token, newPassword }) => authApi.resetPassword(token, newPassword),
  });
}
