import { Repeat } from 'meemaw';

import { Blob, KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

interface FloatingIngredient {
  readonly id: string;
  readonly icon: KoboyoIconName;
  readonly label: string;
  /** Position as % of the pot rig's box. They hover around the pot, not in a row. */
  readonly x: number;
  readonly y: number;
  readonly rotate: number;
  readonly tint: 'dish' | 'greens' | 'berry';
}

/**
 * What is about to go in. Real things from a real Naija kitchen — the chips
 * are the "address the people" line, written in groceries instead of words.
 */
const INGREDIENTS: readonly FloatingIngredient[] = [
  // Scattered rather than ringed: they read as a kitchen's worth of things,
  // which is the promise, instead of a tidy row of feature bullets.
  { id: 'tomato', icon: 'tomato', label: 'Tomatoes', x: 1, y: 14, rotate: -8, tint: 'berry' },
  { id: 'onion', icon: 'onion', label: 'Onions', x: 6, y: 47, rotate: 6, tint: 'dish' },
  { id: 'chilli', icon: 'chilli', label: 'Scotch bonnet', x: 74, y: 8, rotate: 9, tint: 'berry' },
  { id: 'rice', icon: 'bagRice', label: 'Rice', x: 82, y: 40, rotate: -6, tint: 'dish' },
  { id: 'egg', icon: 'egg', label: 'Eggs', x: 17, y: -4, rotate: -12, tint: 'dish' },
  { id: 'herbs', icon: 'seedling', label: 'Efo', x: 60, y: -8, rotate: 10, tint: 'greens' },
  { id: 'yam', icon: 'basket', label: 'Yam', x: 34, y: 30, rotate: -5, tint: 'dish' },
  { id: 'fish', icon: 'fisherman', label: 'Stockfish', x: 66, y: 62, rotate: 7, tint: 'berry' },
  { id: 'palm', icon: 'bottleWater', label: 'Palm oil', x: 12, y: 78, rotate: -9, tint: 'dish' },
  { id: 'crayfish', icon: 'mortarPestle', label: 'Crayfish', x: 44, y: 84, rotate: 5, tint: 'berry' },
  { id: 'beans', icon: 'bagBeans', label: 'Beans', x: 88, y: 74, rotate: -7, tint: 'greens' },
  { id: 'plantain', icon: 'basketPickles', label: 'Plantain', x: 28, y: 62, rotate: 11, tint: 'greens' },
  { id: 'ugwu', icon: 'seedling', label: 'Ugwu', x: 52, y: 12, rotate: -6, tint: 'greens' },
  { id: 'maggi', icon: 'cylinder', label: 'Stock cubes', x: 90, y: 20, rotate: 8, tint: 'dish' },
];

const TINT: Record<FloatingIngredient['tint'], string> = {
  dish: 'bg-dish-fill text-dish-line',
  greens: 'bg-greens-fill text-greens-line',
  berry: 'bg-berry-fill text-berry-line',
};

/**
 * The pot, cropped by the bottom of the viewport the way the reference page
 * crops its parcel boxes — the dinner is bigger than the screen, which is the
 * point. Drawn entirely from tokens: ink body, dish-fill broth, white steam.
 *
 * Everything animated carries a `data-` hook; the screen's timeline owns all
 * motion. At rest (reduced motion, or before GSAP wakes) this renders complete
 * and steaming-still, so the no-motion render is a finished poster, not a
 * half-loaded one.
 */
export function HeroPot() {
  return (
    <div
      data-pot-rig
      className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-[34vh] min-h-[240px] w-[min(92vw,660px)] will-change-transform"
    >
      {/*
        The pot is gone.

        It was a big ink slab across the bottom of the screen with a beige
        broth line through it, and at the sizes this renders it read as a
        container rather than a pot — a shape that meant nothing sitting under
        the headline. The groceries alone say "your whole kitchen" better than
        a cooking vessel ever did, and they say it without cropping.

        The blob stays. It is the only face on the page.
      */}
      <span
        data-pot-blob
        className="absolute bottom-[38%] left-1/2 z-20 -translate-x-1/2 will-change-transform"
      >
        <Blob name="kinnijije-kitchen" size={88} expression="happy" animate="always" />
      </span>

      {/* ── The floating groceries. ── */}
      <Repeat each={INGREDIENTS as FloatingIngredient[]}>
        {(item: FloatingIngredient) => (
          <span
            key={item.id}
            data-pot-ingredient
            className={cn(
              'absolute z-30 inline-flex items-center gap-1.5 rounded-blade-xs border border-ink px-2.5 py-1.5',
              'text-xs font-extrabold text-ink shadow-drop-sm will-change-transform',
              TINT[item.tint],
            )}
            style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `rotate(${item.rotate}deg)` }}
          >
            <KoboyoIcon name={item.icon} size={15} />
            <span className="text-ink">{item.label}</span>
          </span>
        )}
      </Repeat>
    </div>
  );
}
