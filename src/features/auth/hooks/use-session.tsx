import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/services/api-client';
import { sessionStore } from '@shared/services/session-store';

import { authApi } from '../services/auth.api';
import type { AuthSession, AuthUser } from '../types/auth.types';

interface SessionContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  /** Server-owned. False for a signed-out visitor too, so always check isSignedIn first. */
  hasOnboarded: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const SESSION_QUERY_KEY = ['session', 'me'] as const;

/**
 * The single source of truth for who is signed in.
 *
 * React Context plus React Query — no Redux, no Zustand. The user object is
 * *server* state, so React Query owns it and the context only exposes it; a
 * hand-rolled copy in component state is how a stale user survives a change.
 */
export function SessionProvider({ children }: { readonly children: ReactNode }) {
  const queryClient = useQueryClient();

  const hasStoredSession = sessionStore.get() !== null;

  const { data, isLoading } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: authApi.me,
    // No token means no request: firing one guarantees a 401 and a pointless
    // refresh attempt on every cold load for a signed-out visitor.
    enabled: hasStoredSession,
    retry: (count, error) => {
      // A 401 here means the stored session is genuinely dead — the client
      // already tried to refresh it. Retrying cannot help.
      if (error instanceof ApiError && error.status === 401) return false;
      return count < 1;
    },
    staleTime: 5 * 60 * 1000,
  });

  const signIn = useCallback(
    (session: AuthSession) => {
      sessionStore.set({
        accessToken: session.tokens.access_token,
        refreshToken: session.tokens.refresh_token,
      });
      // Seed the cache from the response we already have, so the very next
      // render knows who the user is without a round-trip.
      queryClient.setQueryData(SESSION_QUERY_KEY, session.user);
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    const stored = sessionStore.get();
    sessionStore.clear();
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
    // Everything cached was scoped to that person; keeping it would leak one
    // user's data into the next session on a shared device.
    queryClient.clear();

    // Best-effort: the local session is already gone, so a failed call here
    // must not block the user from being signed out.
    if (stored !== null) {
      void authApi.logout(stored.refreshToken).catch(() => undefined);
    }
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
  }, [queryClient]);

  const user = data ?? null;

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      isLoading: hasStoredSession && isLoading,
      isSignedIn: user !== null,
      hasOnboarded: user?.has_onboarded ?? false,
      signIn,
      signOut,
      refreshUser,
    }),
    [user, hasStoredSession, isLoading, signIn, signOut, refreshUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (context === null) {
    // Failing loudly beats silently treating everyone as signed out, which is
    // what a null-returning hook would do on a mis-wired tree.
    throw new Error('useSession must be used inside <SessionProvider>');
  }
  return context;
}
