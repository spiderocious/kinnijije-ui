import { EP } from '@shared/constants/endpoints';
import { staffClient } from './staff-client';

// ── Setup ────────────────────────────────────────────────────────────
export interface SetupState {
  needs_setup: boolean;
}

export interface BootstrapResult {
  email: string;
  /** Shown ONCE. There is no second copy anywhere. */
  password: string;
  user_id: string;
}

// ── Dashboard ────────────────────────────────────────────────────────
/** One point on a sparkline. `date` is `YYYY-MM-DD`, UTC. */
export interface DailyCount {
  date: string;
  count: number;
}

export interface AdminOverview {
  users: {
    total: number;
    by_status: Record<string, number>;
    by_role: Record<string, number>;
    onboarded: number;
    new_this_week: number;
    /** Percent change on the previous seven days. Null when there is no base. */
    trend: number | null;
    daily: DailyCount[];
  };
  meals: {
    total: number;
    published: number;
    draft: number;
    seed: number;
    ai: number;
    with_photo: number;
  };
  activity: {
    cooked_all_time: number;
    cooked_this_week: number;
    favourites: number;
    chat_messages: number;
    chat_mocked: number;
    cooked_trend: number | null;
  };
  kitchen: { stock_items: number; market_items: number; market_unbought: number; files: number };
  jobs: { total: number; by_status: Record<string, number>; failed_last_day: number };
  decide: {
    decisions: number;
    today: number;
    distinct_visitors: number;
    empty_verdicts: number;
    ai_framed: number;
    empty_today: number;
    empty_yesterday: number;
    this_week: number;
    previous_week: number;
    rejected: number;
    daily: DailyCount[];
    trend: number | null;
    saved: number;
  };
  ai: {
    calls: number;
    failed: number;
    calls_last_day: number;
    total_tokens: number;
    avg_duration_ms: number;
    median_duration_ms: number;
    p95_duration_ms: number;
    tokens_last_day: number;
    median_tokens: number;
    by_prompt: { prompt_id: string; calls: number; failed: number; tokens: number }[];
  };
}

// ── Recipes ──────────────────────────────────────────────────────────
/** Ask KinniJije, as the console sees it. */
export interface AskOverview {
  sessions: {
    total: number;
    completed: number;
    today: number;
    this_week: number;
    previous_week: number;
    trend: number | null;
    daily: DailyCount[];
  };
  input: { tap: number; text: number; voice: number };
  turns: { total: number; failed: number; parsed: number; median_confidence: number | null };
  voice: {
    attempted: number;
    transcribed: number;
    failed: number;
    median_ms: number | null;
    p95_ms: number | null;
  };
  notes: {
    sessions_with_notes: number;
    total_notes: number;
    top: { note: string; count: number }[];
  };
}

export interface AdminRecipeRow {
  id: string;
  name: string;
  slug: string;
  source: 'seed' | 'ai';
  status: 'draft' | 'published';
  difficulty: string;
  cook_time_minutes: number;
  serves: number;
  ingredient_count: number;
  /** How many of its ingredients we can actually match against a kitchen. */
  matched_ingredients: number;
  step_count: number;
  created_at: string;
}

export interface AdminRecipeDetail extends Omit<AdminRecipeRow, 'ingredient_count' | 'matched_ingredients' | 'step_count'> {
  cuisines: string[];
  what_makes_it_good: string;
  description: string;
  hero_icon: string | null;
  ingredients: {
    catalogue_id: string | null;
    name: string;
    quantity: number | null;
    unit: string | null;
    optional: boolean;
    matched: boolean;
  }[];
  steps: { index: number; heading: string; description: string; estMinutes: number }[];
  ingredient_keys: string[];
  created_by: string | null;
  updated_at: string;
}

export interface RecipeInput {
  name: string;
  source?: 'seed' | 'ai';
  status?: 'draft' | 'published';
  cuisines?: string[];
  difficulty: 'easy' | 'medium' | 'involved';
  cook_time_minutes: number;
  serves: number;
  what_makes_it_good: string;
  description?: string;
  ingredients: { name: string; quantity?: number | null; unit?: string | null; optional?: boolean }[];
  steps: { index: number; heading: string; description: string; est_minutes: number }[];
}

/** What the recipe form offers, so choices are real rather than free text. */
export interface RecipeFormOptions {
  /** The whole ingredient catalogue. A name outside it will not match. */
  ingredients: { id: string; name: string; aliases: string[]; default_unit: string }[];
  units: { id: string; label: string; abbr: string }[];
  /** Cuisine tags recipes already use. */
  cuisines: string[];
  difficulties: string[];
}

