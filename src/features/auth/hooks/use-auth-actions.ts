import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';

import { ROUTES } from '@shared/constants/routes';
import type { ApiError } from '@shared/services/api-client';

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

  return useMutation<AuthSession, ApiError, LoginPayload>({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      signIn(session);
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
