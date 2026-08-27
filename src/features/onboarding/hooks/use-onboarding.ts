import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { useSession } from '@features/auth';
import { ROUTES } from '@shared/constants/routes';
import type { ApiError } from '@shared/services/api-client';

import { onboardingApi } from '../services/onboarding.api';
import type { OnboardingState, SaveOnboardingPayload } from '../types/onboarding.types';

const ONBOARDING_KEY = ['onboarding'] as const;

export function useOnboardingState() {
  return useQuery({
    queryKey: ONBOARDING_KEY,
    queryFn: onboardingApi.get,
    // Answers are resumed from the server, so a reload mid-flow keeps them.
    staleTime: 0,
  });
}

export function useSaveOnboarding() {
  const queryClient = useQueryClient();

  return useMutation<OnboardingState, ApiError, SaveOnboardingPayload>({
    mutationFn: onboardingApi.save,
    onSuccess: (state) => {
      // The server returns the FULL state, so seed the cache with it rather
      // than invalidating — no refetch, and no chance of the two disagreeing.
      queryClient.setQueryData(ONBOARDING_KEY, state);
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const { refreshUser } = useSession();
  const navigate = useNavigate();

  return useMutation<OnboardingState, ApiError>({
    mutationFn: onboardingApi.complete,
    onSuccess: async (state) => {
      queryClient.setQueryData(ONBOARDING_KEY, state);
      // The user object carries has_onboarded, and the route guard reads it.
      // Refreshing BEFORE navigating stops the guard bouncing us straight back.
      await refreshUser();
      void navigate({ to: ROUTES.KITCHEN, replace: true });
    },
    onError: async (error) => {
      // Already completed is not a failure the person should see — it means
      // the outcome they wanted is already true, so carry on.
      if (error.code === 'onboarding_already_completed') {
        await refreshUser();
        void navigate({ to: ROUTES.KITCHEN, replace: true });
      }
    },
  });
}
