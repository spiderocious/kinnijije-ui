import { useRef } from 'react';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Blob, KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';

import {
  FRIDGE_INGREDIENTS,
  POT_ANCHOR,
  type FlyingIngredient,
} from '../../helpers/pot-choreography';
import { PotStageFridge } from './pot-stage-fridge';
import { PotStagePot } from './pot-stage-pot';
import { PotServedDish } from './pot-served-dish';

gsap.registerPlugin(ScrollTrigger, useGSAP);
// Mobile browsers resize the viewport as the address bar hides — never let that
// re-layout a pinned scene mid-scroll.
ScrollTrigger.config({ ignoreMobileResize: true });

/** Virtual scroll length of the whole performance, in viewport-heights. */
const SCROLL_LENGTH = '+=620%';

/** The theatre runs on a real pointer, a wide viewport and willing motion. */
const STAGE_QUERY = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';

interface PotTheatreProps {
  readonly onStart: () => void;
}

/**
 * The five-act scroll theatre — the page's whole argument, performed.
 *
 * The product's claim is "tell it what is in your kitchen and it tells you what
 * to cook". This sequence IS that claim: a fridge opens, its contents fly into a
 * pot, the pot cooks, a real dish is served. Nobody has to read a feature list
 * to understand it.
 *
 *   Act I    the stare — headline holds, fridge shut, the note mocks you
 *   Act II   the doors swing, the cold light dies, contents shake loose
 *   Act III  eight ingredients arc into the pot, each landing a splash
 *   Act IV   the fire catches, steam climbs, the pot rocks on the boil
 *   Act V    the lid lifts and the dish is served — a real card, real badge
 *
 * Everything is `scrub`bed, so the whole performance is reversible: scroll back
 * up and the dish returns to the pot, the fire goes out, the doors close.
 *
 * Below 1024px, or under `prefers-reduced-motion`, none of this initialises —
 * `matchMedia` simply never runs the callback, the elements keep their authored
 * CSS, and the static composition below is what ships. That is a real fallback,
 * not a degraded one: the fridge, the pot and the dish all read fine at rest.
 */
