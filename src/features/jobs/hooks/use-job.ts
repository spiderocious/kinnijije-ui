import { useEffect, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ENV } from '@shared/config/env';
import { EP } from '@shared/constants/endpoints';
import {
  JOB_LIST_POLL_MS,
  JOB_POLL_TIMEOUT_MS,
  jobPollInterval,
} from '@shared/constants/polling';
import type { ApiError } from '@shared/services/api-client';
import { sessionStore } from '@shared/services/session-store';

import { jobsApi } from '../services/jobs.api';
import type { Job } from '../types/jobs.types';

/**
 * Watches one job to completion.
 *
 * Polling rather than SSE by default, deliberately: EventSource cannot send an
 * Authorization header, so a token would have to go in the query string —
 * where it lands in server logs and browser history. Polling every second is
 * cheap for work that takes a few seconds, and it works everywhere.
 *
 * `useJobStream` below is the SSE path for when a token in the URL is
 * acceptable; the shapes are identical so swapping is a one-line change.
 */
export function useJob(jobId: string | null, options: { enabled?: boolean } = {}) {
  const enabled = (options.enabled ?? true) && jobId !== null;

  // When this job started being watched, so the backoff knows how long we have
  // been waiting. Keyed by job id: a new job restarts the schedule at its
  // fastest, rather than inheriting the slow tail of the previous one.
  const startedAt = useRef<{ jobId: string | null; at: number }>({ jobId: null, at: Date.now() });
  if (startedAt.current.jobId !== jobId) {
    startedAt.current = { jobId, at: Date.now() };
  }

  return useQuery<Job, ApiError>({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId ?? ''),
    enabled,
    refetchInterval: (query) => {
      const job = query.state.data;
      // Stop the moment it is finished — a terminal job never changes again.
      if (job === undefined || job.is_terminal) return false;

      const elapsed = Date.now() - startedAt.current.at;
      // Give up rather than poll a stuck job forever.
      if (elapsed > JOB_POLL_TIMEOUT_MS) return false;

      return jobPollInterval(elapsed);
    },
    // Progress is the point; a cached value is useless here.
    staleTime: 0,
  });
}

/**
 * The SSE variant.
 *
 * Smoother than polling for long work, at the cost of putting the token in the
 * URL. Falls back to the caller's polling automatically if the connection
 * cannot be opened.
 */
export function useJobStream(jobId: string | null): { job: Job | null; streaming: boolean } {
  const [job, setJob] = useState<Job | null>(null);
  const [streaming, setStreaming] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (jobId === null) return;

    const token = sessionStore.getAccessToken();
    if (token === null) return;

    const source = new EventSource(
      `${ENV.API_BASE_URL}${EP.JOBS.STREAM(jobId)}?token=${encodeURIComponent(token)}`,
    );
    sourceRef.current = source;
    setStreaming(true);

    source.addEventListener('state', (event) => {
      setJob(JSON.parse((event as MessageEvent<string>).data) as Job);
    });

    source.addEventListener('progress', (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        progress: number;
        label: string | null;
      };
      setJob((current) =>
        current === null ? current : { ...current, progress: payload.progress, progress_label: payload.label },
      );
    });

    source.addEventListener('done', (event) => {
      setJob(JSON.parse((event as MessageEvent<string>).data) as Job);
      source.close();
      setStreaming(false);
    });

    source.onerror = () => {
      // A dropped stream is not an error the user needs to see — the caller
      // polls instead, and every event here is readable from GET /jobs/:id.
      source.close();
      setStreaming(false);
    };

    return () => {
      source.close();
      setStreaming(false);
    };
  }, [jobId]);

  return { job, streaming };
}

export function useJobList() {
  return useQuery({ queryKey: ['jobs'], queryFn: jobsApi.list, refetchInterval: JOB_LIST_POLL_MS });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation<Job, ApiError, string>({
    mutationFn: jobsApi.cancel,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();
  return useMutation<Job, ApiError, string>({
    mutationFn: jobsApi.retry,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
