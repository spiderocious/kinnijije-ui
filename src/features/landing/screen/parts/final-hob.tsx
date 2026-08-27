import { useRef } from 'react';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Repeat } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { Button } from '@ui/primitives';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface FinalHobProps {
  readonly onStart: () => void;
}

/**
 * The close — the burner lights under the last ask.
 *
 * The section is ink-dark, which is the only place on the page that goes dark,
 * so the CTA cannot be missed. The ring of flame tongues ignites on arrival and
 * then idles, each on its own clock so the fire never pulses as one block.
 *
 * `onDark` on the button is the design system's own on-dark treatment — the
 * contract that exists precisely so a dark surface does not force a bespoke
 * button. This is that prop earning its keep.
 */
export function FinalHob({ onStart }: FinalHobProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: rootRef.current, start: 'top 72%' },
        });

        // Ignition — the ring catches, then settles.
        tl.from('[data-hob-ring]', { scale: 0.4, autoAlpha: 0, duration: 0.7, ease: 'back.out(2)' });
        tl.from(
          '[data-hob-tongue]',
          { scaleY: 0, transformOrigin: 'bottom center', duration: 0.5, stagger: 0.045, ease: 'back.out(2.4)' },
          '-=0.35',
        );
        tl.from('[data-hob-copy]', { y: 30, autoAlpha: 0, duration: 0.6, stagger: 0.12 }, '-=0.3');

        // The idle burn, forever after.
        gsap.to('[data-hob-tongue]', {
          scaleY: (i: number) => 1.25 + (i % 3) * 0.2,
          transformOrigin: 'bottom center',
          duration: (i: number) => 0.6 + (i % 4) * 0.16,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: { each: 0.08, from: 'random' },
        });

        // The pot above it never stops bobbing.
        gsap.to('[data-hob-pot]', {
          y: -8,
          duration: 2.1,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });

      return () => {
        mm.revert();
      };
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-ink py-24">
      {/* The heat haze behind everything. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-round bg-caution/10 blur-[90px]"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        {/* The burner. */}
        <div className="relative mb-10 h-32 w-40">
          <span
            data-hob-pot
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-ink-inv will-change-transform"
          >
            <KoboyoIcon name="cookingPot" size={64} alone />
          </span>

          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-end gap-1">
            <Repeat each={[0, 1, 2, 3, 4, 5, 6]}>
              {(i: number) => (
                <span
                  key={i}
                  data-hob-tongue
                  className={i % 2 === 0 ? 'w-3 rounded-t-pill bg-caution' : 'w-3 rounded-t-pill bg-critical'}
                  style={{ height: `${16 + (i % 3) * 9}px` }}
                />
              )}
            </Repeat>
          </div>

          <span
            data-hob-ring
            className="absolute bottom-0 left-1/2 h-4 w-36 -translate-x-1/2 rounded-pill border-bold border-ink-inv/30 bg-ink-inv/10"
          />
        </div>

        <h2
          data-hob-copy
          className="font-display text-4xl font-extrabold leading-tight tracking-display text-ink-inv sm:text-6xl"
        >
          Dinner is already in your kitchen.
        </h2>
        <p data-hob-copy className="mt-5 max-w-[46ch] text-lg text-ink-inv/75">
          Free to start. No card, no meal plan to fill in, no six-item shopping list before you can
          cook anything.
        </p>

        <div data-hob-copy className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
          <Button size="lg" onDark onClick={onStart}>
            Start cooking tonight
            <KoboyoIcon name="arrowRight" size={18} />
          </Button>
          <span className="text-sm font-semibold text-ink-inv/55">
            Takes about a minute to set up.
          </span>
        </div>
      </div>
    </section>
  );
}