export interface BulkResult {
  created: number;
  failed: number;
  results: { index: number; name: string; ok: boolean; id?: string; error?: string; unmatched?: string[] }[];
}

// ── Users ────────────────────────────────────────────────────────────
export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  has_onboarded: boolean;
  email_verified: boolean;
  created_at: string;
}

export interface AdminUserDetail {
  account: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
    has_onboarded: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
  };
  totals: {
    stock_items: number;
    market_items: number;
    cooked: number;
    favourites: number;
    chat_messages: number;
    files: number;
    ai_calls: number;
    ai_failed: number;
    ai_tokens: number;
  };
  stock: { id: string; name: string; catalogue_id: string | null; quantity: number; unit: string; updated_at: string }[];
  market: { id: string; name: string; quantity: number; unit: string; bought: boolean; created_at: string }[];
  cooked: { meal_id: string; meal_name: string; cooked_at: string }[];
  jobs: { id: string; type: string; status: string; created_at: string }[];
}

// ── AI audit ─────────────────────────────────────────────────────────
export interface AiLogRow {
  id: string;
  prompt_id: string;
  provider: string;
  model: string;
  owner_id: string | null;
  ok: boolean;
  error: string | null;
  parse_error: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  duration_ms: number;
  metrics: unknown;
  created_at: string;
}

export interface AiLogDetail extends AiLogRow {
  system_prompt: string;
  user_prompt: string;
  image_refs: string[];
  raw_response: string | null;
  parsed: boolean;
}

// ── Jobs ─────────────────────────────────────────────────────────────
export interface AdminJobRow {
  id: string;
  type: string;
  status: string;
  owner_id: string | null;
  progress: number;
  progress_label: string | null;
  attempts: number;
  max_attempts: number;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface AdminJobDetail extends AdminJobRow {
  payload: unknown;
  result: unknown;
  cancel_requested_at: string | null;
  lease_expires_at: string | null;
}

// ── Email ────────────────────────────────────────────────────────────
export type EmailAudience =
  | 'selected'
  | 'all'
  | 'active'
  | 'pending'
  | 'onboarded'
  | 'not_onboarded';

export interface EmailLogRow {
  id: string;
  kind: string;
  to: string;
  owner_id: string | null;
  subject: string;
  status: 'sent' | 'failed' | 'suppressed' | 'blocked';
  /** Which provider handled it. Null for older rows and for blocked sends. */
  provider: MailProvider | null;
  provider_id: string | null;
  error: string | null;
  /** Set when an operator sent it by hand. */
  sent_by: string | null;
  /** Points at the original when this send is a repeat. */
  resend_of: string | null;
  created_at: string;
}

export interface EmailLogDetail extends EmailLogRow {
  html: string;
  text: string;
}

export interface FeatureFlagRow {
  key: string;
  label: string;
  /** What actually stops happening. Written next to the switch. */
  when_on: string;
  when_off: string;
  enabled: boolean;
  updated_by: string | null;
  reason: string | null;
  updated_at: string | null;
}

export type MailProvider = 'resend' | 'cloudflare';

export interface MailProviderState {
  provider: MailProvider;
  /** False when nobody has chosen and this is the server's default. */
  chosen: boolean;
  /** Which providers have credentials. The switch warns from this. */
  configured: Record<MailProvider, boolean>;
  /** Whether the ACTIVE provider can actually send. */
  live: boolean;
  updated_by: string | null;
  reason: string | null;
  updated_at: string | null;
}

export interface EmailSetting {
  kind: string;
  enabled: boolean;
  updated_by: string | null;
  reason: string | null;
  updated_at: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
}

/** Only the params that are actually set reach the wire. */
export function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const out = search.toString();
  return out.length > 0 ? `?${out}` : '';
}

/** Aggregated view of the decide flow. Every figure is a count of real rows. */
export interface DecideOverview {
  totals: {
    decisions: number;
    today: number;
    last_7_days: number;
    distinct_visitors: number;
    empty_verdicts: number;
    ai_framed: number;
    deterministic: number;
    median_duration_ms: number;
  };
  moods: { value: string; count: number }[];
  weights: { value: string; count: number }[];
  minutes: { value: number; count: number }[];
  top_ingredients: { name: string; count: number }[];
  top_verdicts: { name: string; count: number }[];
  top_rejected: { meal_id: string; name: string | null; count: number }[];
  cities: { name: string; count: number }[];
  daily: { date: string; count: number }[];
  empty_kitchen_rate: number;
}

export interface DecideLogRow {
  id: string;
  request_id: string;
  visitor: string;
  kitchen_items: string[];
  kitchen_skipped: boolean;
  mood: string;
  weight: string;
  minutes: number;
  city: string | null;
  rejected: string[];
  verdict_meal_id: string | null;
  verdict_name: string | null;
  verdict_score: number | null;
  pool_size: number;
  provenance: string;
  why: string | null;
  duration_ms: number;
  ai_fallback_reason: string | null;
  created_at: string | null;
}

