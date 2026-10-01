import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EVENTS, analytics } from '@shared/services/analytics';
import type { ApiError } from '@shared/services/api-client';

import { staffApi, type AuditRow, type GroupRow, type InvitePayload, type StaffRow } from '../services/staff.api';

const STAFF_KEY = ['admin', 'staff'] as const;

export function useStaff() {
  return useQuery<StaffRow[], ApiError>({ queryKey: STAFF_KEY, queryFn: staffApi.list });
}

export function usePermissionGroups() {
  return useQuery<GroupRow[], ApiError>({
    queryKey: ['admin', 'staff', 'groups'],
    queryFn: staffApi.groups,
    // Seeded and effectively static for a session.
    staleTime: 5 * 60 * 1000,
  });
}

export function useInviteStaff() {
  const queryClient = useQueryClient();

  return useMutation<{ user_id: string; invite_id: string }, ApiError, InvitePayload>({
    mutationFn: staffApi.invite,
    onSuccess: async (_result, variables) => {
      // Who is being let in, and with what. The email is NOT sent as a
      // property — a colleague's address is personal data.
      analytics.track(EVENTS.ADMIN_STAFF_INVITED, {
        tier: variables.tier,
        group_count: variables.group_keys.length,
        scope_count: variables.scopes.length,
      });
      await queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: staffApi.revokeInvite,
    onSuccess: async () => {
      analytics.track(EVENTS.ADMIN_STAFF_INVITE_REVOKED, {});
      await queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
  });
}

export function useSetStaffPermissions() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { userId: string; group_keys: string[]; scopes: string[] }>({
    mutationFn: ({ userId, group_keys, scopes }) =>
      staffApi.setPermissions(userId, { group_keys, scopes }),
    onSuccess: async (_result, variables) => {
      analytics.track(EVENTS.ADMIN_STAFF_PERMISSIONS_CHANGED, {
        group_count: variables.group_keys.length,
        scope_count: variables.scopes.length,
      });
      await queryClient.invalidateQueries({ queryKey: STAFF_KEY });
    },
  });
}

export function useAuditLog(params: Record<string, string | number | undefined>) {
  return useQuery<AuditRow[], ApiError>({
    queryKey: ['admin', 'audit', params],
    queryFn: () => staffApi.audit(params),
  });
}
