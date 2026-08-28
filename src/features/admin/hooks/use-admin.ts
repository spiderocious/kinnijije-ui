import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { JOB_LIST_POLL_MS } from '@shared/constants/polling';
import type { ApiError } from '@shared/services/api-client';

import { adminApi, type EmailAudience, type RecipeInput } from '../services/admin.api';

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useBulkRecipes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.bulkRecipes,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useSetRecipeStatus() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { mealId: string; status: 'draft' | 'published' }>({
    mutationFn: ({ mealId, status }) => adminApi.setRecipeStatus(mealId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: adminApi.deleteRecipe,
    onSuccess: async () => {
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
    onSuccess: async () => {
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useResendEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.resendEmail,
    onSuccess: async () => {
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
    onSuccess: async () => {
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
