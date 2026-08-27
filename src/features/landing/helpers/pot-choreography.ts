import type { KoboyoIconName } from '@icons';

/**
 * The flight plan.
 *
 * Every ingredient in the theatre is one entry here. Keeping the choreography
 * as DATA rather than markup is what makes the timeline readable: the stage
 * file reads as five acts, and the question "where does the onion start?" is
 * answered in one place instead of inside a tween.
 *
 * Coordinates are PERCENTAGES of the stage box, so the whole performance
 * rescales with the viewport and never needs a pixel measurement on resize.
 * `x`/`y` are where the ingredient rests inside the open fridge; `arc` is how
 * high above the straight line its flight bows on the way to the pot.
 */
export interface FlyingIngredient {
  readonly id: string;
  readonly icon: KoboyoIconName;
  readonly label: string;
  /** Resting position in the fridge, as % of the stage box. */
  readonly x: number;
  readonly y: number;
  /** Bow height of the flight path, in % of stage height. Negative arcs over. */
  readonly arc: number;
  /** Spin, in degrees, accumulated over the flight. */
  readonly spin: number;
  /** Which shelf it sits on — drives the door-open stagger. */
  readonly shelf: 0 | 1 | 2;
  /** Tint. Only the three food tints are legal here — never chrome colour. */
  readonly tint: 'dish' | 'greens' | 'berry';
}

/**
 * Eight ingredients — enough to read as a full fridge, few enough that every
 * one is individually legible in flight. They are real things a Nigerian
 * kitchen actually holds, because the product's whole claim is that it knows
 * this food.
 */
export const FRIDGE_INGREDIENTS: readonly FlyingIngredient[] = [
  { id: 'tomato', icon: 'tomato', label: 'Tomatoes', x: 26, y: 30, arc: -26, spin: 320, shelf: 0, tint: 'berry' },
  { id: 'onion', icon: 'onion', label: 'Onions', x: 40, y: 28, arc: -34, spin: -280, shelf: 0, tint: 'dish' },
  { id: 'chilli', icon: 'chilli', label: 'Scotch bonnet', x: 31, y: 45, arc: -20, spin: 420, shelf: 1, tint: 'berry' },
  { id: 'egg', icon: 'egg', label: 'Eggs', x: 44, y: 47, arc: -30, spin: -200, shelf: 1, tint: 'dish' },
  { id: 'wheat', icon: 'wheat', label: 'Grains', x: 25, y: 60, arc: -16, spin: 260, shelf: 2, tint: 'greens' },
  { id: 'bagRice', icon: 'bagRice', label: 'Rice', x: 39, y: 62, arc: -24, spin: -340, shelf: 2, tint: 'dish' },
  { id: 'seedling', icon: 'seedling', label: 'Herbs', x: 33, y: 74, arc: -14, spin: 300, shelf: 2, tint: 'greens' },
  { id: 'milkBottle', icon: 'milkBottle', label: 'Milk', x: 47, y: 72, arc: -22, spin: -240, shelf: 1, tint: 'greens' },
];

/** Where the pot sits, as % of the stage box. Every flight resolves here. */
export const POT_ANCHOR = { x: 72, y: 58 } as const;

/** Tint → the two food-tint tokens. Never chrome. */
export const TINT_CLASS: Record<FlyingIngredient['tint'], string> = {
  dish: 'text-dish-line',
  greens: 'text-greens-line',
  berry: 'text-berry-line',
};

export const TINT_FILL: Record<FlyingIngredient['tint'], string> = {
  dish: 'bg-dish-fill',
  greens: 'bg-greens-fill',
  berry: 'bg-berry-fill',
};
