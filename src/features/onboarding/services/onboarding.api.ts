import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

import type { OnboardingState, SaveOnboardingPayload } from '../types/onboarding.types';

export const onboardingApi = {
  get: (): Promise<OnboardingState> => apiClient.get<OnboardingState>(EP.ONBOARDING.GET),

  save: (payload: SaveOnboardingPayload): Promise<OnboardingState> =>
    apiClient.patch<OnboardingState>(EP.ONBOARDING.SAVE, payload),

  complete: (): Promise<OnboardingState> =>
    apiClient.post<OnboardingState>(EP.ONBOARDING.COMPLETE),
};
