import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';

import { EVENTS, analytics } from '@shared/services/analytics';
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
       * `identify` BEFORE the event, so the signup itself is attributed to the
       * new user id rather than the anonymous device.
       *
       * This is also the stitch: the provider links the prior anonymous device
       * id to this user, which is what carries the whole decide funnel across.
       * Without it every signup looks like it arrived from nowhere and the
       * flow's conversion rate is unknowable.
       */
      analytics.identify(session.user.id);
      analytics.setProfile({
        email: session.user.email,
        name: session.user.name,
        created_at: new Date().toISOString(),
        role: session.user.role,
        status: session.user.status,
        has_onboarded: session.user.has_onboarded,
      });

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

      // Splits "came through the flow" from "signed up cold" — the two groups
      // behave completely differently afterwards.
      analytics.track(EVENTS.SIGNED_UP, {
        method: 'password',
        had_decide_draft: draft !== null && draft.verdict !== null,
      });

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
    onError: (error) => {
      // `email_exists` is a login problem wearing a signup costume: they have
      // an account and do not know it, which is usually fixable copy.
      analytics.track(EVENTS.SIGNUP_FAILED, { error_code: error.code });
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

      analytics.identify(session.user.id);
      analytics.setProfile({
        email: session.user.email,
        role: session.user.role,
        status: session.user.status,
        has_onboarded: session.user.has_onboarded,
      });
      analytics.track(EVENTS.LOGGED_IN, { method: 'password' });

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
    onError: (error) => {
      // Separates forgotten passwords from locked accounts from suspended
      // ones — three different problems with three different fixes.
      analytics.track(EVENTS.LOGIN_FAILED, { error_code: error.code });
    },
  });
}

export function useSignOut() {
  const { signOut } = useSession();
  const navigate = useNavigate();

  return () => {
    analytics.track(EVENTS.LOGGED_OUT, {});
    // AFTER the event, or it would be sent under a forgotten identity.
    // Skipping the reset is how a shared laptop attributes one person's
    // cooking to whoever signs in next.
    analytics.reset();

    signOut();
    void navigate({ to: ROUTES.ENTRY });
  };
}

/** Asking for a reset link. Succeeds whatever the address — see the api. */
export function useForgotPassword() {
  return useMutation<void, ApiError, string>({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      analytics.track(EVENTS.PASSWORD_RESET_REQUESTED, {});
    },
  });
}

/** Spending a reset link. Every session is revoked, so they sign in fresh. */
export function useResetPassword() {
  return useMutation<void, ApiError, { token: string; newPassword: string }>({
    mutationFn: ({ token, newPassword }) => authApi.resetPassword(token, newPassword),
    onSuccess: () => {
      // The gap from `password_reset_requested` is the broken half of the
      // reset flow — usually email deliverability.
      analytics.track(EVENTS.PASSWORD_RESET_COMPLETED, {});
    },
  });
}
