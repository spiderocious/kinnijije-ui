import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

import type { Job } from '@features/jobs/types/jobs.types';

export interface ScriptRow {
  id: string;
  name: string;
  description: string;
  /** What it changes when it is not a dry run. */
  effect: string;
  destructive: boolean;
  supports_dry_run: boolean;
  /** Most recent runs, so an operator can see whether this was already done. */
  recent: Job[];
}

export const scriptsApi = {
  list: (): Promise<ScriptRow[]> => apiClient.get<ScriptRow[]>(EP.ADMIN.SCRIPTS),

  run: (scriptId: string, dryRun: boolean): Promise<Job> =>
    apiClient.post<Job>(EP.ADMIN.SCRIPT_RUN(scriptId), { dry_run: dryRun }),
};
