import { useQuery } from '@tanstack/react-query';

import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

export interface FeatureFlags {
  onboarding_tour: boolean;
  upload_receipt: boolean;
  upload_photo: boolean;
}

/** Everything on — what we assume until the server says otherwise. */
const ALL_ON: FeatureFlags = {
  onboarding_tour: true,
  upload_receipt: true,
  upload_photo: true,
};

/**
 * What the app is allowed to show.
 *
 * FAILS OPEN, deliberately. While this is loading, or if the request fails,
 * every flag reads as on — a flaky network must not silently strip features
 * out of the product, and a half-loaded screen that hides the photo button and
 * then shows it a second later is worse than one that never hid it.
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
