/**
 * Single source of truth for every path in the app.
 * Never inline a path string in a <Link to="..."> or navigate("...").
 */
export const ROUTES = {
  ROOT: '/',
  ENTRY: '/',

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
  ADMIN_AI: '/admin/ai',
  ADMIN_AI_LOG: (logId: string) => `/admin/ai/${logId}`,
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_EMAILS: '/admin/emails',
  ADMIN_EMAIL_NEW: '/admin/emails/new',
  ADMIN_EMAIL: (emailId: string) => `/admin/emails/${emailId}`,
  ADMIN_JOBS: '/admin/jobs',
  ADMIN_JOB: (jobId: string) => `/admin/jobs/${jobId}`,
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
