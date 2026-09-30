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

  /** Public and unauthenticated — the decide-first flow. */
  DECIDE: {
    OPTIONS: `${V1}/decide/options`,
    STATS: `${V1}/decide/stats`,
    DECIDE: `${V1}/decide`,
    /** Authenticated, unlike the rest: history belongs to an account. */
    HISTORY: `${V1}/decide/history`,
    HISTORY_ENTRY: (id: string) => `${V1}/decide/history/${id}`,
  },

  /**
   * Public, like decide. Only OFFERS can ever make the server call Chowdeck;
   * PLACES is our own table and CLICKS records a tap.
   */
  CHOWDECK: {
    PLACES: `${V1}/places`,
    OFFERS: `${V1}/partners/chowdeck/offers`,
    CLICKS: `${V1}/partners/chowdeck/clicks`,
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
  /** Public: what the app is allowed to show. No session needed. */
  CONFIG: {
    FEATURES: `${V1}/config/features`,
  },

  ADMIN: {
    STAFF: `${V1}/admin/staff`,
    STAFF_GROUPS: `${V1}/admin/staff/groups`,
    STAFF_INVITES: `${V1}/admin/staff/invites`,
    STAFF_INVITE: (userId: string) => `${V1}/admin/staff/${userId}/invite`,
    STAFF_PERMISSIONS: (userId: string) => `${V1}/admin/staff/${userId}/permissions`,
    AUDIT: `${V1}/admin/audit`,
    SCRIPTS: `${V1}/admin/scripts`,
    SCRIPT_RUN: (scriptId: string) => `${V1}/admin/scripts/${scriptId}/run`,
    /** PUBLIC — no session, the token IS the credential. */
    INVITE_PEEK: (token: string) => `${V1}/admin/invites/${token}`,
    INVITE_ACCEPT: (token: string) => `${V1}/admin/invites/${token}/accept`,

    SETUP: `${V1}/admin/setup`,
    OVERVIEW: `${V1}/admin/overview`,
    /** Visibility into the anonymous decide flow. */
    AI_STATS: `${V1}/admin/ai/stats`,
    DECIDE_OVERVIEW: `${V1}/admin/decide/overview`,
    DECIDE_LOGS: `${V1}/admin/decide/logs`,
    DECIDE_LOG: (logId: string) => `${V1}/admin/decide/logs/${logId}`,

    RECIPES: `${V1}/admin/recipes`,
    RECIPES_BULK: `${V1}/admin/recipes/bulk`,
    RECIPES_DELETE: `${V1}/admin/recipes/delete`,
    RECIPES_STATUS: `${V1}/admin/recipes/status`,
    RECIPE: (mealId: string) => `${V1}/admin/recipes/${mealId}`,
    RECIPE_STATUS: (mealId: string) => `${V1}/admin/recipes/${mealId}/status`,

    /** Recipe imagery. Literals before the :imageId routes, as on the server. */
    RECIPE_IMAGES: (mealId: string) => `${V1}/admin/recipes/${mealId}/images`,
    RECIPE_IMAGE_PROMPT: (mealId: string) => `${V1}/admin/recipes/${mealId}/images/prompt`,
    RECIPE_IMAGE_UPLOAD_URL: (mealId: string) => `${V1}/admin/recipes/${mealId}/images/upload-url`,
    RECIPE_IMAGE_GENERATE: (mealId: string) => `${V1}/admin/recipes/${mealId}/images/generate`,
    RECIPE_IMAGE_PRIMARY: (mealId: string) => `${V1}/admin/recipes/${mealId}/images/primary`,
    RECIPE_IMAGE_CONFIRM: (mealId: string, imageId: string) =>
      `${V1}/admin/recipes/${mealId}/images/${imageId}/confirm`,
    RECIPE_IMAGE_PUBLISH: (mealId: string, imageId: string) =>
      `${V1}/admin/recipes/${mealId}/images/${imageId}/publish`,
    RECIPE_IMAGE_REJECT: (mealId: string, imageId: string) =>
      `${V1}/admin/recipes/${mealId}/images/${imageId}/reject`,
    RECIPE_IMAGE: (mealId: string, imageId: string) =>
      `${V1}/admin/recipes/${mealId}/images/${imageId}`,
    USERS: `${V1}/admin/users`,
    USER: (userId: string) => `${V1}/admin/users/${userId}`,
    USER_STATUS: (userId: string) => `${V1}/admin/users/${userId}/status`,
    USER_ROLE: (userId: string) => `${V1}/admin/users/${userId}/role`,
    AI: `${V1}/admin/ai`,
    AI_PROMPT_IDS: `${V1}/admin/ai/prompt-ids`,
    AI_LOG: (logId: string) => `${V1}/admin/ai/${logId}`,
    FEATURES: `${V1}/admin/features`,
    FEATURE: (flag: string) => `${V1}/admin/features/${flag}`,
    EMAILS: `${V1}/admin/emails`,
    EMAIL_KINDS: `${V1}/admin/emails/kinds`,
    EMAIL_SETTINGS: `${V1}/admin/emails/settings`,
    EMAIL_SETTING: (kind: string) => `${V1}/admin/emails/settings/${kind}`,
    EMAIL_PROVIDER: `${V1}/admin/emails/provider`,
    EMAIL_PROVIDER_TEST: `${V1}/admin/emails/provider/test`,
    EMAIL_PREVIEW: `${V1}/admin/emails/preview`,
    EMAIL_SEND: `${V1}/admin/emails/send`,
    EMAIL: (emailId: string) => `${V1}/admin/emails/${emailId}`,
    EMAIL_RESEND: (emailId: string) => `${V1}/admin/emails/${emailId}/resend`,
    JOBS: `${V1}/admin/jobs`,
    JOB_TYPES: `${V1}/admin/jobs/types`,
    JOB: (jobId: string) => `${V1}/admin/jobs/${jobId}`,
    JOB_RETRY: (jobId: string) => `${V1}/admin/jobs/${jobId}/retry`,
    JOB_CANCEL: (jobId: string) => `${V1}/admin/jobs/${jobId}/cancel`,

    /** The Chowdeck integration. Literals before the :id routes, as on the server. */
    CHOWDECK_OVERVIEW: `${V1}/admin/chowdeck/overview`,
    CHOWDECK_BREAKER_RESET: `${V1}/admin/chowdeck/breaker/reset`,
    CHOWDECK_COVERAGE: `${V1}/admin/chowdeck/coverage`,
    CHOWDECK_FETCH_AHEAD: `${V1}/admin/chowdeck/fetch-ahead`,
    CHOWDECK_PLACES: `${V1}/admin/chowdeck/places`,
    CHOWDECK_PLACES_AUTOCOMPLETE: `${V1}/admin/chowdeck/places/autocomplete`,
    CHOWDECK_PLACES_IMPORT: `${V1}/admin/chowdeck/places/import`,
    CHOWDECK_PLACES_PURGE: `${V1}/admin/chowdeck/places/purge`,
    CHOWDECK_PLACES_DELETE: `${V1}/admin/chowdeck/places/delete`,
    CHOWDECK_PLACE: (placeId: string) => `${V1}/admin/chowdeck/places/${encodeURIComponent(placeId)}`,
    CHOWDECK_CACHE: `${V1}/admin/chowdeck/cache`,
    CHOWDECK_CACHE_CLEAR: `${V1}/admin/chowdeck/cache/clear`,
    CHOWDECK_CACHE_ENTRY: (id: string) => `${V1}/admin/chowdeck/cache/${id}`,
    CHOWDECK_CACHE_REFRESH: (id: string) => `${V1}/admin/chowdeck/cache/${id}/refresh`,
    CHOWDECK_CALLS: `${V1}/admin/chowdeck/calls`,
    CHOWDECK_CALL: (id: string) => `${V1}/admin/chowdeck/calls/${id}`,
    CHOWDECK_CALL_REPLAY: (id: string) => `${V1}/admin/chowdeck/calls/${id}/replay`,
    CHOWDECK_CLICKS: `${V1}/admin/chowdeck/clicks`,
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
