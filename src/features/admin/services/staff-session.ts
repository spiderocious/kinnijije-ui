/**
 * The console's own credential store.
 *
 * SEPARATE from `sessionStore`, which holds the customer token. Staff are a
 * different identity domain with a different token audience, so one browser
 * can legitimately hold both: somebody signed in as a cook and as an operator
 * at the same time, in the same tab, without either clobbering the other.
 *
 * Sharing one key would mean signing into the console logged you out of the
 * app, which is exactly the kind of coupling the separation removed.
 */
const ACCESS_KEY = 'kj.staff.access';
const REFRESH_KEY = 'kj.staff.refresh';

export interface StaffTokens {
  accessToken: string;
  refreshToken: string;
}

export const staffSessionStore = {
  get(): StaffTokens | null {
    try {
      const accessToken = localStorage.getItem(ACCESS_KEY);
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (accessToken === null || refreshToken === null) return null;
      return { accessToken, refreshToken };
    } catch {
      // Private mode, or storage blocked. Treated as signed out.
      return null;
    }
  },

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_KEY);
    } catch {
      return null;
    }
  },

  set(tokens: StaffTokens): void {
    try {
      localStorage.setItem(ACCESS_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    } catch {
      // Nothing to do — the session simply will not survive a reload.
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      // Ignored.
    }
  },
};
