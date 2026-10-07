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
  /** Ask KinniJije: the conversational way into the same flow. */
  ASK: '/ask',
  /** One conversation, so a reload keeps it and the URL is quotable. */
  ASK_SESSION: (sessionId: string) => `/ask/${sessionId}`,
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
  /**
   * The timetable: what is planned, and whether the kitchen covers it.
   *
   * Separate from WEEK, which is the weekly reading. Two different questions,
   * and the backend keeps them on separate prefixes for the same reason.
   */
  TIMETABLE: '/timetable',
  /**
   * The timetable's stages, as real paths.
   *
   * SUB-ROUTES RATHER THAN A `stage` STATE, because the flow is five full
   * screens deep and the hardware back button has to work — on Android and in
   * the installed PWA, back is the only way out of a screen, and a flow that
   * held its stage in `useState` exited the whole feature on the first press.
   *
   * `/timetable` itself is the entry: it looks at whether a plan exists and
   * redirects to the kitchen screen or the plan, so a bookmark or a shared
   * link always lands somewhere that makes sense.
   */
  TIMETABLE_KITCHEN: '/timetable/kitchen',
  TIMETABLE_CONFIGURE: '/timetable/configure',
  TIMETABLE_PLAN: '/timetable/plan',
  TIMETABLE_DAYS: '/timetable/days',
  TIMETABLE_NEEDS: '/timetable/needs',
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
  ADMIN_RECIPE_EDIT: (mealId: string) => `/admin/recipes/${mealId}/edit`,
  ADMIN_USERS: '/admin/users',
  ADMIN_USER: (userId: string) => `/admin/users/${userId}`,
  /** Visibility into the anonymous decide flow. */
  ADMIN_DECIDE: '/admin/decide',
  ADMIN_ASK: '/admin/ask',
  ADMIN_DECIDE_LOG: (logId: string) => `/admin/decide/${logId}`,
  ADMIN_AI: '/admin/ai',
  ADMIN_AI_LOG: (logId: string) => `/admin/ai/${logId}`,
  ADMIN_SETTINGS: '/admin/settings',
  /** Colleagues, their permissions and outstanding invitations. */
  ADMIN_STAFF: '/admin/staff',
  /** One colleague: what they can actually do, and what they have been doing. */
  ADMIN_STAFF_MEMBER: (staffId: string) => `/admin/staff/${staffId}`,
  /** Timetable usage and individual plans. Read-only observability. */
  ADMIN_TIMETABLES: '/admin/timetables',
  /** Dishes the composing planner invented, waiting to be made real. */
  ADMIN_SUGGESTIONS: '/admin/suggestions',
  ADMIN_TIMETABLE: (planId: string) => `/admin/timetables/${planId}`,
  /** Curated matching rules: "when somebody has this, serve that". */
  ADMIN_MATCHING: '/admin/matching',
  ADMIN_MATCHING_NEW: '/admin/matching/new',
  /** Type in a kitchen, see which rule fires. Makes precedence visible. */
  ADMIN_MATCHING_TEST: '/admin/matching/test',
  /** Which mood, weight and time combinations have a rule, and which do not. */
  ADMIN_MATCHING_COVERAGE: '/admin/matching/coverage',
  ADMIN_MATCHING_RULE: (ruleId: string) => `/admin/matching/${ruleId}`,
  /** Changes waiting on somebody, and every change already decided. */
  ADMIN_WORKFLOWS: '/admin/workflows',
  /** One request: the diff, who raised it, and the approve or reject buttons. */
  ADMIN_WORKFLOW: (workflowId: string) => `/admin/workflows/${workflowId}`,
  /** What happened since you last looked. The queue answers what is outstanding. */
  ADMIN_NOTIFICATIONS: '/admin/notifications',
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
