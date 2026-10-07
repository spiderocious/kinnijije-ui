import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@shared/services/api-client';

import {
  adminTimetablesApi,
  type PlannerStrategy,
  type StrategyComparison,
  type TimetableDetail,
  type TimetableQuality,
  type TimetableRow,
  type TimetableUsage,
} from '../services/timetables.api';

const KEY = ['admin', 'timetables'] as const;

/**
 * Usage and quality move slowly — they are windows over weeks of plans — so
 * both are cached for a few minutes. The quality call recomputes a runway per
 * sampled plan, which is the expensive one and the reason this is not live.
 */
export function useTimetableUsage(days?: number) {
  return useQuery<TimetableUsage, ApiError>({
    queryKey: [...KEY, 'usage', days ?? 'default'],
    queryFn: () => adminTimetablesApi.usage(days),
    staleTime: 3 * 60 * 1000,
  });
}

export function useTimetableQuality(days?: number) {
  return useQuery<TimetableQuality, ApiError>({
    queryKey: [...KEY, 'quality', days ?? 'default'],
    queryFn: () => adminTimetablesApi.quality(days),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTimetableList(params: { guestsOnly?: boolean; limit?: number } = {}) {
  return useQuery<{ plans: TimetableRow[]; total: number }, ApiError>({
    queryKey: [...KEY, 'list', params],
    queryFn: () => adminTimetablesApi.list(params),
  });
}

export function useTimetableDetail(planId: string) {
  return useQuery<TimetableDetail, ApiError>({
    queryKey: [...KEY, planId],
    queryFn: () => adminTimetablesApi.detail(planId),
    enabled: planId !== '',
  });
}

/** Which planner builds a week. Read fresh: it is a switch somebody flips. */
export function usePlannerStrategy() {
  return useQuery<{ strategy: PlannerStrategy; options: PlannerStrategy[] }, ApiError>({
    queryKey: [...KEY, 'strategy'],
    queryFn: adminTimetablesApi.strategy,
    staleTime: 0,
  });
}

export function useSetPlannerStrategy() {
  const queryClient = useQueryClient();

  return useMutation<{ strategy: PlannerStrategy }, ApiError, PlannerStrategy>({
    mutationFn: adminTimetablesApi.setStrategy,
    onSuccess: async () => {
      // The comparison is keyed on what ran, so it goes stale the moment the
      // switch moves — invalidating the whole branch keeps them honest.
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}

/** How the strategies compare. Cached like the other windows over weeks. */
export function useStrategyComparison(days?: number) {
  return useQuery<StrategyComparison, ApiError>({
    queryKey: [...KEY, 'compare', days ?? 'default'],
    queryFn: () => adminTimetablesApi.compare(days),
    staleTime: 3 * 60 * 1000,
  });
}
