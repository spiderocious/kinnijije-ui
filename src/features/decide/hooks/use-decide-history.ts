import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@features/auth/hooks/use-session';

import { decideApi } from '../services/decide.api';
import type { DecideHistoryEntry } from '../types/decide.types';

/** Shared so an invalidation after a delete cannot miss the list. */
export const DECIDE_HISTORY_KEY = ['decide', 'history'] as const;

export interface UseDecideHistory {
  entries: DecideHistoryEntry[];
  isLoading: boolean;
  /** True once the request has settled and there is genuinely nothing. */
  isEmpty: boolean;
}

/**
 * A signed-in cook's past decisions.
 *
 * Gated on the session rather than catching a 401: the endpoint is
 * authenticated, so firing it for a guest is a guaranteed failure on the
 * busiest screen in the product, and a failed query would retry and log.
 */
export function useDecideHistory(enabled = true): UseDecideHistory {
  const { isSignedIn, isLoading: sessionLoading } = useSession();

  const query = useQuery({
    queryKey: DECIDE_HISTORY_KEY,
    queryFn: decideApi.history,
    enabled: enabled && !sessionLoading && isSignedIn,
    // History changes only when this person decides something, which this app
    // already knows about — so a short stale time is enough and a refetch on
    // every mount would be a request per screen.
    staleTime: 30_000,
  });

  const entries = query.data ?? [];

  return {
    entries,
    isLoading: sessionLoading || (isSignedIn && query.isPending),
    isEmpty: query.isSuccess && entries.length === 0,
  };
}

/** Removing one. The list is invalidated rather than patched. */
export function useRemoveHistoryEntry() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => decideApi.removeHistoryEntry(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: DECIDE_HISTORY_KEY });
    },
  });
}
