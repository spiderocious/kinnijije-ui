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
  | 'Core'
  | 'Standing kitchen'
  | 'Capture'
  | 'Chat'
  | 'Insights'
  | 'Planning'
  | 'Console'
  | 'Site';

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

export const SCENE_GROUP_ORDER: readonly SceneGroup[] = [
  'Core',
  'Standing kitchen',
  'Capture',
  'Chat',
  'Insights',
  'Planning',
  'Console',
  'Site',
];
