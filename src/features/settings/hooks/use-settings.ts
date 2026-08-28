import { useMutation, useQueryClient } from '@tanstack/react-query';

import { SESSION_QUERY_KEY } from '@features/auth/hooks/use-session';
import { EP } from '@shared/constants/endpoints';
import { apiClient, type ApiError } from '@shared/services/api-client';
import { sessionStore } from '@shared/services/session-store';

export interface SettingsPatch {
  name?: string;
  cuisines?: string[];
  difficulty?: 'easy' | 'medium' | 'anything';
  measurement?: 'metric' | 'imperial';
  city?: string;
  country?: string;
  running_low?: boolean;
  use_it_up?: boolean;
  have_you_eaten?: boolean;
  daily_digest?: boolean;
  weekly_summary?: boolean;
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, SettingsPatch>({
    mutationFn: (patch) => apiClient.patch(EP.USERS.SETTINGS, patch),
    onSuccess: async () => {
      // The session carries prefs, so it must be re-read or the app keeps
      // filtering on the old ones.
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}

export function useDeleteAccount() {
  return useMutation<void, ApiError, void>({
    mutationFn: () => apiClient.delete<void>(EP.USERS.DELETE_ME),
    onSuccess: () => {
      // The account is gone; anything still held locally is a dead token.
      sessionStore.clear();
      window.location.href = '/';
    },
  });
}
