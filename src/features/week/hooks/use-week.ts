import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { WEEK_READING_SETTLE_MS } from '@shared/constants/polling';
import { EVENTS, analytics } from '@shared/services/analytics';
import type { ApiError } from '@shared/services/api-client';

import { weekApi, type WeekSummary } from '../services/week.api';

export function useWeek() {
  return useQuery<WeekSummary, ApiError>({ queryKey: ['week'], queryFn: weekApi.summary });
}

/**
 * Asks for a fresh AI reading.
 *
 * The numbers are already on screen — this only fills in the interpretation
 * underneath, so it never blocks anything.
 */
export function useRefreshReading() {
  const queryClient = useQueryClient();

  return useMutation<{ queued: boolean; job?: { id: string } }, ApiError, void>({
    mutationFn: weekApi.refreshReading,
    onSuccess: (result) => {
      // A deliberate ask for an AI reading: genuine demand for the insight,
      // and it costs a model call.
      analytics.track(EVENTS.WEEK_READING_REFRESHED, {
        queued: result.queued,
        job_id: result.job?.id ?? null,
      });

      // The job writes the reading; give it a moment, then re-read.
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['week'] });
      }, WEEK_READING_SETTLE_MS);
    },
  });
}
