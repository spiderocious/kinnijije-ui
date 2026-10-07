import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@shared/services/api-client';

import {
  timetableApi,
  type GenerateAccepted,
  type GeneratePayload,
  type KitchenLine,
  type MealSlotId,
  type SwapOptions,
  type TimetableSummary,
  type WeekPlan,
} from '../services/timetable.api';

const TIMETABLE_KEY = ['timetable'] as const;

/**
 * The plan and its runway.
 *
 * `staleTime: 0` deliberately: the runway depends on the kitchen, and a cached
 * "you have enough rice" is the one answer here that must not go stale
 * silently.
 *
 * `enabled` lets the flow hold off until somebody has actually generated
 * something — fetching a summary for an empty plan on mount would show an
 * empty hub before the configure screen.
 */
export function useTimetable(
  weekOf?: string,
  options: { enabled?: boolean; planId?: string } = {},
) {
  return useQuery<TimetableSummary, ApiError>({
    /*
     * The plan id is part of the key when there is one, so a freshly
     * generated run does not read the previous run's cached entry.
     */
    queryKey: [...TIMETABLE_KEY, options.planId ?? weekOf ?? 'current'],
    queryFn: () => timetableApi.summary(weekOf, options.planId),
    staleTime: 0,
    enabled: options.enabled ?? true,
    /**
     * POLLS ITSELF WHILE A PLAN IS BEING BUILT.
     *
     * Generation is asynchronous — it takes six to fourteen seconds with the
     * model — so this is how the screen follows it. Polling the PLAN rather
     * than a job id keeps the internal queue id off the wire and works
     * identically for guests, who have no session to authenticate a job
     * request with.
     *
     * 1.5s: fast enough that the plan appears to land the moment it is ready,
     * slow enough that a ten-second build is seven requests rather than fifty.
     * Returns false on every other status, so a settled plan stops polling.
     */
    refetchInterval: (query) =>
      query.state.data?.plan.generation.status === 'pending' ? 1500 : false,
    // Keep polling when the tab is in the background: somebody who switches
    // away mid-build should come back to a finished plan, not a stalled one.
    refetchIntervalInBackground: true,
  });
}

/** Their stock, for the confirm screen's starting point. */
export function useTimetableKitchen() {
  return useQuery<{ kitchen: KitchenLine[] }, ApiError>({
    queryKey: [...TIMETABLE_KEY, 'kitchen'],
    queryFn: timetableApi.kitchen,
    // Stock changes when they shop or cook, so this is read fresh each visit.
    staleTime: 0,
  });
}

/**
 * The Generate button. Resolves when the work is ACCEPTED, not when it is done.
 *
 * It used to resolve with the finished summary and seed the cache from it —
 * which crashed with "Cannot read properties of undefined (reading 'weekOf')"
 * the moment generation became asynchronous, because the response is now
 * `{ week_of }` and has no plan on it.
 *
 * The caller navigates to the plan screen, which polls `useTimetable` while
 * `generation.status` is `pending`.
 */
export function useGeneratePlan() {
  const queryClient = useQueryClient();

  return useMutation<GenerateAccepted, ApiError, GeneratePayload>({
    mutationFn: timetableApi.generate,
    onSuccess: async () => {
      // Invalidate only. There is nothing to seed yet: the plan exists but is
      // still pending, and the next fetch is what picks it up.
      await queryClient.invalidateQueries({ queryKey: TIMETABLE_KEY });
    },
  });
}

/**
 * Refill one day of the plan.
 *
 * Seeds the cache from the response like `useGeneratePlan` does, so the day
 * screen shows the new dishes immediately rather than flashing the old ones
 * while a refetch lands.
 */
export function useRegenerateDay() {
  const queryClient = useQueryClient();

  return useMutation<TimetableSummary, ApiError, { week_of?: string; date: string }>({
    mutationFn: timetableApi.regenerateDay,
    onSuccess: async (summary) => {
      queryClient.setQueryData([...TIMETABLE_KEY, summary.plan.weekOf], summary);
      queryClient.setQueryData([...TIMETABLE_KEY, 'current'], summary);
      await queryClient.invalidateQueries({ queryKey: TIMETABLE_KEY });
    },
  });
}

export function useSavePlan() {
  const queryClient = useQueryClient();

  return useMutation<
    WeekPlan,
    ApiError,
    {
      week_of?: string;
      household?: number;
      days: { date: string; meals: { meal_id: string; meal_name: string; slot?: string }[] }[];
    }
  >({
    mutationFn: timetableApi.save,
    onSuccess: async () => {
      // The whole summary, not just the plan: changing what is cooked changes
      // the runway, and showing the old one beside a new plan reads as a bug.
      await queryClient.invalidateQueries({ queryKey: TIMETABLE_KEY });
    },
  });
}

/**
 * The morning reminder switch.
 *
 * Optimistic, because it is a toggle: waiting for a round trip to move a
 * switch makes the control feel broken. Rolled back on failure.
 */
export function useSetReminder() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { on: boolean; weekOf?: string }>({
    mutationFn: ({ on, weekOf }) => timetableApi.setReminder(on, weekOf),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: TIMETABLE_KEY });
    },
  });
}

/**
 * Swap candidates for one slot.
 *
 * A mutation rather than a query: it is an explicit action somebody takes from
 * the slot menu, and it ranks against a walked-forward kitchen, so caching it
 * by slot would hide the effect of having just edited an earlier day.
 */
export function useSwapOptions() {
  return useMutation<
    SwapOptions,
    ApiError,
    { date: string; slot: MealSlotId; mealId?: string | null; weekOf?: string }
  >({
    mutationFn: timetableApi.swapOptions,
  });
}

/** Hands a guest's plans over after sign-in. */
export function useClaimGuestPlans() {
  const queryClient = useQueryClient();

  return useMutation<{ claimed: number }, ApiError, void>({
    mutationFn: timetableApi.claim,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TIMETABLE_KEY });
    },
  });
}
