import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

export interface StaffRow {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  permissions: string[];
  group_keys: string[];
  last_login_at: string | null;
  created_at: string | null;
  invite: { expires_at: string | null; expired: boolean; invited_by: string } | null;
}

export interface GroupRow {
  key: string;
  name: string;
  description: string;
  scopes: string[];
  /** Implications resolved, so the console can show what a grant really confers. */
  effective: string[];
}

export interface AuditRow {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  resource: string;
  resource_id: string | null;
  changes: { field: string; from: unknown; to: unknown }[] | null;
  meta: Record<string, unknown> | null;
  outcome: 'success' | 'denied' | 'error';
  method: string;
  path: string;
  request_id: string;
  created_at: string | null;
}

export interface InvitePayload {
  email: string;
  name: string;
  role: 'moderator' | 'admin';
  group_keys: string[];
  scopes: string[];
}

export const staffApi = {
  list: (): Promise<StaffRow[]> => apiClient.get<StaffRow[]>(EP.ADMIN.STAFF),
  groups: (): Promise<GroupRow[]> => apiClient.get<GroupRow[]>(EP.ADMIN.STAFF_GROUPS),

  invite: (payload: InvitePayload): Promise<{ user_id: string; invite_id: string }> =>
    apiClient.post<{ user_id: string; invite_id: string }>(EP.ADMIN.STAFF_INVITES, payload),

  revokeInvite: (userId: string): Promise<void> =>
    apiClient.delete<void>(EP.ADMIN.STAFF_INVITE(userId)),

  setPermissions: (userId: string, body: { group_keys: string[]; scopes: string[] }): Promise<void> =>
    apiClient.patch<void>(EP.ADMIN.STAFF_PERMISSIONS(userId), body),

  audit: (params: Record<string, string | number | undefined>): Promise<AuditRow[]> => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    const suffix = query.toString();
    return apiClient.get<AuditRow[]>(`${EP.ADMIN.AUDIT}${suffix === '' ? '' : `?${suffix}`}`);
  },

  // ── Public: the invite link ──────────────────────────────────────────
  peekInvite: (token: string): Promise<{ email: string; name: string }> =>
    apiClient.get<{ email: string; name: string }>(EP.ADMIN.INVITE_PEEK(token)),

  acceptInvite: (token: string, password: string): Promise<void> =>
    apiClient.post<void>(EP.ADMIN.INVITE_ACCEPT(token), { password }),
};
