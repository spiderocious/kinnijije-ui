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
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
