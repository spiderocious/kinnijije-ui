import { EP } from '@shared/constants/endpoints';
import { staffClient } from './staff-client';

export interface StaffRow {
  id: string;
  email: string;
  name: string;
  tier: string;
  status: string;
  permissions: string[];
  group_keys: string[];
  last_console_login_at: string | null;
  created_at: string | null;
  has_customer_account: boolean;
  invite: { expires_at: string | null; expired: boolean; invited_by: string | null } | null;
}

/**
 * A scope somebody holds, and why.
 *
 * The provenance is the whole point of the detail page: most of what a staff
 * member can do was never ticked by anybody — it arrived with a group, or by
 * implication from a stronger grant. A screen that shows only the granted
 * array describes a person who can do less than they really can.
 */
export interface EffectiveScope {
  scope: string;
  via: 'tier' | 'group' | 'direct' | 'implied';
  /** The group's name, the implying scope, or null for a direct grant. */
  source: string | null;
}

export interface StaffActivityEntry {
  id: string;
  action: string;
  resource: string;
  resource_id: string | null;
  outcome: string;
  changes: { field: string; from: unknown; to: unknown }[] | null;
  created_at: string | null;
}

export interface StaffDetail {
  id: string;
  email: string;
  name: string;
  tier: string;
  status: string;
  status_reason: string | null;
  permissions: string[];
  group_keys: string[];
  effective: EffectiveScope[];
  last_console_login_at: string | null;
  created_at: string | null;
  invited_by: string | null;
  has_customer_account: boolean;
  invite: { expires_at: string | null; expired: boolean; invited_by: string | null } | null;
  /** Refused attempts, all time. A high number means somebody is blocked. */
  denied_count: number;
  activity: StaffActivityEntry[];
  /** Whether the VIEWER may edit this person. Presentation; the server decides. */
  editable: boolean;
  /** What the viewer may confer, so the rest can be greyed out rather than 403. */
  grantable: string[];
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
  tier: 'moderator' | 'admin';
  group_keys: string[];
  scopes: string[];
}

export const staffApi = {
  list: (): Promise<StaffRow[]> => staffClient.get<StaffRow[]>(EP.ADMIN.STAFF),
  groups: (): Promise<GroupRow[]> => staffClient.get<GroupRow[]>(EP.ADMIN.STAFF_GROUPS),

  detail: (staffId: string): Promise<StaffDetail> =>
    staffClient.get<StaffDetail>(EP.ADMIN.STAFF_DETAIL(staffId)),

  invite: (payload: InvitePayload): Promise<{ user_id: string; invite_id: string }> =>
    staffClient.post<{ user_id: string; invite_id: string }>(EP.ADMIN.STAFF_INVITES, payload),

  revokeInvite: (staffId: string): Promise<void> =>
    staffClient.delete<void>(EP.ADMIN.STAFF_INVITE(staffId)),

  /** Removes console access. The row survives so the audit trail still reads. */
  revokeAccess: (staffId: string, reason?: string): Promise<void> =>
    staffClient.post<void>(EP.ADMIN.STAFF_REVOKE(staffId), reason === undefined ? {} : { reason }),

  setPermissions: (staffId: string, body: { group_keys: string[]; scopes: string[] }): Promise<void> =>
    staffClient.patch<void>(EP.ADMIN.STAFF_PERMISSIONS(staffId), body),

  audit: (params: Record<string, string | number | undefined>): Promise<AuditRow[]> => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    const suffix = query.toString();
    return staffClient.get<AuditRow[]>(`${EP.ADMIN.AUDIT}${suffix === '' ? '' : `?${suffix}`}`);
  },

  // ── Public: the invite link ──────────────────────────────────────────
  peekInvite: (token: string): Promise<{ email: string; name: string }> =>
    staffClient.get<{ email: string; name: string }>(EP.ADMIN.INVITE_PEEK(token)),

  acceptInvite: (token: string, password: string): Promise<void> =>
    staffClient.post<void>(EP.ADMIN.INVITE_ACCEPT(token), { password }),
};
