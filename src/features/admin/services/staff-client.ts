import { ENV } from '@shared/config/env';
import { ApiError } from '@shared/services/api-client';

import { staffSessionStore } from './staff-session';

/**
 * The console's HTTP client.
 *
 * A second client rather than a flag on the customer one, because the two send
 * different credentials to different audiences — and mixing that decision into
 * one code path is how a console token ends up on a customer endpoint.
 *
 * Refresh is shared by every caller through one in-flight promise: without it,
 * five queries failing 401 at once fire five refreshes, and since the backend
 * ROTATES the refresh token, four of them present a token that has just been
 * replaced and get treated as theft.
 */

let refreshInFlight: Promise<boolean> | null = null;

async function refreshStaffSession(): Promise<boolean> {
  const stored = staffSessionStore.get();
  if (stored === null) return false;

  try {
    const response = await fetch(`${ENV.API_BASE_URL}/api/v1/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: stored.refreshToken }),
    });

    if (!response.ok) {
      staffSessionStore.clear();
      return false;
    }

    const body = (await response.json()) as {
      data: { tokens: { access_token: string; refresh_token: string } };
    };
    staffSessionStore.set({
      accessToken: body.data.tokens.access_token,
      refreshToken: body.data.tokens.refresh_token,
    });
    return true;
  } catch {
    staffSessionStore.clear();
    return false;
  }
}

function ensureRefresh(): Promise<boolean> {
  refreshInFlight ??= refreshStaffSession().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function send(path: string, init: RequestInit): Promise<Response> {
  const token = staffSessionStore.getAccessToken();
  return fetch(`${ENV.API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
      ...(init.headers ?? {}),
    },
  });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response = await send(path, init);

  // One retry, and only after a refresh that actually succeeded.
  if (response.status === 401 && (await ensureRefresh())) {
    response = await send(path, init);
  }

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // Same envelope the customer client reads: branch on `code`, render
    // `message` verbatim, never hardcode a copy of it here.
    const envelope = body as {
      error?: { code?: string; message?: string; field_errors?: Record<string, string[]> };
    } | null;
    const retryAfter = response.headers.get('retry-after');

    throw new ApiError(
      response.status,
      envelope?.error?.code ?? 'internal',
      envelope?.error?.message ?? 'Something went wrong.',
      envelope?.error?.field_errors,
      retryAfter === null ? undefined : Number(retryAfter),
    );
  }

  return (body as { data: T }).data;
}

export const staffClient = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, payload?: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', body: JSON.stringify(payload ?? {}) }),
  patch: <T>(path: string, payload?: unknown): Promise<T> =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(payload ?? {}) }),
  put: <T>(path: string, payload?: unknown): Promise<T> =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(payload ?? {}) }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
};
