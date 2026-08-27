import { Repeat } from 'meemaw';

import { cn } from '@shared/utils/cn';

import { POT_ANCHOR } from '../../helpers/pot-choreography';

/**
 * The pot, the fire under it and the steam over it.
 *
 * Everything here is drawn from tokens — the flame is `caution`/`critical`, the
 * steam is white at low alpha, the body is ink. No illustration asset, so the
 * whole rig recolours with the palette and stays legible at any size.
 *
 * The parts carry `data-` hooks rather than animating themselves, because the
 * heat has to be SCRUBBED by scroll position, not looped: the fire is out until
 * the ingredients land, and it climbs as you keep scrolling. A CSS loop can't
 * express "off, then proportional to progress".
 */
export function PotStagePot() {
  return (
    <div
      data-pot-rig
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${POT_ANCHOR.x}%`, top: `${POT_ANCHOR.y}%` }}
    >
      <div className="relative h-[300px] w-[300px]">
        {/* ── Steam. Three plumes, each its own hook so they stagger. ── */}
        <Repeat each={[0, 1, 2]}>
          {(i: number) => (
            <span
              key={i}
              data-pot-steam={i}
              className={cn(
                'absolute bottom-[62%] h-24 w-9 rounded-pill opacity-0 blur-[6px] will-change-transform',
                'bg-gradient-to-t from-white/0 via-white/80 to-white/0',
              )}
              style={{ left: `${34 + i * 22}%` }}
            />
          )}
        </Repeat>

        {/* ── The lid. Lifts and tilts when the dish is served. ── */}
        <div
          data-pot-lid
          className="absolute bottom-[52%] left-1/2 h-6 w-[62%] -translate-x-1/2 rounded-t-pill border-bold border-ink bg-paper-3 will-change-transform"
        >
          <span className="absolute -top-[9px] left-1/2 h-[10px] w-[10px] -translate-x-1/2 rounded-round border-bold border-ink bg-paper" />
        </div>

        {/* ── The body. Rocks on the boil. ── */}
        <div
          data-pot-body
          className="absolute bottom-[20%] left-1/2 h-[38%] w-[64%] -translate-x-1/2 origin-bottom will-change-transform"
        >
          <div className="relative h-full w-full rounded-b-blade-xl rounded-t-blade-sm border-bold border-ink bg-ink shadow-drop-lg">
            {/* The stew surface, seen over the rim. Brightens as it cooks. */}
            <span
              data-pot-broth
              className="absolute inset-x-[6px] top-[6px] h-[22%] rounded-pill bg-dish-fill opacity-0"
            />

            {/* Bubbles — they only exist once the fire is lit. */}
            <Repeat each={[0, 1, 2, 3]}>
              {(i: number) => (
                <span
                  key={i}
                  data-pot-bubble={i}
                  className="absolute top-[14%] h-2 w-2 rounded-round bg-white/70 opacity-0"
                  style={{ left: `${18 + i * 21}%` }}
                />
              )}
            </Repeat>

            {/* Handles — pills, the legal exception. */}
            <span className="absolute -left-[10px] top-[26%] h-3 w-3 rounded-pill border-bold border-ink bg-ink" />
            <span className="absolute -right-[10px] top-[26%] h-3 w-3 rounded-pill border-bold border-ink bg-ink" />
          </div>
        </div>

        {/* ── The fire. Scrubbed from out to roaring. ── */}
        <div
          data-pot-flame
          className="absolute bottom-[9%] left-1/2 h-[16%] w-[46%] -translate-x-1/2 origin-bottom opacity-0 will-change-transform"
        >
          <Repeat each={[0, 1, 2, 3, 4]}>
            {(i: number) => (
              <span
                key={i}
                data-flame-tongue={i}
                className={cn(
                  'absolute bottom-0 w-[18%] rounded-t-pill rounded-b-blade-xs',
                  i % 2 === 0 ? 'bg-caution' : 'bg-critical',
                )}
                style={{ left: `${4 + i * 19}%`, height: `${58 + (i % 3) * 20}%` }}
              />
            )}
          </Repeat>
        </div>

        {/* The hob it stands on. */}
        <div className="absolute bottom-[3%] left-1/2 h-3 w-[76%] -translate-x-1/2 rounded-pill border-bold border-ink bg-paper-3" />

        {/* The splash ring — pinged once per ingredient that lands. */}
        <span
          data-pot-splash
          className="pointer-events-none absolute bottom-[46%] left-1/2 h-16 w-16 -translate-x-1/2 rounded-round border-bold border-sky opacity-0"
        />
      </div>
    </div>
  );
}
