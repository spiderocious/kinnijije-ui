import type { ComponentType } from 'react';

/**
 * The scene registry.
 *
 * A scene is a full composition that proves the system — a real screen, not a
 * specimen. Every scene is reachable two ways:
 *
 *   1. Its own route, `/scenes/<id>`, at a true viewport with no viewer chrome.
 *   2. Inside `/preview`, framed in a phone or desktop mockup for review.
 *
 * Each scene declares which frames it has. Most ship both, because the spec's
 * desktop variants each show something that genuinely does not fit on a phone —
 * the insight column, the seven-day grid, the source photo beside the reads.
 * Where nothing extra fits (market mode), the scene is honestly phone-only.
 */

export type SceneFrame = 'phone' | 'desktop';

export type SceneGroup =
  | 'Site'
  | 'First run'
  | 'Cooking tonight'
  | 'Standing kitchen'
  | 'Capture'
  | 'Market'
  | 'Chat'
  | 'Insights'
  | 'Planning'
  | 'Account'
  | 'Console';

export interface SceneEntry {
  /** URL segment — `/scenes/<id>`. */
  readonly id: string;
  readonly label: string;
  readonly group: SceneGroup;
  /** The Studio HTML this was built from. */
  readonly spec: string;
  /** One line on what the scene proves. */
  readonly summary: string;
  /** Which frames this scene ships. */
  readonly frames: readonly SceneFrame[];
  /** The scene itself. Receives the frame it is being rendered in. */
  readonly Scene: ComponentType<{ frame: SceneFrame }>;
}

/**
 * Ordered the way a new cook meets the product, not the way the design system
 * was built. Someone reading top to bottom walks the actual journey: they land,
 * they are let in, they cook something, and only then do the standing kitchen,
 * the market and the long-tail surfaces mean anything.
 *
 * The console sits last because nobody using the app ever sees it.
 */
export const SCENE_GROUP_ORDER: readonly SceneGroup[] = [
  'Site',
  'First run',
  'Cooking tonight',
  'Standing kitchen',
  'Capture',
  'Market',
  'Chat',
  'Insights',
  'Planning',
  'Account',
  'Console',
];

/** One line on why each group sits where it does, shown on the index. */
export const SCENE_GROUP_BLURB: Readonly<Record<SceneGroup, string>> = {
  Site: 'Before the app — what a visitor sees.',
  'First run': 'Opening it for the very first time.',
  'Cooking tonight': 'The loop: what you have, three meals, cook it, keep it.',
  'Standing kitchen': 'What the app remembers — never stock-taken.',
  Capture: 'Filling the kitchen without typing.',
  Market: 'What to buy, and shopping it back in.',
  Chat: 'Asking questions, answered from your kitchen.',
  Insights: 'What was noticed, with the working shown.',
  Planning: 'Deciding before you are stood in the kitchen.',
  Account: 'Settings, and the app without a connection.',
  Console: 'Running the product. No cook ever sees this.',
};
