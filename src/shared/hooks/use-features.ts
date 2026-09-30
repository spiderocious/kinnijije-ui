import { useQuery } from '@tanstack/react-query';

import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

export interface FeatureFlags {
  onboarding_tour: boolean;
  upload_receipt: boolean;
  upload_photo: boolean;
  analytics_client: boolean;
  analytics_server: boolean;
  /** The signup invite inside the decide flow. An experiment; defaults off. */
  decide_invite: boolean;
}

/**
 * What we assume until the server answers.
 *
 * Most flags fail OPEN: a flaky network must not silently strip features out
 * of the product. Three fail closed, for the same underlying reason — they all
 * DO something to a person rather than merely offering it, so guessing wrong
 * is worse than waiting.
 *
 *   analytics_*     "assume on" after a failed read resumes tracking somebody
 *                   an operator switched off. If that switch was thrown for a
 *                   privacy reason, this is the one behaviour that must not
 *                   happen.
 *   onboarding_tour it takes over the screen and navigates. Showing it to
 *                   somebody because a flag read was slow is worse than not
 *                   showing it at all — it is only ever seen once, so a
 *                   wrongly-shown tour is also a permanently-spent one.
 */
const ALL_ON: FeatureFlags = {
  onboarding_tour: false,
  upload_receipt: true,
  upload_photo: true,
  analytics_client: false,
  analytics_server: false,
  // Off for the same reason: an unproven experiment that can cost completions
  // must not switch itself on because a read failed.
  decide_invite: false,
};

/**
 * What the app is allowed to show.
 *
 * FAILS OPEN for product features, CLOSED for analytics — see `ALL_ON`. While
 * this is loading, or if the request fails, a product flag reads as on: a
 * half-loaded screen that hides the photo button and then shows it a second
 * later is worse than one that never hid it.
 *
 * Cached for a minute: flags change rarely, and asking on every render would
 * be a request per screen.
 */
export function useFeatures(): FeatureFlags {
  const { data } = useQuery({
    queryKey: ['config', 'features'],
    queryFn: () => apiClient.get<FeatureFlags>(EP.CONFIG.FEATURES),
    staleTime: 60_000,
    retry: 1,
  });

  return data ?? ALL_ON;
}
