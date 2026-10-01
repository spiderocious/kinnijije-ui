/**
 * Single source of truth for every path in the app.
 * Never inline a path string in a <Link to="..."> or navigate("...").
 */
export const ROUTES = {
  ROOT: '/',
  ENTRY: '/',
  /** The social-OG render — one full-screen hero, no scroll, no chrome. */
  HERO: '/hero',
  /** The decide-first flow: land, four taps, a meal. No account needed. */
  DECIDE: '/decide',
  /**
   * The old marketing landing — pricing, FAQ, trust.
   *
   * Kept, not deleted: it is genuinely useful to somebody who wants to read
   * before deciding, and moving it here means `/` can be the flow without
   * losing any of it.
   */
  WHY: '/why',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // First run
  ONBOARDING: '/onboarding',

  // The app proper
  KITCHEN: '/kitchen',
  STOCK: '/stock',
  STOCK_ADD: '/stock/add',
  STOCK_ITEM: (stockId: string) => `/stock/${stockId}`,
  MARKET: '/market',
  SUGGESTIONS: '/suggestions',
  MEAL: (mealId: string) => `/meals/${mealId}`,
  /**
   * A meal the assistant named but we do not have yet.
   *
   * The detail screen recognises this id, generates the recipe, then REPLACES
   * the url with the real one — so Back never returns to a page that has to
   * regenerate itself.
   */
  GENERATED_MEAL_ID: 'generated-meal',
  COOK: (mealId: string) => `/cook/${mealId}`,
  CHAT: '/chat',
  WEEK: '/week',
  FAVOURITES: '/favourites',
  SETTINGS: '/settings',

  // Design-system surfaces, not product screens
  PREVIEW: '/preview',
  SCENES: '/scenes',

  /** The console. A separate surface behind the same origin. */
  ADMIN_SETUP: '/admin/setup',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_RECIPES: '/admin/recipes',
  ADMIN_RECIPE: (mealId: string) => `/admin/recipes/${mealId}`,
  ADMIN_RECIPE_NEW: '/admin/recipes/new',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER: (userId: string) => `/admin/users/${userId}`,
  /** Visibility into the anonymous decide flow. */
  ADMIN_DECIDE: '/admin/decide',
  ADMIN_DECIDE_LOG: (logId: string) => `/admin/decide/${logId}`,
  ADMIN_AI: '/admin/ai',
  ADMIN_AI_LOG: (logId: string) => `/admin/ai/${logId}`,
  ADMIN_SETTINGS: '/admin/settings',
  /** Colleagues, their permissions and outstanding invitations. */
  ADMIN_STAFF: '/admin/staff',
  /** What staff have been doing. */
  ADMIN_AUDIT: '/admin/audit',
  /** Operations an operator runs instead of a shell command. */
  ADMIN_SCRIPTS: '/admin/scripts',
  /** Automated email: what runs, what is queued, what got skipped. */
  ADMIN_CAMPAIGNS: '/admin/campaigns',
  /** One drafted batch, reviewed per recipient before anything sends. */
  ADMIN_CAMPAIGN_BATCH: (batchId: string) => `/admin/campaigns/batches/${batchId}`,
  /** Build one kind for named users, to see exactly what they would get. */
  ADMIN_CAMPAIGN_COMPOSE: '/admin/campaigns/compose',
  /** PUBLIC: setting a password from an invite link. Outside the console shell. */
  ADMIN_ACCEPT_INVITE: '/admin/accept-invite',
  ADMIN_EMAILS: '/admin/emails',
  ADMIN_EMAIL_NEW: '/admin/emails/new',
  ADMIN_EMAIL: (emailId: string) => `/admin/emails/${emailId}`,
  ADMIN_JOBS: '/admin/jobs',
  ADMIN_JOB: (jobId: string) => `/admin/jobs/${jobId}`,
  /** The Chowdeck integration: what we asked them, what we kept, who tapped through. */
  ADMIN_CHOWDECK: '/admin/chowdeck',
  ADMIN_CHOWDECK_REQUESTS: '/admin/chowdeck/requests',
  ADMIN_CHOWDECK_REQUEST: (callId: string) => `/admin/chowdeck/requests/${callId}`,
  ADMIN_CHOWDECK_CACHE: '/admin/chowdeck/cache',
  ADMIN_CHOWDECK_CACHE_ENTRY: (entryId: string) => `/admin/chowdeck/cache/${entryId}`,
  ADMIN_CHOWDECK_COVERAGE: '/admin/chowdeck/coverage',
  ADMIN_CHOWDECK_PLACES: '/admin/chowdeck/places',
  ADMIN_CHOWDECK_CLICKS: '/admin/chowdeck/clicks',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
