import { EP } from '@shared/constants/endpoints';

import { staffClient } from './staff-client';
import type { WorkflowRow } from './workflows.api';

/**
 * The matching studio.
 *
 * Rules decide what somebody is told to cook. Drafting is free; publishing
 * raises a workflow, so `publish` and `retire` return a WorkflowRow rather
 * than a rule — nothing has changed yet when they resolve.
 */

export type RuleStatus = 'draft' | 'pending' | 'live' | 'retired';
export type RuleMode = 'replace' | 'boost';

export interface RuleRange {
  min?: number | null;
  max?: number | null;
}

export interface RuleWhen {
  allOf?: string[];
  anyOf?: string[];
  noneOf?: string[];
  moods?: string[];
  weights?: string[];
  minutes?: RuleRange;
  hour?: RuleRange;
  weather?: 'rainy' | 'clear' | null;
  cities?: string[];
}

export interface RuleThen {
  meals: string[];
  mode: RuleMode;
  boost?: number | null;
}

export interface RuleBranch {
  id?: string;
  label?: string | null;
  when: RuleWhen;
  then: RuleThen;
}

export interface RuleStats {
  matched: number;
  served: number;
  cooked: number;
  shadowed: number;
}

export interface RuleLayout {
  nodes: { id: string; kind: string; x: number; y: number; ref?: string | null }[];
  edges: { from: string; to: string }[];
}

export interface MatchRule {
  id: string;
  name: string;
  description: string | null;
  status: RuleStatus;
  enabled: boolean;
  shadow: boolean;
  priority: number;
  /** How many clauses it tests. Drives which rule wins when several match. */
  specificity: number;
  when: RuleWhen;
  then: RuleThen;
  branches: RuleBranch[];
  activeFrom: string | null;
  activeUntil: string | null;
  stats: RuleStats;
  layout: RuleLayout | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  /** Live rules whose conditions overlap. The conflict detector. */
  overlaps?: { id: string; name: string; winner: boolean }[];
}

export interface RulePayload {
  name: string;
  description?: string | null;
  priority?: number;
  shadow?: boolean;
  enabled?: boolean;
  when: RuleWhen;
  then: RuleThen;
  branches?: RuleBranch[];
  activeFrom?: string | null;
  activeUntil?: string | null;
  layout?: RuleLayout | null;
}

export interface RuleList {
  rules: MatchRule[];
  liveCount: number;
  /** What the serving index actually holds, so a stale publish is visible. */
  index: { size: number; built_at: string };
}

export interface RuleTestRequest {
  have: string[];
  mood: string;
  weight: string;
  minutes: 15 | 40 | 90;
  hour: number;
  weather?: 'rainy' | 'clear' | null;
  city?: string | null;
  include_drafts?: boolean;
}

export interface RuleTestMatch {
  id: string;
  name: string;
  status: RuleStatus;
  specificity: number;
  branch: string | null;
  meals: string[];
  mode: string;
}

export const matchingApi = {
  list: (params: { status?: RuleStatus; limit?: number } = {}): Promise<RuleList> => {
    const query = new URLSearchParams();
    if (params.status !== undefined) query.set('status', params.status);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();

    return staffClient.get<RuleList>(`${EP.MATCHING.RULES}${qs === '' ? '' : `?${qs}`}`);
  },

  detail: (ruleId: string): Promise<MatchRule> =>
    staffClient.get<MatchRule>(EP.MATCHING.RULE(ruleId)),

  create: (payload: RulePayload): Promise<MatchRule> =>
    staffClient.post<MatchRule>(EP.MATCHING.RULES, payload),

  /**
   * Saves a draft, or raises a publish request for a live rule.
   *
   * Which of the two happens depends on the rule's status, which the server
   * decides — so the return type is the union, and the caller checks `status`
   * to know whether it is looking at a rule or a workflow.
   */
  update: (ruleId: string, payload: RulePayload): Promise<MatchRule | WorkflowRow> =>
    staffClient.put<MatchRule | WorkflowRow>(EP.MATCHING.RULE(ruleId), payload),

  publish: (ruleId: string): Promise<WorkflowRow> =>
    staffClient.post<WorkflowRow>(EP.MATCHING.PUBLISH(ruleId), {}),

  retire: (ruleId: string): Promise<WorkflowRow> =>
    staffClient.post<WorkflowRow>(EP.MATCHING.RETIRE(ruleId), {}),

  /** The kill switch. Not a workflow, deliberately. */
  setEnabled: (ruleId: string, enabled: boolean): Promise<void> =>
    staffClient.patch<void>(EP.MATCHING.ENABLED(ruleId), { enabled }),

  test: (request: RuleTestRequest): Promise<{ matches: RuleTestMatch[] }> =>
    staffClient.post<{ matches: RuleTestMatch[] }>(EP.MATCHING.TEST, request),

  replay: (ruleId: string, hours?: number): Promise<ReplayResult> =>
    staffClient.get<ReplayResult>(
      `${EP.MATCHING.REPLAY(ruleId)}${hours === undefined ? '' : `?hours=${String(hours)}`}`,
    ),

  coverage: (hours?: number): Promise<CoverageResult> =>
    staffClient.get<CoverageResult>(
      `${EP.MATCHING.COVERAGE}${hours === undefined ? '' : `?hours=${String(hours)}`}`,
    ),

  share: (hours?: number): Promise<RuleShare> =>
    staffClient.get<RuleShare>(
      `${EP.MATCHING.SHARE}${hours === undefined ? '' : `?hours=${String(hours)}`}`,
    ),
};

/** One replayed request: what they got, and what the rule would have given. */
export interface ReplayRow {
  mood: string;
  weight: string;
  minutes: number;
  servedMealId: string | null;
  servedName: string | null;
  wouldServeMealId: string | null;
  changed: boolean;
  branch: string | null;
  createdAt: string;
}

export interface ReplayResult {
  ruleId: string;
  ruleName: string;
  examined: number;
  matched: number;
  changed: number;
  alreadyCurated: number;
  sample: ReplayRow[];
  window: { from: string; to: string };
}

export interface CoverageCell {
  mood: string;
  weight: string;
  minutes: number;
  requests: number;
  rules: number;
  winner: string | null;
}

export interface CoverageResult {
  cells: CoverageCell[];
  /** Combinations with real demand and no rule, busiest first. */
  gaps: CoverageCell[];
  totals: { combinations: number; covered: number; requests: number };
  window: { from: string; to: string };
}

export interface RuleShare {
  total: number;
  byRule: number;
  byAi: number;
  byRanker: number;
  /** Percent of verdicts a curated rule decided. */
  share: number;
  window: { from: string; to: string };
}
