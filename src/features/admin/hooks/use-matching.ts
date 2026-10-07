import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EVENTS, analytics } from '@shared/services/analytics';
import type { ApiError } from '@shared/services/api-client';

import {
  matchingApi,
  type CoverageResult,
  type MatchRule,
  type ReplayResult,
  type RuleList,
  type RulePayload,
  type RuleShare,
  type RuleStatus,
  type RuleTestMatch,
  type RuleTestRequest,
} from '../services/matching.api';
import type { WorkflowRow } from '../services/workflows.api';

const MATCHING_KEY = ['admin', 'matching'] as const;

export function useMatchRules(params: { status?: RuleStatus; limit?: number } = {}) {
  return useQuery<RuleList, ApiError>({
    queryKey: [...MATCHING_KEY, params],
    queryFn: () => matchingApi.list(params),
  });
}

export function useMatchRule(ruleId: string) {
  return useQuery<MatchRule, ApiError>({
    queryKey: [...MATCHING_KEY, ruleId],
    queryFn: () => matchingApi.detail(ruleId),
    enabled: ruleId !== '',
  });
}

export function useCreateMatchRule() {
  const queryClient = useQueryClient();

  return useMutation<MatchRule, ApiError, RulePayload>({
    mutationFn: matchingApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MATCHING_KEY });
    },
  });
}

/**
 * Saves a rule.
 *
 * The result is a rule when a draft was saved, and a workflow when a live
 * rule's change was sent for approval — the server decides which, from the
 * rule's status. Callers tell them apart by looking for `kind`, which only a
 * workflow has.
 */
export function useSaveMatchRule() {
  const queryClient = useQueryClient();

  return useMutation<MatchRule | WorkflowRow, ApiError, { ruleId: string; payload: RulePayload }>({
    mutationFn: ({ ruleId, payload }) => matchingApi.update(ruleId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: MATCHING_KEY }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'workflows'] }),
      ]);
    },
  });
}

function useRuleWorkflow(action: (ruleId: string) => Promise<WorkflowRow>) {
  const queryClient = useQueryClient();

  return useMutation<WorkflowRow, ApiError, string>({
    mutationFn: action,
    onSuccess: async (workflow) => {
      analytics.track(EVENTS.ADMIN_WORKFLOW_PROPOSED, {
        workflow_id: workflow.id,
        kind: workflow.kind,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: MATCHING_KEY }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'workflows'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
      ]);
    },
  });
}

export function usePublishMatchRule() {
  return useRuleWorkflow(matchingApi.publish);
}

export function useRetireMatchRule() {
  return useRuleWorkflow(matchingApi.retire);
}

export function useSetRuleEnabled() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { ruleId: string; enabled: boolean }>({
    mutationFn: ({ ruleId, enabled }) => matchingApi.setEnabled(ruleId, enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MATCHING_KEY });
    },
  });
}

/**
 * "Test a kitchen" — which rule fires for a hypothetical request.
 *
 * A mutation rather than a query because it is an explicit action the curator
 * takes, and because caching it by request shape would hide the effect of
 * having just edited a rule.
 */
export function useTestRules() {
  return useMutation<{ matches: RuleTestMatch[] }, ApiError, RuleTestRequest>({
    mutationFn: matchingApi.test,
  });
}

/**
 * Replay against real recorded traffic.
 *
 * A mutation, not a query: it is an explicit "run this now" the curator asks
 * for, and it reads thousands of log rows — firing it automatically on every
 * visit to a rule page would make the page expensive for no reason.
 */
export function useReplayRule() {
  return useMutation<ReplayResult, ApiError, { ruleId: string; hours?: number }>({
    mutationFn: ({ ruleId, hours }) => matchingApi.replay(ruleId, hours),
  });
}

export function useCoverage(hours?: number) {
  return useQuery<CoverageResult, ApiError>({
    queryKey: [...MATCHING_KEY, 'coverage', hours ?? 'default'],
    queryFn: () => matchingApi.coverage(hours),
    // The map moves slowly; it is a week of traffic against the live rules.
    staleTime: 5 * 60 * 1000,
  });
}

export function useRuleShare(hours?: number) {
  return useQuery<RuleShare, ApiError>({
    queryKey: [...MATCHING_KEY, 'share', hours ?? 'default'],
    queryFn: () => matchingApi.share(hours),
    staleTime: 5 * 60 * 1000,
  });
}
