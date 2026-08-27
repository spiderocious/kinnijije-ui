import { Repeat } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';

import {
  FRIDGE_INGREDIENTS,
  TINT_CLASS,
  TINT_FILL,
  type FlyingIngredient,
} from '../../helpers/pot-choreography';

/**
 * The fridge — act one's whole set.
 *
 * Drawn rather than illustrated, so it obeys the blade (one sharp corner, three
 * round) like every other surface in the system and inherits the palette. Two
 * doors hinge from the OUTER edges, which is why each carries its own
 * `transform-origin` and its own `data-` hook: the timeline swings them
 * independently and the left one has to lead by a beat, or it reads as a
 * cabinet rather than a fridge.
 *
 * The ingredients live inside the cavity at their choreographed rest positions.
 * The stage timeline lifts them out of here by id — this component never
 * animates them itself.
 */
export function PotStageFridge() {
  return (
    <div
      data-fridge
      className="absolute left-[6%] top-[8%] h-[84%] w-[46%] [perspective:1400px]"
    >
      {/* The cavity — what the doors reveal. Cold, dim, slightly blue. */}
      <div className="absolute inset-0 overflow-hidden rounded-blade-xl border-bold border-ink bg-[#DCE9F1] shadow-drop-lg">
        {/* Shelves. Three hairlines, because the ingredients sit on three rows. */}
        <Repeat each={[34, 52, 70]}>
          {(top: number) => (
            <span
              key={top}
              data-fridge-shelf
              className="absolute left-3 right-3 h-[3px] rounded-pill bg-ink/15"
              style={{ top: `${top}%` }}
            />
          )}
        </Repeat>

        {/* The cold glow that dies when the doors open. */}
        <span
          data-fridge-glow
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-sky-100/40 opacity-0"
        />

        {/* The ingredients, at rest. Lifted out by the timeline, by id. */}
        <Repeat each={FRIDGE_INGREDIENTS as FlyingIngredient[]}>
          {(item: FlyingIngredient) => (
            <span
              key={item.id}
              data-ingredient={item.id}
              className={cn(
                'absolute grid h-[13%] w-[17%] place-items-center rounded-blade-sm border border-ink/15',
                'will-change-transform',
                TINT_FILL[item.tint],
                TINT_CLASS[item.tint],
              )}
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
            >
              <KoboyoIcon name={item.icon} size={30} />
            </span>
          )}
        </Repeat>
      </div>

      {/* ── The doors. Each hinges on its own outer edge. ── */}
      <div
        data-fridge-door="left"
        className={cn(
          'absolute inset-y-0 left-0 w-1/2 rounded-l-blade-xl border-bold border-ink',
          'bg-gradient-to-br from-paper to-paper-3 shadow-drop-lg',
          '[transform-origin:left_center] [transform-style:preserve-3d] will-change-transform',
        )}
      >
        {/* Handle — a pill, one of the two legal exceptions to the blade. */}
        <span className="absolute right-3 top-1/2 h-[22%] w-[7px] -translate-y-1/2 rounded-pill bg-ink/30" />
        <span className="absolute left-5 top-6 h-[2px] w-10 rounded-pill bg-ink/10" />
      </div>

      <div
        data-fridge-door="right"
        className={cn(
          'absolute inset-y-0 right-0 w-1/2 rounded-r-blade-xl border-bold border-ink',
          'bg-gradient-to-bl from-paper to-paper-3 shadow-drop-lg',
          '[transform-origin:right_center] [transform-style:preserve-3d] will-change-transform',
        )}
      >
        <span className="absolute left-3 top-1/2 h-[22%] w-[7px] -translate-y-1/2 rounded-pill bg-ink/30" />

        {/* The magnet note — the "staring at the fridge" gag, made literal. */}
        <span
          data-fridge-note
          className="absolute right-6 top-[16%] rotate-[-6deg] rounded-blade-xs border border-ink bg-caution-soft px-3 py-2 text-xs font-extrabold text-caution-onsoft shadow-drop-sm"
        >
          what&apos;s for dinner?
        </span>
      </div>
    </div>
  );
}
