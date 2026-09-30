import { useQuery } from '@tanstack/react-query';

import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

export interface FeatureFlags {
  onboarding_tour: boolean;
  upload_receipt: boolean;
  upload_photo: boolean;
  analytics_client: boolean;
  analytics_server: boolean;
}

/**
 * Everything on — what we assume until the server says otherwise.
 *
 * EXCEPT the analytics pair, which is off here. Every other flag fails open: a
 * flaky network must not silently strip features out of the product. Analytics
 * is the opposite case — "assume on" after a failed read would resume tracking
 * somebody an operator switched off, and if that switch was thrown for a
 * privacy reason, that is the one behaviour that must not happen.
 */
const ALL_ON: FeatureFlags = {
  onboarding_tour: true,
  upload_receipt: true,
  upload_photo: true,
  analytics_client: false,
  analytics_server: false,
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
