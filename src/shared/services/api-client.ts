import { ENV } from '@shared/config/env';

interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    severity?: number;
    field_errors?: Record<string, string[]>;
  };
}

/**
 * The error envelope's three fields have one consumer each:
 *
 *   code     — branch on this, and ONLY this. It is the stable contract.
 *   message  — render this verbatim. Never hardcode a copy of it here.
 *   severity — backend dashboards. Carried for completeness; ignore it in UI.
 *
 * `rejection_reason` is deliberately not surfaced: it is an operator
 * diagnostic the backend may rename freely, so nothing may branch on it.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string[]> | undefined;
  /** Seconds to wait, from the Retry-After header on a 429. */
  readonly retryAfterSeconds: number | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string[]>,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function request<T>(path: string, init: RequestInit, options: RequestOptions): Promise<T> {
  const response = await fetch(`${ENV.API_BASE_URL}${path}`, {
    ...init,
    ...(options.signal ? { signal: options.signal } : {}),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...init.headers,
    },
  });

  if (!response.ok) {
    // A body is not guaranteed on an error response — never assume it parses.
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;

    // Surface the real wait rather than a vague "try again later" — a client
    // that cannot compute a backoff just hammers the endpoint.
    const retryAfter = response.headers.get('retry-after');
    const retryAfterSeconds =
      retryAfter !== null && retryAfter.length > 0 ? Number(retryAfter) : undefined;

    throw new ApiError(
      response.status,
      body?.error?.code ?? 'unknown_error',
      body?.error?.message ?? `Request to ${path} failed with ${response.status}`,
      body?.error?.field_errors,
      Number.isNaN(retryAfterSeconds) ? undefined : retryAfterSeconds,
    );
  }

  // 204 No Content has no body at all — parsing it throws.
  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as { data: T };
  return body.data;
}

export const apiClient = {
  get: <T>(path: string, options: RequestOptions = {}) =>
    request<T>(path, { method: 'GET' }, options),

  post: <T>(path: string, payload?: unknown, options: RequestOptions = {}) =>
    request<T>(
      path,
      { method: 'POST', ...(payload !== undefined && { body: JSON.stringify(payload) }) },
      options,
    ),

  patch: <T>(path: string, payload?: unknown, options: RequestOptions = {}) =>
    request<T>(
      path,
      { method: 'PATCH', ...(payload !== undefined && { body: JSON.stringify(payload) }) },
      options,
    ),

  delete: <T>(path: string, options: RequestOptions = {}) =>
    request<T>(path, { method: 'DELETE' }, options),
};
