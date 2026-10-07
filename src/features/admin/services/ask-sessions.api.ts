import { EP } from '@shared/constants/endpoints';

import { staffClient } from './staff-client';

/**
 * Ask conversations, for the console.
 *
 * The overview answers "is it working". This answers the other question,
 * which nothing could: WHAT DID PEOPLE ACTUALLY SAY. Ask is the one place
 * people talk to the product in their own words, and until now that was the
 * richest signal in the product and completely unreadable.
 */

export interface AskSessionRow {
  id: string;
  ownerId: string | null;
  isGuest: boolean;
  turns: number;
  followUps: number;
  verdictMealId: string | null;
  verdictMealName: string | null;
  /** True when it reached a verdict rather than being abandoned. */
  completed: boolean;
  /** Things they said that were not answers. The most useful column. */
  notes: string[];
  createdAt: string;
}

export interface AskSessionDetail extends AskSessionRow {
  conversation: {
    id: string;
    step: string;
    /** `tap` | `text` | `voice`. */
    source: string;
    /** What they actually said. Null for a tap. */
    rawText: string | null;
    notes: string[];
    answers: {
      kitchenItems: string[];
      mood: string | null;
      weight: string | null;
      minutes: number | null;
    } | null;
    /** Where the turn broke, when it did. */
    failedStage: string | null;
    createdAt: string;
  }[];
  followUpDetail: {
    id: string;
    question: string;
    answer: string;
    mealId: string | null;
    refused: boolean;
    createdAt: string;
  }[];
  carriedNotes: string[];
}

export const adminAskSessionsApi = {
  list: (
    params: { completedOnly?: boolean; limit?: number } = {},
  ): Promise<{ sessions: AskSessionRow[]; total: number }> => {
    const query = new URLSearchParams();
    if (params.completedOnly !== undefined) query.set('completed_only', String(params.completedOnly));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();

    return staffClient.get<{ sessions: AskSessionRow[]; total: number }>(
      `${EP.ADMIN.ASK_SESSIONS}${qs === '' ? '' : `?${qs}`}`,
    );
  },

  detail: (sessionId: string): Promise<AskSessionDetail> =>
    staffClient.get<AskSessionDetail>(EP.ADMIN.ASK_SESSION(sessionId)),
};
