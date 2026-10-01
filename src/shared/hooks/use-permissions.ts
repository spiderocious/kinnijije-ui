import { useStaffSession } from '@features/admin/hooks/use-staff-session';
import type { Scope } from '@shared/constants/permissions';

export interface Permissions {
  /** Whether this browser holds a console session at all. */
  readonly isStaff: boolean;
  /** Effective scopes, as the server resolved them. */
  readonly scopes: readonly string[];
  readonly can: (scope: Scope) => boolean;
  /** Still resolving — render nothing rather than flashing a denial. */
  readonly isLoading: boolean;
}

/**
 * What the signed-in STAFF MEMBER may do.
 *
 * Reads the console session, not the customer one — those are separate
 * identities now, and a customer has no scopes at all.
 *
 * Drives what the console OFFERS, never what it permits: every admin route is
 * enforced server-side, so a client that lied to itself here would simply get
 * a 403. Hiding is a courtesy — nine links that all fail is worse than not
 * showing them.
 */
export function usePermissions(): Permissions {
  const { staff, isLoading, can } = useStaffSession();

  return {
    isStaff: staff !== null,
    scopes: staff?.permissions ?? [],
    can,
    isLoading,
  };
}
