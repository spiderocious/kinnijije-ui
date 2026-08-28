import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { ChipInput } from '@ui/inputs';
import { SiteSection } from '../site-sections';

/**
 * Header and hero — the two families that decide whether anyone scrolls.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview-site/s01-header.html
 *                                                               s02-hero.html
 *
 * **Every hero variant states the SAME promise in the same words.** Only the
 * amount of evidence beside it changes. That is what stops a marketing site
 * drifting into claims the product does not make.
 */

/** The one promise. Shared by every variant, by construction. */
export const HERO_HEADLINE = 'Stop staring at the fridge.';
export const HERO_BODY =
  'Tell it what is in your kitchen and it will tell you what to cook tonight — Nigerian and West African food, first.';

/* ---------- Header — 6 variants ---------- */

export type HeaderVariant =
  | 'transparent'
  | 'solid'
  | 'centred'
  | 'with-cta'
  | 'mega'
  | 'mobile-drawer';

export interface SiteHeaderVariantProps {
  readonly variant?: HeaderVariant;
  readonly onStart?: () => void;
  readonly className?: string;
}

const NAV = [
  { label: 'How it works', href: '#how' },
  { label: 'Recipes', href: '#recipes' },
  { label: 'Pricing', href: '#pricing' },
];

const MEGA = [
  { group: 'The app', links: ['Your kitchen', 'Cook mode', 'Market list', 'The week'] },
  { group: 'Recipes', links: ['Nigerian', 'West African', 'Under 30 minutes', 'One pot'] },
  { group: 'Trust', links: ['How we test', 'How we use AI', 'Report a recipe'] },
];

export function SiteHeaderVariant({
  variant = 'solid',
  onStart,
  className,
}: SiteHeaderVariantProps) {
  const wordmark = (
    <span className="inline-flex items-center gap-2">
      <img src="/favicon.svg" alt="" width={26} height={26} className="rounded-blade-xs" />
      <span className="font-display text-xl font-extrabold tracking-display">
        Kinni<span className="text-sky-on">Jije</span>
      </span>
    </span>
  );

  const base = 'px-6 py-4';
  const ground = {
    transparent: 'bg-transparent',
    solid: 'border-b border-line bg-paper/95 backdrop-blur',
    centred: 'border-b border-line bg-paper',
    'with-cta': 'border-b border-ink bg-white',
    mega: 'border-b border-line bg-paper',
    'mobile-drawer': 'border-b border-line bg-paper',
  }[variant];

  if (variant === 'centred') {
    return (
      <header className={cn(base, ground, className)}>
        <div className="mx-auto flex max-w-[1080px] flex-col items-center gap-3">
          {wordmark}
          <nav className="flex items-center gap-6">
            <Repeat each={NAV}>
              {(item: (typeof NAV)[number]) => (
                <a key={item.label} href={item.href} className="text-sm font-extrabold text-ink-2 hover:text-ink">
                  {item.label}
                </a>
              )}
            </Repeat>
          </nav>
        </div>
      </header>
    );
  }

  if (variant === 'mega') {
    return (
      <header className={cn(base, ground, className)}>
        <div className="mx-auto max-w-[1080px]">
          <div className="flex items-center justify-between gap-4">
            {wordmark}
            <Button size="sm" onClick={onStart}>
              Start cooking
            </Button>
          </div>
          {/* The mega panel — every route, one press. For a site with depth. */}
          <div className="mt-4 grid gap-6 border-t border-line pt-4 sm:grid-cols-3">
            <Repeat each={MEGA}>
              {(column: (typeof MEGA)[number]) => (
                <div key={column.group}>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
                    {column.group}
                  </p>
                  <ul className="flex flex-col gap-1">
                    <Repeat each={column.links}>
                      {(link: string) => (
                        <li key={link}>
                          <a href="#" className="text-sm text-ink-2 hover:text-ink">
                            {link}
                          </a>
                        </li>
                      )}
                    </Repeat>
                  </ul>
                </div>
              )}
            </Repeat>
          </div>
        </div>
      </header>
    );
  }

  if (variant === 'mobile-drawer') {
    return (
      <header className={cn(base, ground, className)}>
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4">
          {wordmark}
          <button
            type="button"
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-blade-xs border border-ink bg-white shadow-drop-sm"
          >
            <KoboyoIcon name="hamburgerMenuIcon" size={18} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className={cn(base, ground, className)}>
      <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4">
        {wordmark}
        <nav className="hidden items-center gap-6 md:flex">
          <Repeat each={NAV}>
            {(item: (typeof NAV)[number]) => (
              <a key={item.label} href={item.href} className="text-sm font-extrabold text-ink-2 hover:text-ink">
                {item.label}
              </a>
            )}
          </Repeat>
        </nav>
        <Show when={variant === 'with-cta' || variant === 'transparent' || variant === 'solid'}>
          <div className="flex items-center gap-2">
            <Button variant="tertiary" size="sm">
              Sign in
            </Button>
            <Button size="sm" onClick={onStart}>
              Start cooking
            </Button>
          </div>
        </Show>
      </div>
    </header>
  );
}

/* ---------- Hero — the two variants site-sections lacked ---------- */

export interface HeroDemoProps {
  readonly onStart?: () => void;
  readonly className?: string;
}

/**
 * The kitchen input, working, in the hero.
 *
 * **The strongest and the riskiest.** It must degrade to the centred hero if
 * anything fails, because a broken demo above the fold is worse than no demo.
 */
export function SiteHeroDemo({ onStart, className }: HeroDemoProps) {
  return (
    <SiteSection className={className}>
      <div className="flex flex-col items-center text-center">
        <h1 className="max-w-[16ch] font-display text-5xl font-extrabold leading-none tracking-display">
          {HERO_HEADLINE}
        </h1>
        <p className="mt-4 max-w-[52ch] text-lg text-ink-2">{HERO_BODY}</p>

        {/* The real component, working. */}
        <div className="mt-7 w-full max-w-[520px] text-left">
          <ChipInput
            label="What is in your kitchen?"
            items={[
              { id: '1', label: 'Rice', source: 'typed' },
              { id: '2', label: 'Tomatoes', source: 'typed' },
              { id: '3', label: 'Onion', source: 'typed' },
            ]}
            onAdd={() => {}}
            onRemove={() => {}}
          />
          <Button size="lg" fullWidth className="mt-4" icon="cookingPot" onClick={onStart}>
            Suggest meals from 3 things
          </Button>
        </div>
      </div>
    </SiteSection>
  );
}

/** A video hero. The poster carries the promise; the video is decoration. */
export function SiteHeroVideo({ onStart, className }: HeroDemoProps) {
  return (
    <SiteSection tone="ink" className={className}>
      <div className="grid items-center gap-9 md:grid-cols-2">
        <div>
          <h1 className="font-display text-5xl font-extrabold leading-none tracking-display">
            {HERO_HEADLINE}
          </h1>
          <p className="mt-4 max-w-[46ch] text-lg text-ink-inv/80">{HERO_BODY}</p>
          <Button size="lg" onDark className="mt-6" onClick={onStart}>
            Start cooking
          </Button>
        </div>

        <div className="grid aspect-video place-items-center rounded-blade-lg border-bold border-white/20 bg-white/5">
          <span className="flex flex-col items-center gap-3 text-ink-inv/70">
            <span className="grid h-16 w-16 place-items-center rounded-round border-bold border-white/30">
              <KoboyoIcon name="play" size={26} />
            </span>
            <span className="text-sm font-extrabold">Watch it work · 40 seconds</span>
          </span>
        </div>
      </div>
    </SiteSection>
  );
}
