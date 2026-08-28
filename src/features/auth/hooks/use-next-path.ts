import { useRouterState } from '@tanstack/react-router';

import { ROUTES } from '@shared/constants/routes';
import { searchValue } from '@shared/utils/search-value';

/** The query key carrying where somebody was trying to go. */
export const NEXT_PARAM = 'next';

/**
 * Whether a `next` value is safe to send somebody to.
 *
 * ONLY a same-origin relative path. `//evil.com` and `https://evil.com` are
 * both valid destinations to a browser, so a login page that redirects to
 * whatever it is handed becomes an open redirect — a phishing link that starts
 * on our real domain and ends anywhere.
 *
 * A backslash counts too: some browsers normalise `/\evil.com` to `//evil.com`.
 */
export function isSafeNext(value: string): boolean {
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//') || value.startsWith('/\\')) return false;

  // Never point back at an auth page. `?next=/login` sends somebody who just
  // signed in straight to the sign-in screen, and a nested one is how the
  // parameter ends up eating itself.
  const path = value.split('?')[0] ?? '';
  if (AUTH_PATHS.includes(path)) return false;

  return true;
}

/** Pages it makes no sense to return TO after signing in. */
const AUTH_PATHS: readonly string[] = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.ENTRY,
  ROUTES.ADMIN_LOGIN,
];

/** Builds the `?next=` value for the current location, path and query. */
export function buildNext(pathname: string, searchStr: string): string {
  const query = searchStr.length > 0 ? `?${searchStr}` : '';
  return `${pathname}${query}`;
}

/**
 * Where to go after signing in.
 *
 * Null when there is nothing to return to, or when what was handed over is not
 * a place on this site.
 */
export function useNextPath(): string | null {
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const raw = searchValue(new URLSearchParams(search).get(NEXT_PARAM));

  if (raw.length === 0 || !isSafeNext(raw)) return null;
  return raw;
}
