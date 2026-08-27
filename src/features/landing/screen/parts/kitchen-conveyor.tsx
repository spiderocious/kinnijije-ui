import { useRef } from 'react';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Repeat } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ConveyorStep {
  readonly n: string;
  readonly icon: KoboyoIconName;
  readonly title: string;
  readonly body: string;
}

/** Three steps, because the product genuinely has three. Not padded to four. */
const STEPS: readonly ConveyorStep[] = [
  {
    n: '01',
    icon: 'takingPhotoCamera',
    title: 'Say what you have',
    body: 'Type it, speak it, or photograph the shelf. It reads handwriting on a market list too.',
  },
  {
    n: '02',
    icon: 'sparkle',
    title: 'It finds the dish',
    body: 'Matched against tested Nigerian and West African recipes — ranked by how little you need to buy.',
  },
  {
    n: '03',
    icon: 'cookingPot',
    title: 'Cook it, step by step',
    body: 'Hands-free cook mode with real timers. Works with no signal, because kitchens have bad signal.',
  },
];

/** The belt cargo — loops seamlessly, so the array is deliberately duplicated. */
const BELT: readonly KoboyoIconName[] = [
  'tomato', 'onion', 'chilli', 'egg', 'wheat', 'bagRice', 'seedling', 'milkBottle',
  'fisherman', 'loafBread', 'cheeseServed', 'potStew', 'whisk', 'spatula',
];

/**
 * How it works — three steps, riding in on a conveyor belt.
 *
 * The belt is a genuine infinite marquee (a `-50%` x-tween over a doubled
 * track, so the seam never shows), and it runs FASTER as you scroll past —
 * `ScrollTrigger` drives its timeScale rather than its position. That is what
 * makes it feel like a kitchen line rather than a decorative loop.
 *
 * The three cards deal in on scroll with a rotation that settles to zero, like
 * plates being set down on a pass.
 */
export function KitchenConveyor() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // The belt: one continuous loop, sped up by scroll velocity.
        const belt = gsap.to('[data-belt-track]', {
          xPercent: -50,
          duration: 26,
          ease: 'none',
          repeat: -1,
        });

        ScrollTrigger.create({
          trigger: rootRef.current,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            // Direction-aware: scrolling back up runs the line in reverse.
            const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 260, 5);
            belt.timeScale(self.direction === 1 ? boost : -boost);
          },
        });

        // The plates land.
        gsap.from('[data-step-card]', {
          y: 70,
          rotate: (i: number) => (i % 2 === 0 ? -5 : 5),
          autoAlpha: 0,
          duration: 0.7,
          ease: 'back.out(1.5)',
          stagger: 0.14,
          scrollTrigger: { trigger: '[data-step-grid]', start: 'top 78%' },
        });
      });

      return () => {
        mm.revert();
      };
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} id="how" className="relative overflow-hidden bg-white py-20">
      {/* ── The belt ── */}
      <div className="relative mb-16 border-y-bold border-ink bg-paper-2 py-5">
        <div data-belt-track className="flex w-max gap-4 will-change-transform">
          {/* Doubled, so `-50%` lands exactly on the seam. */}
          <Repeat each={[...BELT, ...BELT] as KoboyoIconName[]}>
            {(icon: KoboyoIconName, i: number) => (
              <span
                key={`${icon}-${i}`}
                className={cn(
                  'grid h-14 w-14 shrink-0 place-items-center rounded-blade-sm border border-ink/15',
                  i % 3 === 0 ? 'bg-dish-fill text-dish-line'
                    : i % 3 === 1 ? 'bg-greens-fill text-greens-line'
                    : 'bg-berry-fill text-berry-line',
                )}
              >
                <KoboyoIcon name={icon} size={26} />
              </span>
            )}
          </Repeat>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
          How it works
        </p>
        <h2 className="mt-3 max-w-[18ch] font-display text-4xl font-extrabold tracking-display sm:text-5xl">
          Three steps. No meal plan to fill in.
        </h2>

        <div data-step-grid className="mt-12 grid gap-5 md:grid-cols-3">
          <Repeat each={STEPS as ConveyorStep[]}>
            {(step: ConveyorStep) => (
              <article
                key={step.n}
                data-step-card
                className="rounded-blade-lg border-bold border-ink bg-white p-6 shadow-drop will-change-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-blade-sm border-bold border-ink bg-sky-soft text-sky-deep">
                    <KoboyoIcon name={step.icon} size={24} />
                  </span>
                  <span className="font-mono text-sm font-bold text-ink-4">{step.n}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-extrabold tracking-display">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.body}</p>
              </article>
            )}
          </Repeat>
        </div>
      </div>
    </section>
  );
}