export function PotTheatre({ onStart }: PotTheatreProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(STAGE_QUERY, () => {
        const stage = rootRef.current?.querySelector<HTMLElement>('[data-stage]');
        if (!stage) return;

        const q = gsap.utils.selector(rootRef);

        /**
         * Flight vector for one ingredient, in pixels, measured from the live
         * stage box. Recomputed on every refresh (`invalidateOnRefresh`), so a
         * resize re-aims the arcs instead of stranding them.
         */
        const flight = (item: FlyingIngredient) => {
          const box = stage.getBoundingClientRect();
          const fridge = stage.querySelector<HTMLElement>('[data-fridge]');
          if (!fridge) return { dx: 0, dy: 0, peak: 0 };
          const fr = fridge.getBoundingClientRect();

          // The ingredient's rest point, in stage pixels.
          const fromX = fr.left - box.left + (fr.width * item.x) / 100;
          const fromY = fr.top - box.top + (fr.height * item.y) / 100;
          // The pot mouth, in stage pixels.
          const toX = (box.width * POT_ANCHOR.x) / 100;
          const toY = (box.height * POT_ANCHOR.y) / 100 - box.height * 0.06;

          return {
            dx: toX - fromX,
            dy: toY - fromY,
            peak: (box.height * item.arc) / 100,
          };
        };

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            end: SCROLL_LENGTH,
            scrub: 0.7,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        /* ─── ACT I — the stare (0 → 6) ─────────────────────────────────── */
        tl.addLabel('stare', 0);
        // The note wobbles: the question you cannot answer.
        tl.to('[data-fridge-note]', { rotate: 4, duration: 2, yoyo: true, repeat: 1 }, 0);
        tl.to('[data-stare-copy]', { autoAlpha: 1, y: 0, duration: 3 }, 0.2);
        // The blob gives up on you and looks away.
        tl.to('[data-stage-blob]', { x: -14, rotate: -8, duration: 3 }, 1.5);
        tl.to('[data-stare-copy]', { autoAlpha: 0, y: -30, duration: 2.5 }, 5.5);

        /* ─── ACT II — the doors (6 → 13) ──────────────────────────────── */
        tl.addLabel('open', 6);
        // The left door leads by a beat — simultaneous swings read as a cabinet.
        tl.to('[data-fridge-door="left"]', { rotateY: -108, duration: 5, ease: 'power2.inOut' }, 6);
        tl.to('[data-fridge-door="right"]', { rotateY: 108, duration: 5, ease: 'power2.inOut' }, 6.7);
        tl.to('[data-fridge-glow]', { autoAlpha: 1, duration: 2 }, 7);
        tl.to('[data-fridge-glow]', { autoAlpha: 0.15, duration: 3 }, 10);
        // Everything inside flinches as the light hits it.
        tl.to(
          '[data-ingredient]',
          { y: -8, duration: 0.8, stagger: { each: 0.12, from: 'random' }, yoyo: true, repeat: 1 },
          9,
        );
        tl.to('[data-open-copy]', { autoAlpha: 1, y: 0, duration: 2.5 }, 9.5);

        /* ─── ACT III — the flight (13 → 27) ───────────────────────────── */
        tl.addLabel('flight', 13);
        FRIDGE_INGREDIENTS.forEach((item, i) => {
          const at = 13 + i * 1.35;
          const el = q(`[data-ingredient="${item.id}"]`);

          // Horizontal travel is linear; the bow comes from the vertical pair.
          tl.to(el, { x: () => flight(item).dx, duration: 3.4, ease: 'none' }, at);
          tl.to(
            el,
            { y: () => flight(item).peak, duration: 1.5, ease: 'power2.out' },
            at,
          );
          tl.to(
            el,
            { y: () => flight(item).dy, duration: 1.9, ease: 'power2.in' },
            at + 1.5,
          );
          tl.to(el, { rotate: item.spin, duration: 3.4 }, at);
          // It disappears INTO the pot, not in front of it.
          tl.to(el, { scale: 0.35, autoAlpha: 0, duration: 0.55 }, at + 2.95);

          // Each landing pings the splash ring and knocks the pot.
          tl.fromTo(
            '[data-pot-splash]',
            { scale: 0.5, autoAlpha: 0.9 },
            { scale: 1.8, autoAlpha: 0, duration: 1 },
            at + 3.1,
          );
          tl.to(
            '[data-pot-body]',
            { scaleY: 0.94, scaleX: 1.05, duration: 0.3, yoyo: true, repeat: 1 },
            at + 3.1,
          );
        });
        tl.to('[data-open-copy]', { autoAlpha: 0, y: -24, duration: 2 }, 15);
        tl.to('[data-flight-copy]', { autoAlpha: 1, y: 0, duration: 2.5 }, 16);
        // The broth fills as the ingredients go in.
        tl.to('[data-pot-broth]', { autoAlpha: 1, duration: 8 }, 15);
        // The empty fridge closes itself; its job is done.
        tl.to('[data-fridge-door="left"]', { rotateY: -14, duration: 4 }, 24);
        tl.to('[data-fridge-door="right"]', { rotateY: 14, duration: 4 }, 24);
        tl.to('[data-fridge]', { autoAlpha: 0.25, scale: 0.94, duration: 4 }, 24);

        /* ─── ACT IV — the cook (27 → 38) ──────────────────────────────── */
        tl.addLabel('cook', 27);
        tl.to('[data-flight-copy]', { autoAlpha: 0, y: -24, duration: 2 }, 27);
        // The pot takes centre stage now the fridge has gone.
        tl.to('[data-pot-rig]', { x: '-16%', scale: 1.18, duration: 6, ease: 'power2.inOut' }, 27);

        // The fire catches — and keeps climbing while you scroll.
        tl.to('[data-pot-flame]', { autoAlpha: 1, duration: 2 }, 28);
        tl.to('[data-pot-flame]', { scaleY: 1.35, duration: 8 }, 29);
        FRIDGE_INGREDIENTS.slice(0, 5).forEach((_, i) => {
          // Each tongue flickers on its own clock, so the fire never pulses as
          // one block — that is the difference between fire and a glowing shape.
          tl.to(
            `[data-flame-tongue="${i}"]`,
            {
              scaleY: 1.5 + (i % 3) * 0.25,
              duration: 0.7 + i * 0.13,
              yoyo: true,
              repeat: 9,
              ease: 'sine.inOut',
            },
            29 + i * 0.2,
          );
        });

        // The boil: the body rocks, the bubbles rise.
        tl.to(
          '[data-pot-body]',
          { rotate: 1.6, duration: 0.9, yoyo: true, repeat: 9, ease: 'sine.inOut' },
          30,
        );
        [0, 1, 2, 3].forEach((i) => {
          tl.fromTo(
            `[data-pot-bubble="${i}"]`,
            { y: 0, autoAlpha: 0, scale: 0.6 },
            { y: -22, autoAlpha: 1, scale: 1.1, duration: 1.1, yoyo: true, repeat: 5 },
            30 + i * 0.45,
          );
        });

        // Steam — three plumes, offset, rising and fading as they go.
        [0, 1, 2].forEach((i) => {
          tl.fromTo(
            `[data-pot-steam="${i}"]`,
            { y: 20, autoAlpha: 0, scaleY: 0.6 },
            { y: -120, autoAlpha: 0.85, scaleY: 1.25, duration: 3.2, yoyo: true, repeat: 3 },
            29.5 + i * 0.9,
          );
        });

        tl.to('[data-cook-copy]', { autoAlpha: 1, y: 0, duration: 2.5 }, 30);
        tl.to('[data-cook-copy]', { autoAlpha: 0, y: -24, duration: 2 }, 37);

        /* ─── ACT V — the serve (38 → 50) ──────────────────────────────── */
        tl.addLabel('serve', 38);
        // The lid comes off and flips away.
        tl.to('[data-pot-lid]', { y: -170, rotate: -38, autoAlpha: 0, duration: 4, ease: 'power2.out' }, 38);
        tl.to('[data-pot-flame]', { scaleY: 0.7, autoAlpha: 0.55, duration: 4 }, 40);

        // The dish rises OUT of the pot — same anchor, so it reads as emerging.
        tl.fromTo(
          '[data-served-dish]',
          { y: 150, scale: 0.5, autoAlpha: 0, rotate: -6 },
          { y: 0, scale: 1, autoAlpha: 1, rotate: 0, duration: 6, ease: 'back.out(1.4)' },
          39.5,
        );
        tl.to('[data-pot-rig]', { y: 120, autoAlpha: 0.35, duration: 5 }, 41);
        // The badge stamps on, a beat after the card lands.
        tl.fromTo(
          '[data-served-badge]',
          { scale: 0, rotate: -14 },
          { scale: 1, rotate: 0, duration: 2, ease: 'back.out(2.2)' },
          44,
        );
        tl.fromTo(
          '[data-served-line]',
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 2, stagger: 0.6 },
          45,
        );
        tl.fromTo(
          '[data-served-cta]',
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, duration: 2.5 },
          47,
        );
        tl.to('[data-stage-blob]', { x: 0, rotate: 0, scale: 1.15, duration: 3 }, 45);
      });

      return () => {
        mm.revert();
      };
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef}>
      <section
        data-stage
        aria-label="How Kinnijije turns what is in your fridge into dinner"
        className="relative h-dvh w-full overflow-hidden bg-paper"
      >
        {/* The grain that keeps a flat palette from reading as a wireframe. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:radial-gradient(var(--line)_1px,transparent_1px)] [background-size:26px_26px]"
        />

        <div className="relative mx-auto h-full w-full max-w-[1500px]">
          <PotStageFridge />
          <PotStagePot />
          <PotServedDish onStart={onStart} />

          {/* ── The narration. One line per act, each fading for the next. ── */}
          <div className="pointer-events-none absolute inset-x-0 top-[9%] z-10 flex flex-col items-center px-6 text-center">
            <StageLine hook="data-stare-copy" tone="ink">
              <span className="block font-display text-4xl font-extrabold tracking-display sm:text-5xl">
                Stop staring at the fridge.
              </span>
              <span className="mt-3 block max-w-[46ch] text-lg text-ink-2">
                You have food in there. You just cannot see dinner in it.
              </span>
            </StageLine>

            <StageLine hook="data-open-copy" tone="ink">
              <span className="block font-display text-4xl font-extrabold tracking-display sm:text-5xl">
                So tell it what you have.
              </span>
              <span className="mt-3 block max-w-[46ch] text-lg text-ink-2">
                Type it, say it, or photograph the shelf. Eight things is plenty.
              </span>
            </StageLine>

            <StageLine hook="data-flight-copy" tone="ink">
              <span className="block font-display text-4xl font-extrabold tracking-display sm:text-5xl">
                Everything goes in the pot.
              </span>
              <span className="mt-3 block max-w-[46ch] text-lg text-ink-2">
                No shopping trip. No &ldquo;you will also need&rdquo; list of six things you do not own.
              </span>
            </StageLine>

            <StageLine hook="data-cook-copy" tone="ink">
              <span className="block font-display text-4xl font-extrabold tracking-display sm:text-5xl">
                Nigerian food, first.
              </span>
              <span className="mt-3 block max-w-[46ch] text-lg text-ink-2">
                Jollof, egusi, efo riro, stew — tested by people who cook it, not scraped.
              </span>
            </StageLine>
          </div>

          {/* The mascot watches the whole performance from the corner. */}
          <span
            data-stage-blob
            className="absolute bottom-[6%] left-[7%] z-10 will-change-transform"
          >
            <Blob name="kinnijije-kitchen" size={78} expression="thinking" animate="always" />
          </span>

          {/* Scroll affordance — the theatre is worthless if nobody scrolls. */}
          <span
            data-scroll-hint
            className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-pill border border-line-2 bg-white/80 px-4 py-2 text-xs font-extrabold uppercase tracking-overline text-ink-3 backdrop-blur animate-bob"
          >
            <KoboyoIcon name="chevronDown" size={14} />
            Keep scrolling
          </span>
        </div>
      </section>
    </div>
  );
}

interface StageLineProps {
  readonly hook: string;
  readonly tone: 'ink';
  readonly children: React.ReactNode;
}

/**
 * One act's narration. Absolutely stacked so the lines cross-fade in place
 * rather than pushing each other around, and hidden at rest so the timeline
 * owns every reveal.
 */
function StageLine({ hook, children }: StageLineProps) {
  return (
    <span
      {...{ [hook]: true }}
      className={cn(
        'absolute inset-x-0 flex flex-col items-center px-6',
        // Hidden at rest — but only where the timeline will actually run.
        'opacity-0 translate-y-6',
        'motion-reduce:opacity-100 motion-reduce:translate-y-0',
        'max-lg:opacity-100 max-lg:translate-y-0 max-lg:relative max-lg:mb-10',
      )}
    >
      {children}
    </span>
  );
}
