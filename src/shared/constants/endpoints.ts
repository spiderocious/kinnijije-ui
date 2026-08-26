/**
 * Single source of truth for backend paths.
 * Never inline a backend path in a component or hook.
 */
export const EP = {
  HEALTH: '/health',
} as const;
