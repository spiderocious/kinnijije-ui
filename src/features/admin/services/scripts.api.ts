import { EP } from '@shared/constants/endpoints';
import { staffClient } from './staff-client';

import type { Job } from '@features/jobs/types/jobs.types';

export interface ScriptRow {
  id: string;
  name: string;
  description: string;
  /** What it changes when it is not a dry run. */
  effect: string;
  destructive: boolean;
  supports_dry_run: boolean;
  /** A one-off: Run is disabled once it has actually been applied. */
  run_once: boolean;
  can_revert: boolean;
  /** A REAL run has succeeded. A preview does not count. */
  has_run: boolean;
  last_run_at: string | null;
  last_outcome: string | null;
  run_disabled: boolean;
  /** Most recent runs, so an operator can see whether this was already done. */
  recent: Job[];
}

export const scriptsApi = {
  list: (): Promise<ScriptRow[]> => staffClient.get<ScriptRow[]>(EP.ADMIN.SCRIPTS),

  run: (scriptId: string, dryRun: boolean): Promise<Job> =>
    staffClient.post<Job>(EP.ADMIN.SCRIPT_RUN(scriptId), { dry_run: dryRun }),

  /** Undo the last real run. Only offered where a script declared one. */
  revert: (scriptId: string): Promise<Job> =>
    staffClient.post<Job>(EP.ADMIN.SCRIPT_REVERT(scriptId)),
};
