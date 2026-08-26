import type { ComponentType } from 'react';

/**
 * The viewer registry. Every component in the library is registered here the
 * moment it is built — "component built" and "component visible in the preview"
 * are one indivisible unit of work.
 *
 * Order in the sidebar comes from this array's order, NOT from a filename
 * prefix. The Studio's HTML specimens are numbered (`01-palette.html`); that
 * numbering is for the spec gallery only and does not carry into shipped code.
 */

export type PreviewGroup =
  | 'Foundation'
  | 'Typography'
  | 'Actions'
  | 'Inputs'
  | 'Status'
  | 'Data display'
  | 'Feedback'
  | 'Navigation'
  | 'Structure'
  | 'Chat'
  | 'Kitchen'
  | 'Recipe & cook'
  | 'Trust & AI'
  | 'Insights'
  | 'Planning'
  | 'Counter'
  | 'Marketing'
  | 'Email'
  | 'Scenes';

export interface PreviewEntry {
  /** URL-safe id — becomes the `?p=` search param. */
  readonly id: string;
  /** Sidebar label. */
  readonly label: string;
  /** Which sidebar group this sits under. */
  readonly group: PreviewGroup;
  /** The part component that renders this specimen. */
  readonly Part: ComponentType;
}

/**
 * The group order in the sidebar. A group with no entries is not rendered, so
 * this can list groups before their components exist.
 */
export const PREVIEW_GROUP_ORDER: readonly PreviewGroup[] = [
  'Foundation',
  'Typography',
  'Actions',
  'Inputs',
  'Status',
  'Data display',
  'Feedback',
  'Navigation',
  'Structure',
  'Chat',
  'Kitchen',
  'Recipe & cook',
  'Trust & AI',
  'Insights',
  'Planning',
  'Counter',
  'Marketing',
  'Email',
  'Scenes',
];
