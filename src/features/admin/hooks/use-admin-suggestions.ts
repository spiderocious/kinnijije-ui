import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@shared/services/api-client';

import { adminSuggestionsApi, type SuggestionRow } from '../services/suggestions.api';

const KEY = ['admin', 'suggestions'] as const;

/**
 * The review queue.
 *
 * `staleTime: 0` deliberately: this is a worklist two people may be working
 * through at once, and a cached queue would show a suggestion somebody else
 * already promoted.
 */
export function useSuggestions(params: { status?: SuggestionRow['status']; limit?: number } = {}) {
  return useQuery<{ suggestions: SuggestionRow[]; total: number }, ApiError>({
    queryKey: [...KEY, params],
    queryFn: () => adminSuggestionsApi.list(params),
    staleTime: 0,
  });
}

export function usePromoteSuggestion() {
  const queryClient = useQueryClient();

  return useMutation<{ mealId: string; alreadyPromoted: boolean }, ApiError, string>({
    mutationFn: adminSuggestionsApi.promote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEY });
      // The recipe list gained a draft, so it is stale too.
      await queryClient.invalidateQueries({ queryKey: ['admin', 'recipes'] });
    },
  });
}

export function useRejectSuggestion() {
  const queryClient = useQueryClient();

  return useMutation<null, ApiError, string>({
    mutationFn: adminSuggestionsApi.reject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}
