/**
 * Every client event name, in one place.
 *
 * The names live here so a typo cannot invent a second event: a provider will
 * accept `meal_cookd` forever and never mention it. snake_case, past tense,
 * object first — see docs/v2/analytics.
 */
export const EVENTS = {
  // ── Decide: the front door funnel ──────────────────────────────────────
  DECIDE_LANDING_VIEWED: 'decide_landing_viewed',
  DECIDE_STARTED: 'decide_started',
  DECIDE_STEP_COMPLETED: 'decide_step_completed',
  DECIDE_STEP_SKIPPED: 'decide_step_skipped',
  DECIDE_INGREDIENT_SEARCHED: 'decide_ingredient_searched',
  DECIDE_REQUESTED: 'decide_requested',
  DECIDE_VERDICT_SHOWN: 'decide_verdict_shown',
  DECIDE_VERDICT_EMPTY: 'decide_verdict_empty',
  DECIDE_ALTERNATE_CHOSEN: 'decide_alternate_chosen',
  DECIDE_MEAL_REJECTED: 'decide_meal_rejected',
  DECIDE_EXHAUSTED: 'decide_exhausted',
  DECIDE_RATE_LIMITED: 'decide_rate_limited',
  DECIDE_FAILED: 'decide_failed',
  DECIDE_ANSWER_CHANGED: 'decide_answer_changed',
  DECIDE_RESTARTED: 'decide_restarted',
  DECIDE_SIGNUP_CLICKED: 'decide_signup_clicked',
  DECIDE_COOK_CLICKED: 'decide_cook_clicked',

  // ── Marketing ──────────────────────────────────────────────────────────
  WHY_PAGE_VIEWED: 'why_page_viewed',

  // ── Auth ───────────────────────────────────────────────────────────────
  SIGNUP_STARTED: 'signup_started',
  SIGNED_UP: 'signed_up',
  SIGNUP_FAILED: 'signup_failed',
  LOGGED_IN: 'logged_in',
  LOGIN_FAILED: 'login_failed',
  LOGGED_OUT: 'logged_out',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  SESSION_EXPIRED: 'session_expired',

  // ── Onboarding ─────────────────────────────────────────────────────────
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_ABANDONED: 'onboarding_abandoned',

  // ── Kitchen & stock ────────────────────────────────────────────────────
  KITCHEN_SAVED: 'kitchen_saved',
  STOCK_ADDED: 'stock_added',
  STOCK_UPDATED: 'stock_updated',
  STOCK_REMOVED: 'stock_removed',
  STOCK_UNIT_CREATED: 'stock_unit_created',
  STOCK_DASHBOARD_VIEWED: 'stock_dashboard_viewed',

  // ── Meals & cooking ────────────────────────────────────────────────────
  SUGGESTIONS_VIEWED: 'suggestions_viewed',
  MEAL_VIEWED: 'meal_viewed',
  MEAL_GENERATED: 'meal_generated',
  COOK_STARTED: 'cook_started',
  COOK_STEP_ADVANCED: 'cook_step_advanced',
  COOK_ABANDONED: 'cook_abandoned',
  MEAL_COOKED: 'meal_cooked',
  MEAL_FAVOURITED: 'meal_favourited',

  // ── Market list ────────────────────────────────────────────────────────
  MARKET_ITEM_ADDED: 'market_item_added',
  MARKET_ITEM_BOUGHT: 'market_item_bought',
  MARKET_ITEM_REMOVED: 'market_item_removed',
  MARKET_BOUGHT_CLEARED: 'market_bought_cleared',

  // ── Chat ───────────────────────────────────────────────────────────────
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_REPLY_RECEIVED: 'chat_reply_received',
  CHAT_SUGGESTION_OPENED: 'chat_suggestion_opened',
  CHAT_FAILED: 'chat_failed',
  CHAT_CLEARED: 'chat_cleared',

  // ── Week & insights ────────────────────────────────────────────────────
  WEEK_VIEWED: 'week_viewed',
  WEEK_READING_REFRESHED: 'week_reading_refreshed',

  // ── Settings & lifecycle ───────────────────────────────────────────────
  SETTINGS_UPDATED: 'settings_updated',
  NOTIFICATION_PREFERENCE_CHANGED: 'notification_preference_changed',
  ACCOUNT_DELETED: 'account_deleted',
  PRODUCT_TOUR_STEP_VIEWED: 'product_tour_step_viewed',
  PRODUCT_TOUR_DISMISSED: 'product_tour_dismissed',

  // ── Jobs (client-observed) ─────────────────────────────────────────────
  JOB_CANCELLED: 'job_cancelled',
  JOB_RETRIED: 'job_retried',

  // ── Admin console ──────────────────────────────────────────────────────
  ADMIN_LOGGED_IN: 'admin_logged_in',
  ADMIN_RECIPE_CREATED: 'admin_recipe_created',
  ADMIN_RECIPE_STATUS_CHANGED: 'admin_recipe_status_changed',
  ADMIN_RECIPE_DELETED: 'admin_recipe_deleted',
  ADMIN_IMAGE_GENERATED: 'admin_image_generated',
  ADMIN_IMAGE_REVIEWED: 'admin_image_reviewed',
  ADMIN_USER_STATUS_CHANGED: 'admin_user_status_changed',
  ADMIN_EMAIL_SENT: 'admin_email_sent',
  ADMIN_JOB_RETRIED: 'admin_job_retried',
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];
