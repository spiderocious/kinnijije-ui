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
    FORGOT_PASSWORD: `${V1}/auth/forgot-password`,
    RESET_PASSWORD: `${V1}/auth/reset-password`,
  },

  ONBOARDING: {
    GET: `${V1}/onboarding`,
    SAVE: `${V1}/onboarding`,
    COMPLETE: `${V1}/onboarding/complete`,
  },

  KITCHEN: {
    GET: `${V1}/kitchen`,
    SAVE: `${V1}/kitchen`,
  },

  FILES: {
    UPLOAD_URL: `${V1}/files/upload-url`,
    LIST: `${V1}/files`,
    DETAIL: (fileId: string) => `${V1}/files/${fileId}`,
    CONFIRM: (fileId: string) => `${V1}/files/${fileId}/confirm`,
  },

  STOCK: {
    LIST: `${V1}/stock`,
    ADD: `${V1}/stock`,
    DASHBOARD: `${V1}/stock/dashboard`,
    SUGGEST: `${V1}/stock/suggest`,
    HISTORY: `${V1}/stock/history`,
    UNITS: `${V1}/stock/units`,
    UNIT: (unitId: string) => `${V1}/stock/units/${unitId}`,
    DETAIL: (stockId: string) => `${V1}/stock/${stockId}`,
  },

  MARKET: {
    LIST: `${V1}/market`,
    ADD: `${V1}/market`,
    CLEAR_BOUGHT: `${V1}/market/bought`,
    BOUGHT: (marketId: string) => `${V1}/market/${marketId}/bought`,
    DETAIL: (marketId: string) => `${V1}/market/${marketId}`,
  },

  MEALS: {
    LIST: `${V1}/meals`,
    SUGGEST: `${V1}/meals/suggest`,
    /** Turns a name the assistant invented into a meal we really have. */
    GENERATE: `${V1}/meals/generate`,
    FAVOURITES: `${V1}/meals/favourites`,
    DETAIL: (mealId: string) => `${V1}/meals/${mealId}`,
    FAVOURITE: (mealId: string) => `${V1}/meals/${mealId}/favourite`,
    COOKED: (mealId: string) => `${V1}/meals/${mealId}/cooked`,
  },

  /** The console. Everything under /admin, guarded by role on the server. */
  ADMIN: {
    SETUP: `${V1}/admin/setup`,
    OVERVIEW: `${V1}/admin/overview`,
    RECIPES: `${V1}/admin/recipes`,
    RECIPES_BULK: `${V1}/admin/recipes/bulk`,
    RECIPE: (mealId: string) => `${V1}/admin/recipes/${mealId}`,
    RECIPE_STATUS: (mealId: string) => `${V1}/admin/recipes/${mealId}/status`,
    USERS: `${V1}/admin/users`,
    USER: (userId: string) => `${V1}/admin/users/${userId}`,
    USER_STATUS: (userId: string) => `${V1}/admin/users/${userId}/status`,
    USER_ROLE: (userId: string) => `${V1}/admin/users/${userId}/role`,
    AI: `${V1}/admin/ai`,
    AI_PROMPT_IDS: `${V1}/admin/ai/prompt-ids`,
    AI_LOG: (logId: string) => `${V1}/admin/ai/${logId}`,
    EMAILS: `${V1}/admin/emails`,
    EMAIL_KINDS: `${V1}/admin/emails/kinds`,
    EMAIL_SETTINGS: `${V1}/admin/emails/settings`,
    EMAIL_SETTING: (kind: string) => `${V1}/admin/emails/settings/${kind}`,
    EMAIL_PREVIEW: `${V1}/admin/emails/preview`,
    EMAIL_SEND: `${V1}/admin/emails/send`,
    EMAIL: (emailId: string) => `${V1}/admin/emails/${emailId}`,
    EMAIL_RESEND: (emailId: string) => `${V1}/admin/emails/${emailId}/resend`,
    JOBS: `${V1}/admin/jobs`,
    JOB_TYPES: `${V1}/admin/jobs/types`,
    JOB: (jobId: string) => `${V1}/admin/jobs/${jobId}`,
    JOB_RETRY: (jobId: string) => `${V1}/admin/jobs/${jobId}/retry`,
    JOB_CANCEL: (jobId: string) => `${V1}/admin/jobs/${jobId}/cancel`,
  },

  CHAT: {
    HISTORY: `${V1}/chat`,
    ASK: `${V1}/chat`,
    CLEAR: `${V1}/chat`,
  },

  EXTRACTION: {
    CHECK: `${V1}/extraction/check`,
    PHOTOS: `${V1}/extraction/photos`,
    RECEIPT: `${V1}/extraction/receipt`,
  },

  JOBS: {
    LIST: `${V1}/jobs`,
    DETAIL: (jobId: string) => `${V1}/jobs/${jobId}`,
    STREAM: (jobId: string) => `${V1}/jobs/${jobId}/stream`,
    CANCEL: (jobId: string) => `${V1}/jobs/${jobId}/cancel`,
    RETRY: (jobId: string) => `${V1}/jobs/${jobId}/retry`,
  },

  WEEK: {
    SUMMARY: `${V1}/week`,
    REFRESH_READING: `${V1}/week/reading`,
  },

  USERS: {
    ME: `${V1}/users/me`,
    SETTINGS: `${V1}/users/me/settings`,
    DELETE_ME: `${V1}/users/me`,
    LIST: `${V1}/users`,
    DETAIL: (userId: string) => `${V1}/users/${userId}`,
    STATUS: (userId: string) => `${V1}/users/${userId}/status`,
    ROLE: (userId: string) => `${V1}/users/${userId}/role`,
  },
} as const;
