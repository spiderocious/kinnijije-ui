import { useSession } from '@features/auth';
import { isConsoleRole, satisfies, type Scope } from '@shared/constants/permissions';

export interface Permissions {
  /** Whether this account may see the console at all. */
  readonly isStaff: boolean;
  /** Effective scopes, as the server resolved them. */
  readonly scopes: readonly string[];
  /** Whether a specific action is available. */
  readonly can: (scope: Scope) => boolean;
  /** Still resolving the session — render nothing rather than flashing a denial. */
  readonly isLoading: boolean;
}

/**
 * What this person may do.
 *
 * Drives what the console OFFERS, not what it permits: every admin route is
 * enforced server-side, so a client that lied to itself here would simply get
 * a 403. Hiding is a courtesy — nine links that all fail is a worse experience
 * than not showing them.
 */
export function usePermissions(): Permissions {
  const { user, isLoading } = useSession();

  const scopes = user?.permissions ?? [];
  const isStaff = user !== null && isConsoleRole(user.role);

  return {
    isStaff,
    scopes,
    can: (scope: Scope) => satisfies(scopes, scope),
    isLoading,
  };
}
