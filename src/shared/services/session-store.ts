/**
 * Where the tokens live between page loads.
 *
 * `localStorage` is a deliberate, documented trade-off: it is readable by any
 * script on the origin, so a successful XSS can lift the token. The
 * alternative — httpOnly cookies — needs the backend to set them and brings
 * CSRF handling with it. This is the standard bearer-token setup the API was
 * built for; if the threat model tightens, this file is the single place that
 * changes.
 *
 * The access token is short-lived (15 min) precisely to bound that exposure.
 */
const ACCESS_KEY = 'kj.access_token';
const REFRESH_KEY = 'kj.refresh_token';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
}

/**
 * Every read and write is guarded. Storage throws outright in a private window
 * on some browsers, and a thrown getter here would take down app boot.
 */
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — the session simply will not survive a reload.
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}

export const sessionStore = {
  get(): StoredSession | null {
    const accessToken = read(ACCESS_KEY);
    const refreshToken = read(REFRESH_KEY);
    if (accessToken === null || refreshToken === null) return null;
    return { accessToken, refreshToken };
  },

  getAccessToken(): string | null {
    return read(ACCESS_KEY);
  },

  set(session: StoredSession): void {
    write(ACCESS_KEY, session.accessToken);
    write(REFRESH_KEY, session.refreshToken);
  },

  clear(): void {
    remove(ACCESS_KEY);
    remove(REFRESH_KEY);
  },
};
