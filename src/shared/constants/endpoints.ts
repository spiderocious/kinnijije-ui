/**
 * Single source of truth for backend paths.
 * Never inline a backend path in a component or hook.
 *
 * Mirrors the routes registered in the backend feature routers.
 * When a path changes on the backend, it changes here in the same commit —
 * a stale EP constant is the most common cause of a mystery 404.
 */
const V1 = '/api/v1';

export const EP = {
  // Infrastructure probes are unversioned: they are not API surface.
  HEALTH: '/health',
  HEALTH_READY: '/health/ready',

  AUTH: {
    REGISTER: `${V1}/auth/register`,
    LOGIN: `${V1}/auth/login`,
    REFRESH: `${V1}/auth/refresh`,
    LOGOUT: `${V1}/auth/logout`,
    CHANGE_PASSWORD: `${V1}/auth/change-password`,
  },

  ONBOARDING: {
    GET: `${V1}/onboarding`,
    SAVE: `${V1}/onboarding`,
    COMPLETE: `${V1}/onboarding/complete`,
  },

  FILES: {
    UPLOAD_URL: `${V1}/files/upload-url`,
    LIST: `${V1}/files`,
    DETAIL: (fileId: string) => `${V1}/files/${fileId}`,
    CONFIRM: (fileId: string) => `${V1}/files/${fileId}/confirm`,
  },

  USERS: {
    ME: `${V1}/users/me`,
    LIST: `${V1}/users`,
    DETAIL: (userId: string) => `${V1}/users/${userId}`,
    STATUS: (userId: string) => `${V1}/users/${userId}/status`,
    ROLE: (userId: string) => `${V1}/users/${userId}/role`,
  },
} as const;
