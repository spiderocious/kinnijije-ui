import { useRef } from 'react';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Link } from '@tanstack/react-router';
import { Repeat } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { HERO_BODY, HERO_HEADLINE } from '@ui/site';

import { HeroBackdrop } from './parts/hero-backdrop';
import { HeroPot } from './parts/hero-pot';

gsap.registerPlugin(useGSAP);

/**
 * `/hero` — the social-OG image, rendered live. One viewport, no scroll, no
 * app chrome: a poster that happens to breathe.
 *
 * The layout is the reference page's shape — wordmark row, giant centred
 * display headline, one CTA, the subject cropped by the bottom edge — spoken
 * in this system's voice: sky ground instead of pink, the blade instead of
 * pillow corners, a pot of stew instead of parcel boxes.
 *
 * The headline and body come from `@ui/site` because every hero states the
 * same promise in the same words — a poster is not exempt from that contract.
 *
 * Motion is an entrance (once) plus idle loops, all inside a reduced-motion
 * `matchMedia`. The authored CSS is the *finished* frame: with motion off, or
 * before GSAP wakes, the page is a complete still poster — which is exactly
 * what an OG render has to be.
 */
export default function HeroScreen() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        /* ── The entrance — everything arrives in under two seconds. ── */
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.from('[data-backdrop-shape]', { autoAlpha: 0, scale: 0.85, duration: 0.9, stagger: 0.08 }, 0);
        tl.from('[data-hero-topbar]', { y: -26, autoAlpha: 0, duration: 0.5 }, 0.15);
        tl.from('[data-hero-eyebrow]', { scale: 0.6, autoAlpha: 0, duration: 0.45, ease: 'back.out(2)' }, 0.3);
        tl.from(
          '[data-hero-word]',
          { y: 56, autoAlpha: 0, rotate: 4, duration: 0.7, stagger: 0.07, ease: 'back.out(1.6)' },
          0.4,
        );
        tl.from('[data-hero-body]', { y: 24, autoAlpha: 0, duration: 0.5 }, 0.9);
        tl.from('[data-hero-cta]', { y: 26, autoAlpha: 0, scale: 0.92, duration: 0.5, ease: 'back.out(1.8)' }, 1.05);

        // The pot rises from below the fold; its court assembles around it.
        tl.from('[data-pot-rig]', { y: 300, duration: 0.9, ease: 'power4.out' }, 0.55);
        tl.from('[data-pot-lid]', { y: -90, rotate: 60, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.4)' }, 1.1);
        tl.from('[data-pot-blob]', { y: 80, autoAlpha: 0, duration: 0.6, ease: 'back.out(2)' }, 1.35);
        tl.from(
          '[data-pot-ingredient]',
          { scale: 0, autoAlpha: 0, duration: 0.5, stagger: { each: 0.07, from: 'random' }, ease: 'back.out(2.2)' },
          1.15,
        );

        /* ── The idle loops — begin after the entrance owns nothing. ──
           Every loop is delayed past the entrance so no two tweens ever
           fight over the same property on the same element. */
        const IDLE = 2.3;

        // The backdrop drifts, barely.
        gsap.utils.toArray<HTMLElement>('[data-backdrop-shape]').forEach((el, i) => {
          gsap.to(el, {
            rotate: '+=4',
            x: i % 2 === 0 ? '+=14' : '-=14',
            y: '-=10',
            duration: 7 + i * 1.4,
            delay: IDLE,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        });

        // Steam: rise, thin, vanish, again — each plume on its own clock.
        gsap.utils.toArray<HTMLElement>('[data-pot-steam]').forEach((el, i) => {
          gsap.set(el, { y: 24, autoAlpha: 0, scaleY: 0.7 });
          gsap.to(el, {
            keyframes: [
              { y: -44, autoAlpha: 0.8, scaleY: 1, duration: 1.2, ease: 'sine.out' },
              { y: -128, autoAlpha: 0, scaleY: 1.3, duration: 1.5, ease: 'sine.in' },
            ],
            delay: 1.7 + i * 0.9,
            repeat: -1,
            repeatDelay: 0.25,
          });
        });

        // The boil, gently.
        gsap.to('[data-pot-body]', {
          rotate: 1.1,
          duration: 1.6,
          delay: IDLE,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
        gsap.utils.toArray<HTMLElement>('[data-pot-bubble]').forEach((el, i) => {
          gsap.to(el, {
            y: -9,
            scale: 1.25,
            autoAlpha: 0.4,
            duration: 0.9 + (i % 3) * 0.25,
            delay: IDLE + i * 0.3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        });

        // The lid settles and resettles; the blob bobs; the groceries hover.
        gsap.to('[data-pot-lid]', { rotate: 9, duration: 2.4, delay: IDLE, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to('[data-pot-blob]', { y: -7, duration: 2.1, delay: IDLE, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.utils.toArray<HTMLElement>('[data-pot-ingredient]').forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 === 0 ? -12 : 10,
            duration: 2 + (i % 4) * 0.4,
            delay: IDLE + i * 0.18,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        });
      });

      return () => {
        mm.revert();
      };
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="relative flex h-dvh flex-col overflow-hidden bg-sky-200 font-sans text-ink"
    >
      <HeroBackdrop />

      {/* ── The wordmark row. ── */}
      <header
        data-hero-topbar
        className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10"
      >
        <span className="inline-flex items-center gap-2.5">
          <span className="grid h-11 w-11 place-items-center rounded-blade-sm border-bold border-ink bg-white text-sky shadow-drop-sm">
            <KoboyoIcon name="cookingPot" size={24} />
          </span>
          <span className="font-display text-2xl font-extrabold tracking-display">kinnijije</span>
        </span>

        <span className="inline-flex items-center gap-2 rounded-pill border-bold border-ink bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-overline shadow-drop-sm">
          <KoboyoIcon name="marketStall" size={15} className="text-sky" />
          Made for Naija kitchens
        </span>
      </header>

      {/* ── The address. ── */}
      <main className="relative z-10 flex flex-1 flex-col items-center px-6 pt-[4vh] text-center sm:pt-[6vh]">
        <span
          data-hero-eyebrow
          className="inline-flex items-center gap-2 rounded-pill bg-white/70 px-4 py-1.5 text-xs font-extrabold uppercase tracking-overline text-sky-on backdrop-blur-sm"
        >
          <KoboyoIcon name="sparkle" size={14} className="text-sky" />
          Jollof, egusi, efo riro — your food, first
        </span>

        <h1 className="mt-5 max-w-[14ch] font-display text-5xl font-extrabold leading-[1.04] tracking-display sm:text-6xl md:text-[clamp(3.5rem,7vw,6rem)]">
          <Repeat each={HERO_HEADLINE.split(' ')}>
            {(word: string, i: number) => (
              <span key={`${word}-${i}`} className="inline-block overflow-visible">
                <span data-hero-word className="inline-block will-change-transform">
                  {word}
                </span>{' '}
              </span>
            )}
          </Repeat>
        </h1>

        <p data-hero-body className="mt-5 max-w-[48ch] text-md text-ink-2 sm:text-lg">
          {HERO_BODY}
        </p>

        <div data-hero-cta className="mt-8 flex flex-col items-center gap-3">
          <Link
            to={ROUTES.LOGIN}
            className="group inline-flex h-ctrl-lg items-center gap-2.5 rounded-blade border-bold border-ink bg-sky px-9 font-display text-lg font-extrabold text-sky-onbase shadow-drop-sky transition-all duration-press ease-kj hover:bg-sky-deep active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Get started
            <KoboyoIcon
              name="arrowRight"
              size={19}
              className="transition-transform duration-base ease-kj group-hover:translate-x-1"
            />
          </Link>
          <span className="text-xs font-bold text-ink-3">
            Free to start · takes about a minute
          </span>
        </div>
      </main>

      <HeroPot />
    </div>
  );
}
