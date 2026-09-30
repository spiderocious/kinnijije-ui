import { useMutation, useQueryClient } from '@tanstack/react-query';

import { SESSION_QUERY_KEY } from '@features/auth/hooks/use-session';
import { EP } from '@shared/constants/endpoints';
import { EVENTS, analytics } from '@shared/services/analytics';
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

/**
 * The patch keys that are notification switches.
 *
 * Mirrors the `notifications` block on the user object. A key added there
 * without being added here is simply not reported — which is why the loop above
 * is generic rather than five separate call sites.
 */
const NOTIFICATION_KEYS: readonly string[] = [
  'daily_digest',
  'weekly_summary',
  'running_low',
  'use_it_up',
  'have_you_eaten',
];

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, SettingsPatch>({
    mutationFn: (patch) => apiClient.patch(EP.USERS.SETTINGS, patch),
    onSuccess: (_result, patch) => {
      // Which defaults are wrong. A setting most people change should not have
      // been a setting.
      analytics.track(EVENTS.SETTINGS_UPDATED, { fields_changed: Object.keys(patch) });

      /**
       * A notification toggle is its own event, not just a settings change.
       *
       * Opt-outs are a QUALITY signal per email kind: if `daily_digest`
       * opt-outs spike, that email is annoying and is costing users, not just
       * sends. Detected here rather than at each of the five switches, so a new
       * notification cannot be added without being tracked.
       */
      for (const [key, value] of Object.entries(patch)) {
        if (!NOTIFICATION_KEYS.includes(key) || typeof value !== 'boolean') continue;
        analytics.track(EVENTS.NOTIFICATION_PREFERENCE_CHANGED, {
          channel: 'email',
          kind: key,
          enabled: value,
        });
      }

      // The session carries prefs, so it must be re-read or the app keeps
      // filtering on the old ones.
      void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}

export function useDeleteAccount() {
  return useMutation<void, ApiError, void>({
    mutationFn: () => apiClient.delete<void>(EP.USERS.DELETE_ME),
    onSuccess: () => {
      // The clearest churn signal there is. The server sends the lifetime
      // counts (it still has the row); this is the client's half.
      analytics.track(EVENTS.ACCOUNT_DELETED, {});
      // AFTER the event, so it is not sent under a forgotten identity.
      analytics.reset();

      // The account is gone; anything still held locally is a dead token.
      sessionStore.clear();
      window.location.href = '/';
    },
  });
}
