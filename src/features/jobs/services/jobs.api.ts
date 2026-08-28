import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

import type { Job } from '../types/jobs.types';

export const jobsApi = {
  list: (): Promise<Job[]> => apiClient.get<Job[]>(EP.JOBS.LIST),
  get: (jobId: string): Promise<Job> => apiClient.get<Job>(EP.JOBS.DETAIL(jobId)),
  cancel: (jobId: string): Promise<Job> => apiClient.post<Job>(EP.JOBS.CANCEL(jobId)),
  retry: (jobId: string): Promise<Job> => apiClient.post<Job>(EP.JOBS.RETRY(jobId)),
};
