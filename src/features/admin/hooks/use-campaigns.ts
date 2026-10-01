import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EVENTS, analytics } from '@shared/services/analytics';
import type { ApiError } from '@shared/services/api-client';

import {
  campaignsApi,
  type BatchDetail,
  type BatchRow,
  type KindOverview,
  type UserHit,
} from '../services/campaigns.api';

const KEY = ['admin', 'campaigns'] as const;

export function useCampaignOverview() {
  return useQuery<{ kinds: KindOverview[] }, ApiError>({
    queryKey: [...KEY, 'overview'],
    queryFn: campaignsApi.overview,
    staleTime: 30_000,
  });
}

export function useBatches(params: { kind?: string; status?: string }) {
  return useQuery<BatchRow[], ApiError>({
    queryKey: [...KEY, 'batches', params],
    queryFn: () => campaignsApi.batches(params),
  });
}

export function useBatch(batchId: string | null) {
  return useQuery<BatchDetail, ApiError>({
    queryKey: [...KEY, 'batch', batchId],
    queryFn: () => campaignsApi.batch(batchId ?? ''),
    enabled: batchId !== null,
  });
}

/**
 * The composer's user search.
 *
 * Only asks once there are two characters — a one-letter query matches most of
 * the table and is never what somebody meant.
 */
export function useUserSearch(term: string) {
  return useQuery<UserHit[], ApiError>({
    queryKey: [...KEY, 'users', term],
    queryFn: () => campaignsApi.searchUsers(term),
    enabled: term.trim().length >= 2,
    staleTime: 10_000,
  });
}

export function useCompose() {
  const queryClient = useQueryClient();

  return useMutation<{ batchId: string; drafted: number }, ApiError, { kind: string; userIds: string[] }>({
    mutationFn: ({ kind, userIds }) => campaignsApi.compose(kind, userIds),
    onSuccess: async (_result, variables) => {
      analytics.track(EVENTS.ADMIN_EMAIL_COMPOSED, {
        kind: variables.kind,
        recipient_count: variables.userIds.length,
      });
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDraftNow() {
  const queryClient = useQueryClient();

  return useMutation<{ batchId: string; drafted: number }, ApiError, string>({
    mutationFn: (kind) => campaignsApi.draftNow(kind),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useUpdateEmailSettings() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { kind: string; patch: Record<string, unknown> }>({
    mutationFn: ({ kind, patch }) => campaignsApi.updateSettings(kind, patch),
    onSuccess: async (_result, variables) => {
      analytics.track(EVENTS.ADMIN_EMAIL_SETTINGS_CHANGED, { kind: variables.kind });
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useEditDraft() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { draftId: string; subject?: string; text?: string }>({
    mutationFn: ({ draftId, subject, text }) =>
      campaignsApi.editDraft(draftId, {
        ...(subject !== undefined && { subject }),
        ...(text !== undefined && { text }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useExcludeDraft() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { draftId: string; reason?: string }>({
    mutationFn: ({ draftId, reason }) => campaignsApi.excludeDraft(draftId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useApproveBatch() {
  const queryClient = useQueryClient();

  return useMutation<{ queued: number }, ApiError, string>({
    mutationFn: (batchId) => campaignsApi.approve(batchId),
    onSuccess: async (result, batchId) => {
      // The one action that actually reaches customers' inboxes.
      analytics.track(EVENTS.ADMIN_EMAIL_BATCH_APPROVED, {
        batch_id: batchId,
        queued: result.queued,
      });
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDiscardBatch() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (batchId) => campaignsApi.discard(batchId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}
