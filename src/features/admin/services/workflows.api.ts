import { EP } from '@shared/constants/endpoints';

import { staffClient } from './staff-client';

/**
 * The approval engine, from the console's side.
 *
 * Field names are snake_case because that is what the backend serialises —
 * verified against the response, not assumed from the docs. The one place a
 * casing mismatch would surface silently is the filter query, so the filter
 * builder below spells each parameter out rather than spreading an object.
 */

export type WorkflowKind =
  | 'recipe.create'
  | 'recipe.update'
  | 'recipe.unpublish'
  | 'match.rule.publish'
  | 'match.rule.retire'
  | 'staff.permission.grant';

export type WorkflowStatus =
  | 'pending'
  | 'approved'
  | 'applied'
  | 'rejected'
  | 'withdrawn'
  | 'failed';

export interface WorkflowChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface WorkflowRow {
  id: string;
  kind: WorkflowKind;
  status: WorkflowStatus;
  targetType: string;
  targetId: string | null;
  targetLabel: string | null;
  changes: WorkflowChange[] | null;
  requestedBy: string;
  requestedAt: string;
  note: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  appliedAt: string | null;
  error: string | null;
  isMine: boolean;
  canDecide: boolean;
}

export interface WorkflowDetail extends WorkflowRow {
  payload: Record<string, unknown>;
  baseline: Record<string, unknown> | null;
}

export interface WorkflowQueue {
  workflows: WorkflowRow[];
  pendingCount: number;
}

export interface WorkflowFilters {
  kind?: WorkflowKind;
  status?: WorkflowStatus;
  requestedBy?: string;
  mine?: boolean;
  limit?: number;
}

function queryFor(filters: WorkflowFilters): string {
  const params = new URLSearchParams();
  if (filters.kind !== undefined) params.set('kind', filters.kind);
  if (filters.status !== undefined) params.set('status', filters.status);
  if (filters.requestedBy !== undefined) params.set('requested_by', filters.requestedBy);
  if (filters.mine !== undefined) params.set('mine', String(filters.mine));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

export const workflowsApi = {
  list: (filters: WorkflowFilters = {}): Promise<WorkflowQueue> =>
    staffClient.get<WorkflowQueue>(`${EP.WORKFLOWS.LIST}${queryFor(filters)}`),

  detail: (workflowId: string): Promise<WorkflowDetail> =>
    staffClient.get<WorkflowDetail>(EP.WORKFLOWS.DETAIL(workflowId)),

  approve: (workflowId: string, decisionNote?: string): Promise<WorkflowRow> =>
    staffClient.post<WorkflowRow>(EP.WORKFLOWS.APPROVE(workflowId), {
      ...(decisionNote !== undefined && decisionNote !== '' && { decision_note: decisionNote }),
    }),

  reject: (workflowId: string, decisionNote?: string): Promise<WorkflowRow> =>
    staffClient.post<WorkflowRow>(EP.WORKFLOWS.REJECT(workflowId), {
      ...(decisionNote !== undefined && decisionNote !== '' && { decision_note: decisionNote }),
    }),

  withdraw: (workflowId: string): Promise<WorkflowRow> =>
    staffClient.post<WorkflowRow>(EP.WORKFLOWS.WITHDRAW(workflowId), {}),
};

export type NotificationKind =
  | 'approval.needed'
  | 'request.approved'
  | 'request.rejected'
  | 'request.failed'
  | 'request.stale';

export interface NotificationRow {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  workflowId: string | null;
  href: string | null;
  actorName: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  notifications: NotificationRow[];
  unreadCount: number;
}

export const notificationsApi = {
  list: (options: { unreadOnly?: boolean; limit?: number } = {}): Promise<NotificationPage> => {
    const params = new URLSearchParams();
    if (options.unreadOnly !== undefined) params.set('unread_only', String(options.unreadOnly));
    if (options.limit !== undefined) params.set('limit', String(options.limit));
    const query = params.toString();

    return staffClient.get<NotificationPage>(
      `${EP.NOTIFICATIONS.LIST}${query === '' ? '' : `?${query}`}`,
    );
  },

  unreadCount: (): Promise<{ unreadCount: number }> =>
    staffClient.get<{ unreadCount: number }>(EP.NOTIFICATIONS.UNREAD_COUNT),

  markRead: (notificationId: string): Promise<void> =>
    staffClient.post<void>(EP.NOTIFICATIONS.READ(notificationId), {}),

  markAllRead: (): Promise<{ updated: number }> =>
    staffClient.post<{ updated: number }>(EP.NOTIFICATIONS.READ_ALL, {}),
};
