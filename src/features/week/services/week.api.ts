import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

export interface WeekSummary {
  days: { date: string; label: string; meals: string[] }[];
  total_meals: number;
  distinct_meals: number;
  repeats: { name: string; times: number }[];
  estimated_spend: number;
  used_most: { name: string; times: number }[];
  too_early: boolean;
  reading: {
    headline?: string;
    observations?: { kind: string; statement: string; evidence: string[]; tone: string }[];
    suggestion?: string | null;
  } | null;
  reading_computed_at: string | null;
}

export const weekApi = {
  summary: (): Promise<WeekSummary> => apiClient.get<WeekSummary>(EP.WEEK.SUMMARY),
  refreshReading: (): Promise<{ queued: boolean; job?: { id: string } }> =>
    apiClient.post<{ queued: boolean; job?: { id: string } }>(EP.WEEK.REFRESH_READING),
};
