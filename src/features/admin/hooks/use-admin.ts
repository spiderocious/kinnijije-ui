import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { JOB_LIST_POLL_MS } from '@shared/constants/polling';
import { EVENTS, analytics } from '@shared/services/analytics';
import type { ApiError } from '@shared/services/api-client';

import {
  adminApi,
  type EmailAudience,
  type MailProvider,
  type RecipeInput,
} from '../services/admin.api';

const ADMIN_KEY = ['admin'] as const;

export function useSetupState() {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'setup'],
    queryFn: adminApi.setupState,
    // Whether setup is still open changes exactly once, ever.
    staleTime: Infinity,
    retry: false,
  });
}

export function useBootstrap() {
  return useMutation({ mutationFn: adminApi.bootstrap });
}

export function useOverview() {
  return useQuery({ queryKey: [...ADMIN_KEY, 'overview'], queryFn: adminApi.overview });
}

// ── Recipes ──────────────────────────────────────────────────────────
export function useAdminRecipes(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'recipes', params],
    queryFn: () => adminApi.recipes(params),
  });
}

export function useAdminRecipe(mealId: string | null) {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'recipe', mealId],
    queryFn: () => adminApi.recipe(mealId ?? ''),
    enabled: mealId !== null,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string; matched: number; unmatched: string[] }, ApiError, RecipeInput>({
    mutationFn: adminApi.createRecipe,
    onSuccess: async (result) => {
      analytics.track(EVENTS.ADMIN_RECIPE_CREATED, {
        meal_id: result.id,
        source: 'manual',
        matched: result.matched,
        unmatched_count: result.unmatched.length,
      });

      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useBulkRecipes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.bulkRecipes,
    onSuccess: async () => {
      // Catalogue growth, and whether bulk import is doing the real work.
      analytics.track(EVENTS.ADMIN_RECIPE_CREATED, { source: 'bulk' });

      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useSetRecipeStatus() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { mealId: string; status: 'draft' | 'published' }>({
    mutationFn: ({ mealId, status }) => adminApi.setRecipeStatus(mealId, status),
    onSuccess: async (_result, variables) => {
      // Editorial throughput — how fast drafts reach published.
      analytics.track(EVENTS.ADMIN_RECIPE_STATUS_CHANGED, {
        meal_id: variables.mealId,
        to_status: variables.status,
      });

      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: adminApi.deleteRecipe,
    onSuccess: async (_result, mealId) => {
      analytics.track(EVENTS.ADMIN_RECIPE_DELETED, { meal_id: mealId });

      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

/** The recipes list's multi-select publish / unpublish. */
export function useSetRecipesStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    { changed: number; unchanged: number; missing: string[] },
    ApiError,
    { ids: string[]; status: 'draft' | 'published' }
  >({
    mutationFn: ({ ids, status }) => adminApi.setRecipesStatus(ids, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

/** The recipes list's multi-select delete. */
export function useDeleteRecipes() {
  const queryClient = useQueryClient();
  return useMutation<{ deleted: number; missing: string[] }, ApiError, string[]>({
    mutationFn: adminApi.deleteRecipes,
    onSuccess: async (result) => {
      analytics.track(EVENTS.ADMIN_RECIPE_DELETED, { count: result.deleted, bulk: true });

      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

// ── Users ────────────────────────────────────────────────────────────
export function useAdminUsers(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'users', params],
    queryFn: () => adminApi.users(params),
  });
}

export function useAdminUser(userId: string | null) {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'user', userId],
    queryFn: () => adminApi.user(userId ?? ''),
    enabled: userId !== null,
  });
}

export function useSetUserStatus() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { userId: string; status: string }>({
    mutationFn: ({ userId, status }) => adminApi.setUserStatus(userId, status),
    onSuccess: async (_result, variables) => {
      // Moderation volume, audited.
      analytics.track(EVENTS.ADMIN_USER_STATUS_CHANGED, {
        target_user_id: variables.userId,
        to_status: variables.status,
      });

      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { userId: string; role: string }>({
    mutationFn: ({ userId, role }) => adminApi.setUserRole(userId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

// ── AI audit ─────────────────────────────────────────────────────────
export function useAiLogs(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'ai', params],
    queryFn: () => adminApi.aiLogs(params),
  });
}

export function useAiLog(logId: string | null) {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'ai-log', logId],
    queryFn: () => adminApi.aiLog(logId ?? ''),
    enabled: logId !== null,
  });
}

export function useAiPromptIds() {
  return useQuery({ queryKey: [...ADMIN_KEY, 'prompt-ids'], queryFn: adminApi.aiPromptIds });
}

// ── Features ─────────────────────────────────────────────────────────
export function useFeatureFlags() {
  return useQuery({ queryKey: [...ADMIN_KEY, 'features'], queryFn: adminApi.features });
}

export function useSetFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flag, enabled, reason }: { flag: string; enabled: boolean; reason?: string }) =>
      adminApi.setFeature(flag, enabled, reason),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_KEY }),
        // The consumer app reads the same flags — drop its copy too, or the
        // operator's own browser keeps showing the feature they just switched off.
        queryClient.invalidateQueries({ queryKey: ['config', 'features'] }),
      ]);
    },
  });
}

