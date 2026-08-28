import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DASHBOARD_KEY, STOCK_KEY } from '@features/stock/hooks/use-stock';
import type { ApiError } from '@shared/services/api-client';

import { mealsApi, type Meal, type MealDetail, type MealSuggestion } from '../services/meals.api';

export function useSuggestions() {
  return useQuery<MealSuggestion[], ApiError>({
    queryKey: ['meals', 'suggest'],
    queryFn: mealsApi.suggest,
    // Matched against live stock, so a cached list can be wrong the moment
    // anything is cooked or bought.
    staleTime: 30 * 1000,
  });
}

export function useMealDetail(mealId: string | null) {
  return useQuery<MealDetail, ApiError>({
    queryKey: ['meals', mealId],
    queryFn: () => mealsApi.detail(mealId ?? ''),
    enabled: mealId !== null,
  });
}

/**
 * Materialises a meal the assistant only named.
 *
 * Fire-and-navigate: the caller swaps the url for the returned id, and the
 * ordinary detail query takes over from there.
 */
export function useGenerateMeal() {
  const queryClient = useQueryClient();
  return useMutation<{ meal_id: string }, ApiError, string>({
    mutationFn: mealsApi.generate,
    onSuccess: async () => {
      // A new meal changes what can be suggested and what the assistant knows.
      await queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useFavourites() {
  return useQuery<Meal[], ApiError>({ queryKey: ['meals', 'favourites'], queryFn: mealsApi.favourites });
}

export function useToggleFavourite() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { mealId: string; favourite: boolean }>({
    mutationFn: ({ mealId, favourite }) =>
      favourite ? mealsApi.favourite(mealId) : mealsApi.unfavourite(mealId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

/**
 * Marking a meal cooked takes its ingredients out of the kitchen, so stock and
 * the dashboard both have to be refreshed — otherwise the app claims you still
 * have what you just used.
 */
export function useMarkCooked() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: mealsApi.markCooked,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['meals'] }),
        queryClient.invalidateQueries({ queryKey: STOCK_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
        queryClient.invalidateQueries({ queryKey: ['week'] }),
      ]);
    },
  });
}
