import type { KoboyoIconName } from '@icons';

/**
 * The three explainer slides.
 *
 * The trust claim comes first, before anything is asked — the `onboarding`
 * scene makes that point deliberately, and the order is load-bearing rather
 * than aesthetic.
 */
export interface ExplainerSlide {
  readonly icon: KoboyoIconName;
  readonly title: string;
  readonly body: string;
}

export const EXPLAINER_SLIDES: readonly ExplainerSlide[] = [
  {
    icon: 'cookingPot',
    title: 'Tell me what you have',
    body: 'Type it, say it, or photograph your shelf. No lists to keep, no pantry to maintain — just what is in front of you right now.',
  },
  {
    icon: 'plateJollofRice',
    title: 'Get three meals for tonight',
    body: 'Not a search result. Three things you could actually cook, using mostly what you already have, with Nigerian and West African food treated as first-class.',
  },
  {
    icon: 'tick',
    title: 'You always know who wrote it',
    body: 'A recipe is either tested by a person or written by a model — and it says which, every time. AI quantities are marked as estimates and its timings are padded.',
  },
];

/** How adventurous, in the words the product uses. */
export const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Keep it easy', body: 'Short ingredient lists and few steps.' },
  { value: 'medium', label: 'Somewhere in between', body: 'Most weeknight cooking.' },
  { value: 'anything', label: 'Anything', body: 'Show me everything, including the long ones.' },
] as const;

/**
 * Suggestions offered on the kitchen step, so nobody faces an empty box.
 * Nigerian staples lead, matching what the product is built around.
 */
export const COMMON_INGREDIENTS: readonly string[] = [
  'Rice',
  'Tomatoes',
  'Red onions',
  'Scotch bonnet',
  'Palm oil',
  'Groundnut oil',
  'Chicken',
  'Beef',
  'Eggs',
  'Plantain',
  'Yam',
  'Beans',
  'Spinach',
  'Ugu leaves',
  'Crayfish',
  'Stock cubes',
];