export interface AiStats {
  days: number;
  totals: {
    calls: number;
    failed: number;
    rejected: number;
    tokens_in: number;
    tokens_out: number;
    estimated_usd: number | null;
    p50_ms: number;
    p95_ms: number;
  };
  daily: { date: string; calls: number; failed: number; tokens: number }[];
  by_prompt: {
    prompt_id: string;
    calls: number;
    failed: number;
    rejected: number;
    tokens: number;
    estimated_usd: number | null;
    p95_ms: number;
    avg_confidence: number | null;
    avg_ambiguity: number | null;
  }[];
  by_model: { model: string; calls: number; tokens: number; estimated_usd: number | null }[];
  by_provider: { provider: string; calls: number }[];
}

export const adminApi = {
  aiStats: (days?: number): Promise<AiStats> =>
    staffClient.get<AiStats>(
      days === undefined ? EP.ADMIN.AI_STATS : `${EP.ADMIN.AI_STATS}?days=${String(days)}`,
    ),

  decideOverview: (days?: number): Promise<DecideOverview> =>
    staffClient.get<DecideOverview>(
      days === undefined ? EP.ADMIN.DECIDE_OVERVIEW : `${EP.ADMIN.DECIDE_OVERVIEW}?days=${String(days)}`,
    ),

  decideLogs: (params: Record<string, string | number | undefined>): Promise<Paged<DecideLogRow>> =>
    staffClient.get<Paged<DecideLogRow>>(`${EP.ADMIN.DECIDE_LOGS}${qs(params)}`),

  decideLog: (logId: string): Promise<DecideLogRow> =>
    staffClient.get<DecideLogRow>(EP.ADMIN.DECIDE_LOG(logId)),

  setupState: (): Promise<SetupState> => staffClient.get<SetupState>(EP.ADMIN.SETUP),
  bootstrap: (): Promise<BootstrapResult> => staffClient.post<BootstrapResult>(EP.ADMIN.SETUP),

  overview: (): Promise<AdminOverview> => staffClient.get<AdminOverview>(EP.ADMIN.OVERVIEW),

  /** Ask KinniJije. Server-computed, so an ad blocker cannot hide a regression. */
  askOverview: (): Promise<AskOverview> => staffClient.get<AskOverview>(EP.ADMIN.ASK_OVERVIEW),

  recipes: (params: Record<string, string | number | undefined>): Promise<Paged<AdminRecipeRow>> =>
    staffClient.get<Paged<AdminRecipeRow>>(`${EP.ADMIN.RECIPES}${qs(params)}`),
  recipe: (mealId: string): Promise<AdminRecipeDetail> =>
    staffClient.get<AdminRecipeDetail>(EP.ADMIN.RECIPE(mealId)),
  createRecipe: (input: RecipeInput): Promise<{ id: string; matched: number; unmatched: string[] }> =>
    staffClient.post(EP.ADMIN.RECIPES, input),
  recipeFormOptions: (): Promise<RecipeFormOptions> =>
    staffClient.get<RecipeFormOptions>(EP.ADMIN.RECIPE_FORM_OPTIONS),
  /** A full replace of the recipe's content. The slug and images are kept. */
  updateRecipe: (
    mealId: string,
    input: RecipeInput,
  ): Promise<{ id: string; matched: number; unmatched: string[] }> =>
    staffClient.put(EP.ADMIN.RECIPE(mealId), input),
  bulkRecipes: (recipes: RecipeInput[]): Promise<BulkResult> =>
    staffClient.post<BulkResult>(EP.ADMIN.RECIPES_BULK, { recipes }),
  setRecipeStatus: (mealId: string, status: 'draft' | 'published'): Promise<void> =>
    staffClient.patch<void>(EP.ADMIN.RECIPE_STATUS(mealId), { status }),
  deleteRecipe: (mealId: string): Promise<void> => staffClient.delete<void>(EP.ADMIN.RECIPE(mealId)),

  /** Publish or unpublish several. `unchanged` were already in that state. */
  setRecipesStatus: (
    ids: string[],
    status: 'draft' | 'published',
  ): Promise<{ changed: number; unchanged: number; missing: string[] }> =>
    staffClient.post(EP.ADMIN.RECIPES_STATUS, { ids, status }),

  /** Several at once. `missing` are ids somebody else already deleted. */
  deleteRecipes: (ids: string[]): Promise<{ deleted: number; missing: string[] }> =>
    staffClient.post(EP.ADMIN.RECIPES_DELETE, { ids }),

  users: (params: Record<string, string | number | undefined>): Promise<Paged<AdminUserRow>> =>
    staffClient.get<Paged<AdminUserRow>>(`${EP.ADMIN.USERS}${qs(params)}`),
  user: (userId: string): Promise<AdminUserDetail> =>
    staffClient.get<AdminUserDetail>(EP.ADMIN.USER(userId)),
  setUserStatus: (userId: string, status: string): Promise<void> =>
    staffClient.patch<void>(EP.ADMIN.USER_STATUS(userId), { status }),
  setUserRole: (userId: string, role: string): Promise<void> =>
    staffClient.patch<void>(EP.ADMIN.USER_ROLE(userId), { role }),

  aiLogs: (params: Record<string, string | number | undefined>): Promise<Paged<AiLogRow>> =>
    staffClient.get<Paged<AiLogRow>>(`${EP.ADMIN.AI}${qs(params)}`),
  aiLog: (logId: string): Promise<AiLogDetail> => staffClient.get<AiLogDetail>(EP.ADMIN.AI_LOG(logId)),
  aiPromptIds: (): Promise<string[]> => staffClient.get<string[]>(EP.ADMIN.AI_PROMPT_IDS),

  features: (): Promise<FeatureFlagRow[]> =>
    staffClient.get<FeatureFlagRow[]>(EP.ADMIN.FEATURES),
  setFeature: (flag: string, enabled: boolean, reason?: string): Promise<void> =>
    staffClient.patch<void>(EP.ADMIN.FEATURE(flag), { enabled, reason }),

  emails: (params: Record<string, string | number | undefined>): Promise<Paged<EmailLogRow>> =>
    staffClient.get<Paged<EmailLogRow>>(`${EP.ADMIN.EMAILS}${qs(params)}`),
  email: (emailId: string): Promise<EmailLogDetail> =>
    staffClient.get<EmailLogDetail>(EP.ADMIN.EMAIL(emailId)),
  emailKinds: (): Promise<string[]> => staffClient.get<string[]>(EP.ADMIN.EMAIL_KINDS),
  emailSettings: (): Promise<EmailSetting[]> =>
    staffClient.get<EmailSetting[]>(EP.ADMIN.EMAIL_SETTINGS),
  setEmailKind: (kind: string, enabled: boolean, reason?: string): Promise<void> =>
    staffClient.patch<void>(EP.ADMIN.EMAIL_SETTING(kind), { enabled, reason }),
  mailProvider: (): Promise<MailProviderState> =>
    staffClient.get<MailProviderState>(EP.ADMIN.EMAIL_PROVIDER),
  setMailProvider: (
    provider: MailProvider,
    reason?: string,
  ): Promise<{ provider: MailProvider; live: boolean }> =>
    staffClient.put(EP.ADMIN.EMAIL_PROVIDER, { provider, reason }),
  testMailProvider: (
    provider: MailProvider,
    to: string,
  ): Promise<{ id: string; delivered: boolean; error: string | null }> =>
    staffClient.post(EP.ADMIN.EMAIL_PROVIDER_TEST, { provider, to }),
  previewAudience: (
    audience: EmailAudience,
    userIds?: string[],
  ): Promise<{ count: number; sample: string[] }> =>
    staffClient.post(EP.ADMIN.EMAIL_PREVIEW, { audience, user_ids: userIds }),
  sendEmail: (input: {
    audience: EmailAudience;
    user_ids?: string[];
    subject: string;
    body: string;
  }): Promise<{ sent: number; failed: number }> => staffClient.post(EP.ADMIN.EMAIL_SEND, input),
  resendEmail: (emailId: string): Promise<{ id: string; delivered: boolean }> =>
    staffClient.post(EP.ADMIN.EMAIL_RESEND(emailId)),

  jobs: (params: Record<string, string | number | undefined>): Promise<Paged<AdminJobRow>> =>
    staffClient.get<Paged<AdminJobRow>>(`${EP.ADMIN.JOBS}${qs(params)}`),
  job: (jobId: string): Promise<AdminJobDetail> => staffClient.get<AdminJobDetail>(EP.ADMIN.JOB(jobId)),
  jobTypes: (): Promise<string[]> => staffClient.get<string[]>(EP.ADMIN.JOB_TYPES),
  retryJob: (jobId: string, force = false): Promise<AdminJobDetail> =>
    staffClient.post<AdminJobDetail>(EP.ADMIN.JOB_RETRY(jobId), { force }),
  cancelJob: (jobId: string): Promise<AdminJobDetail> =>
    staffClient.post<AdminJobDetail>(EP.ADMIN.JOB_CANCEL(jobId)),
};
