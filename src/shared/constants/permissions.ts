/**
 * Scopes, mirroring backend/src/shared/constants/permissions.ts.
 *
 * When one moves, both move in the same commit — a drifted list here means the
 * console hides something the server would have allowed, or offers something
 * it will refuse.
 *
 * This is a COURTESY copy. Authorisation happens server-side on every route;
 * nothing here is a control, and a client that ignores it gains nothing.
 */

export const RESOURCES = [
  'recipes',
  'images',
  'users',
  'staff',
  'emails',
  'ai',
  'jobs',
  'flags',
  'decide',
  'chowdeck',
  'settings',
  'scripts',
  'audit',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ['read', 'write', 'delete'] as const;
export type Action = (typeof ACTIONS)[number];

export type Scope = `${Resource}:${Action}`;

/**
 * Whether a held set satisfies a required scope.
 *
 * The server sends EFFECTIVE scopes (implications already resolved), so this
 * is usually a plain membership test — the implication logic is kept anyway so
 * a raw set behaves identically if one is ever passed in.
 */
export function satisfies(held: readonly string[], needed: Scope): boolean {
  if (held.includes(needed)) return true;

  const separator = needed.indexOf(':');
  const resource = needed.slice(0, separator);
  const action = needed.slice(separator + 1);

  if (action === 'read') {
    return held.includes(`${resource}:write`) || held.includes(`${resource}:delete`);
  }
  if (action === 'write') return held.includes(`${resource}:delete`);
  return false;
}

/**
 * The roles that may see the console at all.
 *
 * Single source of truth: this list was previously duplicated in five places
 * across the web app, none of which agreed on whether `moderator` existed.
 */
export const CONSOLE_ROLES = ['moderator', 'admin', 'super_admin'] as const;

export const ALL_ROLES = ['user', 'moderator', 'admin', 'super_admin'] as const;
export type UserRole = (typeof ALL_ROLES)[number];

const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
  super_admin: 3,
};

/** Mirrors the backend's `roleAtLeast`, which the client previously lacked. */
export const roleAtLeast = (role: UserRole, minimum: UserRole): boolean =>
  ROLE_RANK[role] >= ROLE_RANK[minimum];

export const isConsoleRole = (role: string): boolean =>
  (CONSOLE_ROLES as readonly string[]).includes(role);
