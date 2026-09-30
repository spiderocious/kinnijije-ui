import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { useSession } from '@features/auth';
import { EVENTS, analytics } from '@shared/services/analytics';
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
    onSuccess: (state, variables) => {
      // The patch says which step was just answered; the full state that comes
      // back says what it now holds. One event, `step` as a property.
      const step = Object.keys(variables)[0] ?? 'unknown';
      analytics.track(EVENTS.ONBOARDING_STEP_COMPLETED, {
        step,
        cuisine_count: state.cuisines.length,
        kitchen_item_count: state.kitchen_items.length,
      });

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
      /**
       * The activation event.
       *
       * `kitchen_item_count` here is the best early predictor of whether they
       * will ever cook: an empty kitchen means they never really moved in.
       */
      analytics.track(EVENTS.ONBOARDING_COMPLETED, {
        cuisine_count: state.cuisines.length,
        difficulty: state.difficulty,
        measurement: state.measurement,
        kitchen_item_count: state.kitchen_items.length,
      });
      analytics.setProfile({
        has_onboarded: true,
        difficulty_pref: state.difficulty,
        measurement: state.measurement,
        cuisines: state.cuisines,
        stock_item_count: state.kitchen_items.length,
      });

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
