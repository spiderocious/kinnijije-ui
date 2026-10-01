import { EP } from '@shared/constants/endpoints';

import { staffClient } from './staff-client';

export interface EmailSchedule {
  hour: number;
  minute: number;
  dayOfWeek: number | null;
  timezone: string;
}

export interface EligibilityRules {
  minStockItems: number;
  minCookableMeals: number;
  maxStockItems: number | null;
  activeWithinDays: number | null;
  requireOnboarded: boolean;
  minAccountAgeHours: number;
}

export interface KindOverview {
  kind: string;
  enabled: boolean;
  auto_approve: boolean;
  schedule: EmailSchedule;
  rules: EligibilityRules;
  min_hours_between: number | null;
  next_run: string;
  opted_in: number;
  sent_all_time: number;
  pending_review: number;
  last_batch: {
    id: string;
    status: string;
    drafted: number;
    sent: number;
    failed: number;
    /** Counted by reason — the feedback loop for the eligibility rules. */
    skip_reasons: Record<string, number>;
    created_at: string | null;
  } | null;
}

export interface BatchRow {
  id: string;
  kind: string;
  status: string;
  source: string;
  draft_count: number;
  excluded_count: number;
  edited_count: number;
  sent_count: number;
  failed_count: number;
  skip_reasons: Record<string, number>;
  scheduled_for: string | null;
  created_at: string | null;
}

export interface DraftRow {
  id: string;
  owner_id: string;
  email: string;
  name: string | null;
  subject: string;
  html: string;
  text: string;
  inputs: Record<string, unknown>;
  body_hash: string;
  /** True when somebody else in this batch is getting the same words. */
  is_duplicate: boolean;
  status: string;
  excluded_reason: string | null;
  error: string | null;
}

export interface BatchDetail extends BatchRow {
  approved_by: string | null;
  approved_at: string | null;
  duplicate_groups: { body_hash: string; count: number }[];
  drafts: DraftRow[];
}

export interface UserHit {
  id: string;
  email: string;
  name: string | null;
}

export const campaignsApi = {
  overview: (): Promise<{ kinds: KindOverview[] }> =>
    staffClient.get<{ kinds: KindOverview[] }>(EP.ADMIN.CAMPAIGN_OVERVIEW),

  kinds: (): Promise<string[]> => staffClient.get<string[]>(EP.ADMIN.CAMPAIGN_KINDS),

  batches: (params: { kind?: string; status?: string }): Promise<BatchRow[]> => {
    const query = new URLSearchParams();
    if (params.kind !== undefined && params.kind !== '') query.set('kind', params.kind);
    if (params.status !== undefined && params.status !== '') query.set('status', params.status);
    const suffix = query.toString();
    return staffClient.get<BatchRow[]>(
      `${EP.ADMIN.CAMPAIGN_BATCHES}${suffix === '' ? '' : `?${suffix}`}`,
    );
  },

  batch: (batchId: string): Promise<BatchDetail> =>
    staffClient.get<BatchDetail>(EP.ADMIN.CAMPAIGN_BATCH(batchId)),

  searchUsers: (q: string): Promise<UserHit[]> =>
    staffClient.get<UserHit[]>(`${EP.ADMIN.CAMPAIGN_USERS}?q=${encodeURIComponent(q)}`),

  compose: (kind: string, userIds: string[]): Promise<{ batchId: string; drafted: number }> =>
    staffClient.post<{ batchId: string; drafted: number }>(EP.ADMIN.CAMPAIGN_COMPOSE, {
      kind,
      user_ids: userIds,
    }),

  draftNow: (kind: string): Promise<{ batchId: string; drafted: number }> =>
    staffClient.post<{ batchId: string; drafted: number }>(EP.ADMIN.CAMPAIGN_DRAFT(kind)),

  updateSettings: (kind: string, patch: Record<string, unknown>): Promise<void> =>
    staffClient.patch<void>(EP.ADMIN.CAMPAIGN_SETTINGS(kind), patch),

  editDraft: (draftId: string, changes: { subject?: string; text?: string }): Promise<void> =>
    staffClient.patch<void>(EP.ADMIN.CAMPAIGN_DRAFT_EDIT(draftId), changes),

  excludeDraft: (draftId: string, reason?: string): Promise<void> =>
    staffClient.post<void>(
      EP.ADMIN.CAMPAIGN_DRAFT_EXCLUDE(draftId),
      reason === undefined ? {} : { reason },
    ),

  approve: (batchId: string): Promise<{ queued: number }> =>
    staffClient.post<{ queued: number }>(EP.ADMIN.CAMPAIGN_APPROVE(batchId)),

  discard: (batchId: string): Promise<void> =>
    staffClient.post<void>(EP.ADMIN.CAMPAIGN_DISCARD(batchId)),
};
