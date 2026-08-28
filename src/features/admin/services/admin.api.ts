import { EP } from '@shared/constants/endpoints';
import { apiClient } from '@shared/services/api-client';

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
export interface AdminOverview {
  users: {
    total: number;
    by_status: Record<string, number>;
    by_role: Record<string, number>;
    onboarded: number;
    new_this_week: number;
  };
  meals: { total: number; published: number; draft: number; seed: number; ai: number };
  activity: {
    cooked_all_time: number;
    cooked_this_week: number;
    favourites: number;
    chat_messages: number;
    chat_mocked: number;
  };
  kitchen: { stock_items: number; market_items: number; market_unbought: number; files: number };
  jobs: { total: number; by_status: Record<string, number>; failed_last_day: number };
  ai: {
    calls: number;
    failed: number;
    calls_last_day: number;
    total_tokens: number;
    avg_duration_ms: number;
    by_prompt: { prompt_id: string; calls: number; failed: number; tokens: number }[];
  };
}

// ── Recipes ──────────────────────────────────────────────────────────
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
  status: 'sent' | 'failed' | 'suppressed';
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
function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const out = search.toString();
  return out.length > 0 ? `?${out}` : '';
}

export const adminApi = {
  setupState: (): Promise<SetupState> => apiClient.get<SetupState>(EP.ADMIN.SETUP),
  bootstrap: (): Promise<BootstrapResult> => apiClient.post<BootstrapResult>(EP.ADMIN.SETUP),

  overview: (): Promise<AdminOverview> => apiClient.get<AdminOverview>(EP.ADMIN.OVERVIEW),

  recipes: (params: Record<string, string | number | undefined>): Promise<Paged<AdminRecipeRow>> =>
    apiClient.get<Paged<AdminRecipeRow>>(`${EP.ADMIN.RECIPES}${qs(params)}`),
  recipe: (mealId: string): Promise<AdminRecipeDetail> =>
    apiClient.get<AdminRecipeDetail>(EP.ADMIN.RECIPE(mealId)),
  createRecipe: (input: RecipeInput): Promise<{ id: string; matched: number; unmatched: string[] }> =>
    apiClient.post(EP.ADMIN.RECIPES, input),
  bulkRecipes: (recipes: RecipeInput[]): Promise<BulkResult> =>
    apiClient.post<BulkResult>(EP.ADMIN.RECIPES_BULK, { recipes }),
  setRecipeStatus: (mealId: string, status: 'draft' | 'published'): Promise<void> =>
    apiClient.patch<void>(EP.ADMIN.RECIPE_STATUS(mealId), { status }),
  deleteRecipe: (mealId: string): Promise<void> => apiClient.delete<void>(EP.ADMIN.RECIPE(mealId)),

  users: (params: Record<string, string | number | undefined>): Promise<Paged<AdminUserRow>> =>
    apiClient.get<Paged<AdminUserRow>>(`${EP.ADMIN.USERS}${qs(params)}`),
  user: (userId: string): Promise<AdminUserDetail> =>
    apiClient.get<AdminUserDetail>(EP.ADMIN.USER(userId)),
  setUserStatus: (userId: string, status: string): Promise<void> =>
    apiClient.patch<void>(EP.ADMIN.USER_STATUS(userId), { status }),
  setUserRole: (userId: string, role: string): Promise<void> =>
    apiClient.patch<void>(EP.ADMIN.USER_ROLE(userId), { role }),

  aiLogs: (params: Record<string, string | number | undefined>): Promise<Paged<AiLogRow>> =>
    apiClient.get<Paged<AiLogRow>>(`${EP.ADMIN.AI}${qs(params)}`),
  aiLog: (logId: string): Promise<AiLogDetail> => apiClient.get<AiLogDetail>(EP.ADMIN.AI_LOG(logId)),
  aiPromptIds: (): Promise<string[]> => apiClient.get<string[]>(EP.ADMIN.AI_PROMPT_IDS),

  emails: (params: Record<string, string | number | undefined>): Promise<Paged<EmailLogRow>> =>
    apiClient.get<Paged<EmailLogRow>>(`${EP.ADMIN.EMAILS}${qs(params)}`),
  email: (emailId: string): Promise<EmailLogDetail> =>
    apiClient.get<EmailLogDetail>(EP.ADMIN.EMAIL(emailId)),
  emailKinds: (): Promise<string[]> => apiClient.get<string[]>(EP.ADMIN.EMAIL_KINDS),
  emailSettings: (): Promise<EmailSetting[]> =>
    apiClient.get<EmailSetting[]>(EP.ADMIN.EMAIL_SETTINGS),
  setEmailKind: (kind: string, enabled: boolean, reason?: string): Promise<void> =>
    apiClient.patch<void>(EP.ADMIN.EMAIL_SETTING(kind), { enabled, reason }),
  previewAudience: (
    audience: EmailAudience,
    userIds?: string[],
  ): Promise<{ count: number; sample: string[] }> =>
    apiClient.post(EP.ADMIN.EMAIL_PREVIEW, { audience, user_ids: userIds }),
  sendEmail: (input: {
    audience: EmailAudience;
    user_ids?: string[];
    subject: string;
    body: string;
  }): Promise<{ sent: number; failed: number }> => apiClient.post(EP.ADMIN.EMAIL_SEND, input),
  resendEmail: (emailId: string): Promise<{ id: string; delivered: boolean }> =>
    apiClient.post(EP.ADMIN.EMAIL_RESEND(emailId)),

  jobs: (params: Record<string, string | number | undefined>): Promise<Paged<AdminJobRow>> =>
    apiClient.get<Paged<AdminJobRow>>(`${EP.ADMIN.JOBS}${qs(params)}`),
  job: (jobId: string): Promise<AdminJobDetail> => apiClient.get<AdminJobDetail>(EP.ADMIN.JOB(jobId)),
  jobTypes: (): Promise<string[]> => apiClient.get<string[]>(EP.ADMIN.JOB_TYPES),
  retryJob: (jobId: string, force = false): Promise<AdminJobDetail> =>
    apiClient.post<AdminJobDetail>(EP.ADMIN.JOB_RETRY(jobId), { force }),
  cancelJob: (jobId: string): Promise<AdminJobDetail> =>
    apiClient.post<AdminJobDetail>(EP.ADMIN.JOB_CANCEL(jobId)),
};
