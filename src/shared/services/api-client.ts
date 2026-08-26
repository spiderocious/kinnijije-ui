import { ENV } from '@shared/config/env';

interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
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
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'unknown_error',
      body?.error?.message ?? `Request to ${path} failed with ${response.status}`,
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
