import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Job } from '@features/jobs/types/jobs.types';
import { EVENTS, analytics } from '@shared/services/analytics';
import type { ApiError } from '@shared/services/api-client';

import { scriptsApi, type ScriptRow } from '../services/scripts.api';

const SCRIPTS_KEY = ['admin', 'scripts'] as const;

export function useScripts() {
  return useQuery<ScriptRow[], ApiError>({
    queryKey: SCRIPTS_KEY,
    queryFn: scriptsApi.list,
    /**
     * Polled while anything is in flight.
     *
     * The list carries each script's recent runs, so refetching it is how the
     * screen watches a run progress — no separate subscription, and the row
     * updates in place.
     */
    refetchInterval: (query) => {
      const running = query.state.data?.some((script) =>
        script.recent.some((job) => !job.is_terminal),
      );
      return running === true ? 2000 : false;
    },
  });
}

export function useRunScript() {
  const queryClient = useQueryClient();

  return useMutation<Job, ApiError, { scriptId: string; dryRun: boolean }>({
    mutationFn: ({ scriptId, dryRun }) => scriptsApi.run(scriptId, dryRun),
    onSuccess: async (_job, variables) => {
      analytics.track(EVENTS.ADMIN_SCRIPT_RUN, {
        script_id: variables.scriptId,
        dry_run: variables.dryRun,
      });
      // Brings the new run into the list, which then polls it to completion.
      await queryClient.invalidateQueries({ queryKey: SCRIPTS_KEY });
    },
  });
}

export function useRevertScript() {
  const queryClient = useQueryClient();

  return useMutation<Job, ApiError, string>({
    mutationFn: (scriptId) => scriptsApi.revert(scriptId),
    onSuccess: async (_job, scriptId) => {
      analytics.track(EVENTS.ADMIN_SCRIPT_REVERTED, { script_id: scriptId });
      await queryClient.invalidateQueries({ queryKey: SCRIPTS_KEY });
    },
  });
}
