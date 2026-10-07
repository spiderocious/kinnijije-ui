import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@shared/services/api-client';

import {
  notificationsApi,
  workflowsApi,
  type NotificationPage,
  type WorkflowDetail,
  type WorkflowFilters,
  type WorkflowQueue,
  type WorkflowRow,
} from '../services/workflows.api';

/**
 * `['admin','workflows']` is a PREFIX of the detail key, so one invalidation
 * of this refreshes both the queue and any open detail page. The staff hooks
 * rely on the same property; keeping the convention means a decision made on
 * the detail screen updates the queue behind it without a second call.
 */
const WORKFLOWS_KEY = ['admin', 'workflows'] as const;
const NOTIFICATIONS_KEY = ['admin', 'notifications'] as const;

export function useWorkflows(filters: WorkflowFilters = {}) {
  return useQuery<WorkflowQueue, ApiError>({
    queryKey: [...WORKFLOWS_KEY, filters],
    queryFn: () => workflowsApi.list(filters),
  });
}

export function useWorkflow(workflowId: string) {
  return useQuery<WorkflowDetail, ApiError>({
    queryKey: [...WORKFLOWS_KEY, workflowId],
    queryFn: () => workflowsApi.detail(workflowId),
    enabled: workflowId !== '',
  });
}

/**
 * Deciding a request changes three things: the request, the queue it sits in,
 * and the bell (a decision clears the outstanding approval notifications).
 * All three are invalidated together, because a stale badge after an approval
 * is the thing that teaches people to stop trusting the count.
 */
function useDecision(
  action: (workflowId: string, note?: string) => Promise<WorkflowRow>,
) {
  const queryClient = useQueryClient();

  return useMutation<WorkflowRow, ApiError, { workflowId: string; note?: string }>({
    mutationFn: ({ workflowId, note }) => action(workflowId, note),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: WORKFLOWS_KEY }),
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
      ]);
    },
  });
}

export function useApproveWorkflow() {
  return useDecision((workflowId, note) => workflowsApi.approve(workflowId, note));
}

export function useRejectWorkflow() {
  return useDecision((workflowId, note) => workflowsApi.reject(workflowId, note));
}

export function useWithdrawWorkflow() {
  return useDecision((workflowId) => workflowsApi.withdraw(workflowId));
}

export function useNotifications(options: { unreadOnly?: boolean; limit?: number } = {}) {
  return useQuery<NotificationPage, ApiError>({
    queryKey: [...NOTIFICATIONS_KEY, options],
    queryFn: () => notificationsApi.list(options),
  });
}

/**
 * The badge in the shell.
 *
 * Polled rather than pushed: a count that is a minute stale is harmless, and
 * a websocket for one integer is a lot of moving parts to keep alive. The
 * interval is deliberately slow — this runs on every console page.
 */
export function useUnreadCount() {
  return useQuery<{ unreadCount: number }, ApiError>({
    queryKey: [...NOTIFICATIONS_KEY, 'unread-count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: notificationsApi.markRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<{ updated: number }, ApiError, void>({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}