// ── Email ────────────────────────────────────────────────────────────
export function useAdminEmails(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'emails', params],
    queryFn: () => adminApi.emails(params),
  });
}

export function useAdminEmail(emailId: string | null) {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'email', emailId],
    queryFn: () => adminApi.email(emailId ?? ''),
    enabled: emailId !== null,
  });
}

export function useEmailSettings() {
  return useQuery({ queryKey: [...ADMIN_KEY, 'email-settings'], queryFn: adminApi.emailSettings });
}

export function useSetEmailKind() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, enabled, reason }: { kind: string; enabled: boolean; reason?: string }) =>
      adminApi.setEmailKind(kind, enabled, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

/** Which provider is sending, and whether it can. */
export function useMailProvider() {
  return useQuery({ queryKey: [...ADMIN_KEY, 'mail-provider'], queryFn: adminApi.mailProvider });
}

export function useSetMailProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, reason }: { provider: MailProvider; reason?: string }) =>
      adminApi.setMailProvider(provider, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

/**
 * Send one real email through a provider without switching to it.
 *
 * Deliberately invalidates: the test lands in the log like any other send, and
 * the operator wants to see it there.
 */
export function useTestMailProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, to }: { provider: MailProvider; to: string }) =>
      adminApi.testMailProvider(provider, to),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useEmailKinds() {
  return useQuery({ queryKey: [...ADMIN_KEY, 'email-kinds'], queryFn: adminApi.emailKinds });
}

export function usePreviewAudience() {
  return useMutation({
    mutationFn: ({ audience, userIds }: { audience: EmailAudience; userIds?: string[] }) =>
      adminApi.previewAudience(audience, userIds),
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.sendEmail,
    onSuccess: async (_result, variables) => {
      // Broadcast volume, to read against opt-outs and deletions in the days
      // after it goes out.
      const input = variables as { kind?: string; user_ids?: string[] };
      analytics.track(EVENTS.ADMIN_EMAIL_SENT, {
        kind: input.kind ?? 'unknown',
        recipient_count: input.user_ids?.length ?? null,
        is_resend: false,
      });
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useResendEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.resendEmail,
    onSuccess: async () => {
      analytics.track(EVENTS.ADMIN_EMAIL_SENT, { kind: 'resend', is_resend: true });

      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

// ── Jobs ─────────────────────────────────────────────────────────────
export function useAdminJobs(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'jobs', params],
    queryFn: () => adminApi.jobs(params),
    // A queue board is worth refreshing on its own; nobody is waiting on one
    // specific outcome here, so it moves at reading pace.
    refetchInterval: JOB_LIST_POLL_MS,
  });
}

export function useAdminJob(jobId: string | null) {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'job', jobId],
    queryFn: () => adminApi.job(jobId ?? ''),
    enabled: jobId !== null,
    refetchInterval: (query) => (query.state.data?.finished_at === null ? 3000 : false),
  });
}

export function useJobTypes() {
  return useQuery({ queryKey: [...ADMIN_KEY, 'job-types'], queryFn: adminApi.jobTypes });
}

export function useRetryJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, force }: { jobId: string; force?: boolean }) =>
      adminApi.retryJob(jobId, force ?? false),
    onSuccess: async (_result, variables) => {
      // Which job types need babysitting.
      analytics.track(EVENTS.ADMIN_JOB_RETRIED, {
        job_id: variables.jobId,
        forced: variables.force ?? false,
      });

      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.cancelJob,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

/** The decide flow, aggregated. Refetched on focus: it moves during the day. */
export function useDecideOverview(days?: number) {
  return useQuery({
    queryKey: ['admin', 'decide', 'overview', days ?? 14],
    queryFn: () => adminApi.decideOverview(days),
    staleTime: 30_000,
  });
}

/** The raw log: every submission and every answer. */
export function useDecideLogs(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['admin', 'decide', 'logs', params],
    queryFn: () => adminApi.decideLogs(params),
    staleTime: 15_000,
  });
}

/** One decision, in full. */
export function useDecideLog(logId: string) {
  return useQuery({
    queryKey: ['admin', 'decide', 'log', logId],
    queryFn: () => adminApi.decideLog(logId),
    enabled: logId.length > 0,
  });
}

/** Cost, health and volume across every prompt. */
export function useAiStats(days?: number) {
  return useQuery({
    queryKey: ['admin', 'ai', 'stats', days ?? 30],
    queryFn: () => adminApi.aiStats(days),
    staleTime: 60_000,
  });
}
