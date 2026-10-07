import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@shared/services/api-client';

import {
  adminAskSessionsApi,
  type AskSessionDetail,
  type AskSessionRow,
} from '../services/ask-sessions.api';

const KEY = ['admin', 'ask-sessions'] as const;

export function useAskSessions(params: { completedOnly?: boolean; limit?: number } = {}) {
  return useQuery<{ sessions: AskSessionRow[]; total: number }, ApiError>({
    queryKey: [...KEY, params],
    queryFn: () => adminAskSessionsApi.list(params),
    // Conversations keep arriving, and a stale list is a list that looks dead.
    staleTime: 30 * 1000,
  });
}

export function useAskSessionDetail(sessionId: string) {
  return useQuery<AskSessionDetail, ApiError>({
    queryKey: [...KEY, sessionId],
    queryFn: () => adminAskSessionsApi.detail(sessionId),
    enabled: sessionId !== '',
  });
}
