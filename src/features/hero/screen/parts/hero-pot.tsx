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
  { id: 'tomato', icon: 'tomato', label: 'Tomatoes', x: 2, y: 18, rotate: -8, tint: 'berry' },
  { id: 'onion', icon: 'onion', label: 'Onions', x: 8, y: 58, rotate: 6, tint: 'dish' },
  { id: 'chilli', icon: 'chilli', label: 'Scotch bonnet', x: 76, y: 12, rotate: 9, tint: 'berry' },
  { id: 'rice', icon: 'bagRice', label: 'Rice', x: 84, y: 52, rotate: -6, tint: 'dish' },
  { id: 'egg', icon: 'egg', label: 'Eggs', x: 20, y: -6, rotate: -12, tint: 'dish' },
  { id: 'herbs', icon: 'seedling', label: 'Efo', x: 64, y: -10, rotate: 10, tint: 'greens' },
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
      {/* ── Steam — three plumes, staggered by the timeline. ── */}
      <Repeat each={[0, 1, 2]}>
        {(i: number) => (
          <span
            key={i}
            data-pot-steam={i}
            className="absolute bottom-[78%] h-28 w-10 rounded-pill bg-gradient-to-t from-white/0 via-white/80 to-white/0 opacity-70 blur-[7px] will-change-transform"
            style={{ left: `${36 + i * 11}%` }}
          />
        )}
      </Repeat>

      {/* ── The blob, peeking over the rim. The sweetness budget, spent here. ── */}
      <span
        data-pot-blob
        className="absolute bottom-[64%] left-[24%] z-0 will-change-transform"
      >
        <Blob name="kinnijije-kitchen" size={72} expression="happy" animate="always" />
      </span>

      {/* ── The lid, resting tilted against the rim. ── */}
      <span
        data-pot-lid
        className="absolute bottom-[58%] right-[6%] z-20 h-7 w-[38%] rotate-12 rounded-t-pill border-bold border-ink bg-paper-3 shadow-drop will-change-transform"
      >
        <span className="absolute -top-[10px] left-1/2 h-[12px] w-[12px] -translate-x-1/2 rounded-round border-bold border-ink bg-paper" />
      </span>

      {/* ── The body. Crops below the viewport edge. ── */}
      <div
        data-pot-body
        className="absolute inset-x-[8%] -bottom-10 top-[32%] z-10 origin-bottom will-change-transform"
      >
        <div className="relative h-full w-full rounded-t-blade-xl border-bold border-ink bg-ink shadow-drop-lg">
          {/* The broth line over the rim. */}
          <span className="absolute inset-x-3 top-3 h-9 rounded-pill bg-dish-fill" />

          {/* Bubbles on the surface. */}
          <Repeat each={[0, 1, 2, 3]}>
            {(i: number) => (
              <span
                key={i}
                data-pot-bubble={i}
                className="absolute top-[26px] h-2.5 w-2.5 rounded-round bg-white/80"
                style={{ left: `${16 + i * 22}%` }}
              />
            )}
          </Repeat>

          {/* Handles. */}
          <span className="absolute -left-3 top-[18%] h-10 w-3 rounded-l-pill border-bold border-ink bg-ink" />
          <span className="absolute -right-3 top-[18%] h-10 w-3 rounded-r-pill border-bold border-ink bg-ink" />

          {/* A glint, so a big ink slab does not read as a hole in the page. */}
          <span className="absolute left-[10%] top-[30%] h-[40%] w-2 rounded-pill bg-white/10" />
        </div>
      </div>

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
