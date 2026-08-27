import { useRef } from 'react';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Repeat } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface TrustPoint {
  readonly icon: KoboyoIconName;
  readonly title: string;
  readonly body: string;
}

/**
 * The honesty section. Every claim here is one the product can actually keep —
 * which is the point: a food app that overclaims gets found out at dinner.
 */
const POINTS: readonly TrustPoint[] = [
  {
    icon: 'chefHat',
    title: 'Tested by people who cook it',
    body: 'Seed recipes are written and cooked by Nigerian home cooks before they are ever suggested. That is the part we will not automate.',
  },
  {
    icon: 'robotForAi',
    title: 'AI recipes say so, every time',
    body: 'When a dish is model-generated it carries a purple mark and its quantities are called estimates. You never have to guess which is which.',
  },
  {
    icon: 'offlineCache',
    title: 'Yours offline',
    body: 'Saved recipes and cook mode run with no signal. A kitchen at the back of the house should not break dinner.',
  },
  {
    icon: 'reportFlag',
    title: 'Wrong? Flag it in one tap',
    body: 'Every step can be reported from cook mode. Flagged recipes go to a person, not a queue nobody reads.',
  },
];

/**
 * Why you can trust the answer.
 *
 * The plates fan in from a stack — a single shared origin with rotation, which
 * reads as dealing cards onto a counter. Cheap, and it makes a static grid feel
 * handled rather than laid out.
 */
export function TrustPlate() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-trust-card]', {
          y: 60,
          rotate: (i: number) => -6 + i * 3,
          autoAlpha: 0,
          duration: 0.66,
          ease: 'back.out(1.4)',
          stagger: 0.1,
          scrollTrigger: { trigger: rootRef.current, start: 'top 76%' },
        });

        // The section heading underline draws itself as you arrive.
        gsap.from('[data-trust-rule]', {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 76%' },
        });
      });

      return () => {
        mm.revert();
      };
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
          Why trust it
        </p>
        <h2 className="mt-3 max-w-[20ch] font-display text-4xl font-extrabold tracking-display sm:text-5xl">
          A recipe you cannot check is just a guess.
        </h2>
        <span data-trust-rule className="mt-5 block h-[5px] w-28 rounded-pill bg-sky" />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <Repeat each={POINTS as TrustPoint[]}>
            {(point: TrustPoint) => (
              <article
                key={point.title}
                data-trust-card
                className="rounded-blade-lg border-bold border-ink bg-paper p-6 shadow-drop will-change-transform"
              >
                <span className="grid h-12 w-12 place-items-center rounded-blade-sm border-bold border-ink bg-white text-ink">
                  <KoboyoIcon name={point.icon} size={24} />
                </span>
                <h3 className="mt-5 font-display text-xl font-extrabold tracking-display">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{point.body}</p>
              </article>
            )}
          </Repeat>
        </div>
      </div>
    </section>
  );
}
