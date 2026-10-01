import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { EP } from '@shared/constants/endpoints';
import { ROUTES } from '@shared/constants/routes';
import type { Scope } from '@shared/constants/permissions';
import { satisfies } from '@shared/constants/permissions';
import type { ApiError } from '@shared/services/api-client';

import { staffClient } from '../services/staff-client';
import { staffSessionStore } from '../services/staff-session';

export interface StaffMe {
  id: string;
  email: string;
  name: string;
  tier: 'moderator' | 'admin' | 'super_admin';
  status: string;
  /** Effective scopes, implications already resolved by the server. */
  permissions: string[];
  group_keys: string[];
}

const ME_KEY = ['admin', 'me'] as const;

/**
 * Who is signed into the console.
 *
 * Entirely separate from `useSession`, which is the customer's. One browser
 * can hold both at once — the same person signed in as a cook and as an
 * operator — because the two credentials live under different keys and go to
 * different token audiences.
 */
export function useStaffSession(): {
  staff: StaffMe | null;
  isLoading: boolean;
  isSignedIn: boolean;
  can: (scope: Scope) => boolean;
} {
  const hasToken = staffSessionStore.getAccessToken() !== null;

  const { data, isLoading } = useQuery<StaffMe, ApiError>({
    queryKey: ME_KEY,
    queryFn: () => staffClient.get<StaffMe>(EP.ADMIN.ME),
    // No token means no request: asking would be a guaranteed 401 on every
    // console page load for a signed-out visitor.
    enabled: hasToken,
    retry: false,
    staleTime: 60_000,
  });

  const staff = data ?? null;

  return {
    staff,
    isLoading: hasToken && isLoading,
    isSignedIn: staff !== null,
    can: (scope: Scope) => satisfies(staff?.permissions ?? [], scope),
  };
}

export function useStaffLogin() {
  const queryClient = useQueryClient();

  return useMutation<
    { staff: StaffMe; tokens: { access_token: string; refresh_token: string } },
    ApiError,
    { email: string; password: string }
  >({
    mutationFn: (payload) =>
      staffClient.post<{
        staff: StaffMe;
        tokens: { access_token: string; refresh_token: string };
      }>(EP.ADMIN.LOGIN, payload),
    onSuccess: async (result) => {
      staffSessionStore.set({
        accessToken: result.tokens.access_token,
        refreshToken: result.tokens.refresh_token,
      });
      // Seeded rather than refetched: the login response already carries the
      // whole profile, so a second round trip would be waste.
      queryClient.setQueryData(ME_KEY, result.staff);
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

/**
 * Signing out of the console, and landing on its sign-in page.
 *
 * The navigation is explicit, not left to `AdminGuard`. `removeQueries` drops
 * the cached profile but does NOT tell the screens already showing it — they
 * keep their last answer ("signed in") until something else re-renders them,
 * so the guard never saw the change and the console stayed on screen with
 * every credential already gone.
 *
 * Order matters: tokens first (nothing can be re-fetched with them), then
 * away from the console, then the cache — clearing it while a console screen
 * is still mounted would only invite that screen to ask again.
 */
export function useStaffLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      const stored = staffSessionStore.get();
      if (stored !== null) {
        // Best effort: the local tokens are cleared either way, so a failed
        // call must not leave somebody stuck signed in.
        await staffClient
          .post<void>(EP.ADMIN.LOGOUT, { refresh_token: stored.refreshToken })
          .catch(() => undefined);
      }
    },
    // Settled, not success: signing out must finish even if something above threw.
    onSettled: async () => {
      staffSessionStore.clear();
      await navigate({ to: ROUTES.ADMIN_LOGIN, replace: true });
      queryClient.removeQueries({ queryKey: ['admin'] });
    },
  });
}
