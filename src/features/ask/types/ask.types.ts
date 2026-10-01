import type { Mood, TimeBudget, Weight } from '@features/decide/types/decide.types';

/**
 * Ask KinniJije.
 *
 * Mirrors the backend's shapes. Deliberately its own file rather than an
 * extension of the decide types: Ask fills the same draft but it is a separate
 * surface, and sharing a types module is how two features quietly become one.
 */

/**
 * The four questions, plus `follow_up`.
 *
 * `follow_up` is not a question — it is talking back to a verdict. It rides the
 * same turn pipeline so a voice note records, uploads and transcribes exactly
 * as it does elsewhere; the server transcribes it and skips the parse.
 */
export const ASK_STEPS = ['kitchen', 'mood', 'weight', 'time', 'place', 'follow_up'] as const;
export type AskStep = (typeof ASK_STEPS)[number];

/**
 * The four that are actually questions.
 *
 * Separate from `AskStep` because `follow_up` has no question to ask — keying
 * the copy by every step would force an entry that never renders, and the type
 * error that revealed this is the system working.
 */
export type AskQuestionStep = Exclude<AskStep, 'follow_up'>;

/** How an answer arrived. Drives the analytics split and the bubble's look. */
export type AskSource = 'tap' | 'text' | 'voice';

export type AskTurnStatus = 'pending' | 'transcribing' | 'parsing' | 'done' | 'failed';

export interface AskAnswers {
  kitchen_items: string[];
  mood: Mood | null;
  weight: Weight | null;
  minutes: TimeBudget | null;
}

export interface AskTurn {
  id: string;
  status: AskTurnStatus;
  step: AskStep;
  source: AskSource;
  /** What they actually said. Shown in full — people need to see we heard them. */
  raw_text: string | null;
  /** Constraints that are not answers: "no pepper", "cooking for two". */
  notes: string[];
  confidence: number | null;
  answers: AskAnswers | null;
  unmatched: string[];
  failed_stage: string | null;
  error_code: string | null;
}

export interface AskSession {
  id: string;
  carried_notes: string[];
  turns: AskTurn[];
}

export interface AskUploadTicket {
  key: string;
  url: string;
  expires_in_seconds: number;
}

/**
 * One line in the transcript.
 *
 * Rendered from the draft and the turns rather than stored — the transcript is
 * a view of state we already hold, which is what keeps the draft the single
 * source of truth.
 */
export interface AskMessage {
  id: string;
  role: 'pot' | 'cook' | 'system';
  text: string;
  /** Set on a cook message, so the bubble can show how it arrived. */
  source?: AskSource;
  /** Which question this belongs to. Tapping it reopens that step. */
  step?: AskQuestionStep;
  /** True while the turn is still being worked out. Drives the clock glyph. */
  pending?: boolean;
  failed?: boolean;
  /** Notes extracted from this message, shown as a dismissible chip row. */
  notes?: string[];
  /** The verdict summary carries a button rather than plain text. */
  kind?: 'text' | 'summary' | 'thinking' | 'exhausted';
}

/** A follow-up about a verdict already given. */
export interface AskFollowUp {
  id: string;
  /** `swap` promotes a meal already on the shortlist; `redecide` re-runs. */
  action: 'reply' | 'swap' | 'redecide';
  text: string;
  meal_id: string | null;
  /** True when the question was outside food and the kitchen. */
  refused: boolean;
  /** How many follow-ups are left in this conversation. */
  remaining: number;
}
