import { useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { Blob, KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { Input, Switch } from '@ui/inputs';
import { Accordion } from '@ui/display';
import { SiteEyebrow, SiteSection, type FaqItem, type PricingTier } from '../site-sections';

/**
 * Pricing, FAQ, final CTA and footer — the remaining variants.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview-site/s04-how-it-works.html
 *                                                               s08-pricing.html
 *                                                               s09-faq.html
 *                                                               s10-final-cta.html
 *                                                               s11-footer.html
 */

/* ---------- s04 · How it works — the remaining 4 variants ---------- */

export type HowVariant = 'across' | 'timeline' | 'sticky' | 'tabbed' | 'demo' | 'numbered';

const STEPS = [
  {
    icon: 'basket' as KoboyoIconName,
    title: 'Say what you have',
    body: 'Type it, say it into your phone, or take a photo of your fridge.',
  },
  {
    icon: 'cookingPot' as KoboyoIconName,
    title: 'Get three meals',
    body: 'Mostly from what is already there, with what you would need to buy.',
  },
  {
    icon: 'kitchenTimer' as KoboyoIconName,
    title: 'Cook one',
    body: 'Full-screen steps, timers, and the screen stays awake.',
  },
];

export interface SiteHowVariantProps {
  readonly variant?: HowVariant;
  readonly className?: string;
}

/** **Three steps, always three.** The product genuinely is three steps. */
export function SiteHowVariant({ variant = 'tabbed', className }: SiteHowVariantProps) {
  const [tab, setTab] = useState(0);

  if (variant === 'numbered') {
    return (
      <SiteSection tone="white" className={className}>
        <SiteEyebrow>How it works</SiteEyebrow>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          <Repeat each={STEPS}>
            {(step: (typeof STEPS)[number], index: number) => (
              <div
                key={step.title}
                className="rounded-blade-lg border-bold border-ink bg-paper p-6 shadow-drop"
              >
                <span className="font-mono text-4xl font-bold tnum text-sky">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="mt-3 font-display text-lg font-extrabold tracking-display">
                  {step.title}
                </p>
                <p className="mt-1 text-md text-ink-2">{step.body}</p>
              </div>
            )}
          </Repeat>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'sticky') {
    return (
      <SiteSection tone="white" className={className}>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="md:sticky md:top-24 md:self-start">
            <SiteEyebrow>How it works</SiteEyebrow>
            <h2 className="font-display text-3xl font-extrabold tracking-display">
              Three steps. That is the whole thing.
            </h2>
            <p className="mt-3 max-w-[42ch] text-lg text-ink-2">
              Nothing to set up, nothing to maintain, and you can skip straight to cooking.
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <Repeat each={STEPS}>
              {(step: (typeof STEPS)[number], index: number) => (
                <div key={step.title} className="rounded-blade-lg border border-line-2 bg-paper p-6">
                  <span className="font-mono text-sm font-bold tnum text-ink-3">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-2 font-display text-lg font-extrabold tracking-display">
                    {step.title}
                  </p>
                  <p className="mt-1 text-md text-ink-2">{step.body}</p>
                </div>
              )}
            </Repeat>
          </div>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'demo') {
    return (
      <SiteSection tone="sky" className={className}>
        <SiteEyebrow>How it works</SiteEyebrow>
        <div className="mt-4 grid items-center gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Repeat each={STEPS}>
              {(step: (typeof STEPS)[number], index: number) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setTab(index)}
                  className={cn(
                    'rounded-blade border p-4 text-left transition-colors',
                    tab === index
                      ? 'border-ink bg-white shadow-drop-sm'
                      : 'border-transparent hover:bg-white/50',
                  )}
                >
                  <p className="font-display text-md font-extrabold tracking-display">
                    {step.title}
                  </p>
                  <Show when={tab === index}>
                    <p className="mt-1 text-sm text-ink-2">{step.body}</p>
                  </Show>
                </button>
              )}
            </Repeat>
          </div>
          <div className="grid aspect-[4/3] place-items-center rounded-blade-lg border-bold border-ink bg-white shadow-drop">
            <KoboyoIcon name={STEPS[tab]?.icon ?? 'cookingPot'} size={64} alone className="text-sky" />
          </div>
        </div>
      </SiteSection>
    );
  }

  // Tabbed
  return (
    <SiteSection tone="white" className={className}>
      <SiteEyebrow>How it works</SiteEyebrow>
      <div className="mb-6 mt-4 flex flex-wrap gap-2">
        <Repeat each={STEPS}>
          {(step: (typeof STEPS)[number], index: number) => (
            <button
              key={step.title}
              type="button"
              onClick={() => setTab(index)}
              className={cn(
                'rounded-pill border px-4 py-2 text-sm font-extrabold transition-colors',
                tab === index
                  ? 'border-ink bg-ink text-ink-inv'
                  : 'border-line-2 bg-white text-ink-2 hover:border-ink hover:text-ink',
              )}
            >
              {String(index + 1).padStart(2, '0')} · {step.title}
            </button>
          )}
        </Repeat>
      </div>
      <div className="rounded-blade-lg border border-line-2 bg-paper p-8">
        <p className="max-w-[52ch] text-lg text-ink-2">{STEPS[tab]?.body}</p>
      </div>
    </SiteSection>
  );
}

/* ---------- s08 · Pricing — the remaining variants ---------- */

export type PricingVariant = 'two-tier' | 'three-tier' | 'single' | 'comparison' | 'toggle';

export interface SitePricingVariantProps {
  readonly variant?: PricingVariant;
  readonly tiers: readonly PricingTier[];
  readonly className?: string;
}

export function SitePricingVariant({
  variant = 'toggle',
  tiers,
  className,
}: SitePricingVariantProps) {
  const [yearly, setYearly] = useState(false);

  if (variant === 'single') {
    const only = tiers[0];
    return (
      <SiteSection tone="white" className={className}>
        <div className="mx-auto flex max-w-[520px] flex-col items-center gap-4 text-center">
          <SiteEyebrow>Pricing</SiteEyebrow>
          <p className="font-mono text-6xl font-bold tnum">{only?.price}</p>
          <h2 className="font-display text-3xl font-extrabold tracking-display">
            Free, and that is the whole plan.
          </h2>
          <p className="max-w-[44ch] text-lg text-ink-2">{only?.body}</p>
          <Button size="lg" className="mt-2">
            {only?.cta}
          </Button>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'comparison') {
    const features = Array.from(new Set(tiers.flatMap((tier) => tier.features)));
    return (
      <SiteSection tone="white" className={className}>
        <SiteEyebrow>Pricing</SiteEyebrow>
        <table className="mt-4 w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b-bold border-ink pb-3 text-left" />
              <Repeat each={[...tiers]}>
                {(tier: PricingTier) => (
                  <th key={tier.name} className="w-[160px] border-b-bold border-ink pb-3 text-center">
                    <span className="block font-display text-md font-extrabold tracking-display">
                      {tier.name}
                    </span>
                    <span className="block font-mono text-lg font-bold tnum">{tier.price}</span>
                  </th>
                )}
              </Repeat>
            </tr>
          </thead>
          <tbody>
            <Repeat each={features}>
              {(feature: string) => (
                <tr key={feature}>
                  <td className="border-b border-line py-3 text-md text-ink-2">{feature}</td>
                  <Repeat each={[...tiers]}>
                    {(tier: PricingTier) => (
                      <td key={tier.name} className="border-b border-line py-3 text-center">
                        {tier.features.includes(feature) ? (
                          <KoboyoIcon name="tick" size={17} className="text-success" />
                        ) : (
                          <span className="text-ink-4">—</span>
                        )}
                      </td>
                    )}
                  </Repeat>
                </tr>
              )}
            </Repeat>
          </tbody>
        </table>
      </SiteSection>
    );
  }

  return (
    <SiteSection tone="white" className={className}>
      <SiteEyebrow>Pricing</SiteEyebrow>
      <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-3xl font-extrabold tracking-display">
          Free to cook. Pay only if you want more.
        </h2>
        <Show when={variant === 'toggle'}>
          <span className="flex items-center gap-3">
            <Switch checked={yearly} onCheckedChange={setYearly} label="Pay yearly" />
            {/* The saving is stated, not implied by a badge. */}
            <span className="text-sm font-extrabold text-success-onsoft">Two months free</span>
          </span>
        </Show>
      </div>

      <div className={cn('grid gap-5', tiers.length > 2 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        <Repeat each={[...tiers]}>
          {(tier: PricingTier) => (
            <div
              key={tier.name}
              className={cn(
                'flex flex-col rounded-blade-lg border p-6',
                tier.featured === true
                  ? 'border-bold border-ink bg-paper shadow-drop'
                  : 'border-line-2 bg-paper',
              )}
            >
              <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
                {tier.name}
              </p>
              <p className="mt-2 font-mono text-4xl font-bold tnum">
                {yearly && tier.period !== undefined ? '₦15,000' : tier.price}
                <Show when={tier.period !== undefined}>
                  <span className="ml-1 font-sans text-md font-semibold text-ink-3">
                    {yearly ? '/year' : tier.period}
                  </span>
                </Show>
              </p>
              <p className="mt-2 text-md text-ink-2">{tier.body}</p>

              <ul className="mt-5 flex flex-1 flex-col gap-2">
                <Repeat each={[...tier.features]}>
                  {(feature: string) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ink-2">
                      <KoboyoIcon name="tick" size={15} className="mt-[2px] shrink-0 text-success" />
                      {feature}
                    </li>
                  )}
                </Repeat>
              </ul>

              <Button
                className="mt-6"
                fullWidth
                variant={tier.featured === true ? 'primary' : 'secondary'}
              >
                {tier.cta}
              </Button>
            </div>
          )}
        </Repeat>
      </div>
    </SiteSection>
  );
}

/* ---------- s09 · FAQ — the remaining variants ---------- */

export type FaqVariant = 'accordion' | 'two-column' | 'categorised' | 'search-first' | 'with-cta';

export interface SiteFaqVariantProps {
  readonly variant?: FaqVariant;
  readonly items: readonly FaqItem[];
  readonly className?: string;
}

export function SiteFaqVariant({ variant = 'two-column', items, className }: SiteFaqVariantProps) {
  const [query, setQuery] = useState('');

  const filtered =
    query.trim() === ''
      ? items
      : items.filter(
          (item) =>
            item.question.toLowerCase().includes(query.toLowerCase()) ||
            item.answer.toLowerCase().includes(query.toLowerCase()),
        );

  if (variant === 'two-column') {
    return (
      <SiteSection className={className}>
        <SiteEyebrow>Questions</SiteEyebrow>
        <div className="mt-4 grid gap-x-9 gap-y-6 md:grid-cols-2">
          <Repeat each={[...items]}>
            {(item: FaqItem) => (
              <div key={item.question}>
                <p className="font-display text-md font-extrabold tracking-display">
                  {item.question}
                </p>
                <p className="mt-2 text-md text-ink-2">{item.answer}</p>
              </div>
            )}
          </Repeat>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'search-first') {
    return (
      <SiteSection className={className}>
        <div className="mx-auto max-w-[640px]">
          <SiteEyebrow>Questions</SiteEyebrow>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the questions"
            aria-label="Search the questions"
            size="lg"
            className="mb-5 mt-3"
          />
          <Show when={filtered.length === 0}>
            <p className="rounded-blade border border-dashed border-line-2 bg-paper-2 px-4 py-6 text-center text-sm text-ink-3">
              Nothing matches “{query}”. Ask us directly and we will answer.
            </p>
          </Show>
          <Accordion
            items={filtered.map((item) => ({
              id: item.question,
              title: item.question,
              body: item.answer,
            }))}
          />
        </div>
      </SiteSection>
    );
  }

  if (variant === 'with-cta') {
    return (
      <SiteSection className={className}>
        <div className="grid gap-8 md:grid-cols-[1fr_280px]">
          <div>
            <SiteEyebrow>Questions</SiteEyebrow>
            <Accordion
              className="mt-3"
              items={items.map((item) => ({
                id: item.question,
                title: item.question,
                body: item.answer,
              }))}
            />
          </div>
          <aside className="rounded-blade-lg border-bold border-ink bg-sky-soft p-6 text-center shadow-drop">
            <Blob name="chef" size={64} expression="happy" />
            <p className="mt-3 font-display text-md font-extrabold tracking-display">
              Still wondering?
            </p>
            <p className="mt-1 text-sm text-ink-2">
              Try it with what is in your kitchen right now. No account needed.
            </p>
            <Button size="sm" fullWidth className="mt-4">
              Start cooking
            </Button>
          </aside>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'categorised') {
    const groups = [
      { label: 'Using it', items: items.slice(0, 2) },
      { label: 'Trust and AI', items: items.slice(2) },
    ];
    return (
      <SiteSection className={className}>
        <SiteEyebrow>Questions</SiteEyebrow>
        <div className="mt-4 flex flex-col gap-8">
          <Repeat each={groups}>
            {(group: (typeof groups)[number]) => (
              <div key={group.label}>
                <p className="mb-3 font-display text-lg font-extrabold tracking-display">
                  {group.label}
                </p>
                <Accordion
                  items={group.items.map((item) => ({
                    id: item.question,
                    title: item.question,
                    body: item.answer,
                  }))}
                />
              </div>
            )}
          </Repeat>
        </div>
      </SiteSection>
    );
  }

  return (
    <SiteSection className={className}>
      <SiteEyebrow>Questions</SiteEyebrow>
      <Accordion
        className="mt-3"
        items={items.map((item) => ({
          id: item.question,
          title: item.question,
          body: item.answer,
        }))}
      />
    </SiteSection>
  );
}

/* ---------- s10 · Final CTA — the remaining variants ---------- */

export type CtaVariant = 'full-bleed' | 'centred-card' | 'split' | 'app-store' | 'newsletter' | 'blob';

export interface SiteCtaVariantProps {
  readonly variant?: CtaVariant;
  readonly onStart?: () => void;
  readonly className?: string;
}

export function SiteCtaVariant({ variant = 'centred-card', onStart, className }: SiteCtaVariantProps) {
  const headline = 'What is in your kitchen right now?';
  const body = 'Three meals, in about ten seconds. No account needed to try it.';

  if (variant === 'centred-card') {
    return (
      <SiteSection className={className}>
        <div className="mx-auto max-w-[640px] rounded-blade-xl border-bold border-ink bg-white p-9 text-center shadow-drop-lg">
          <h2 className="font-display text-3xl font-extrabold tracking-display">{headline}</h2>
          <p className="mt-3 text-lg text-ink-2">{body}</p>
          <Button size="lg" className="mt-6" onClick={onStart}>
            Start cooking
          </Button>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'split') {
    return (
      <SiteSection tone="sky" className={className}>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-display">{headline}</h2>
            <p className="mt-3 max-w-[42ch] text-lg text-ink-2">{body}</p>
          </div>
          <div className="md:justify-self-end">
            <Button size="lg" onClick={onStart}>
              Start cooking
            </Button>
          </div>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'app-store') {
    return (
      <SiteSection tone="ink" className={className}>
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[18ch] font-display text-4xl font-extrabold leading-none tracking-display">
            {headline}
          </h2>
          <p className="mt-4 text-lg text-ink-inv/80">{body}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Repeat each={['App Store', 'Google Play']}>
              {(store: string) => (
                <span
                  key={store}
                  className="inline-flex items-center gap-2 rounded-blade border-bold border-white/30 px-5 py-3 text-sm font-extrabold text-ink-inv"
                >
                  <KoboyoIcon name="phone" size={18} />
                  {store}
                </span>
              )}
            </Repeat>
          </div>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'newsletter') {
    return (
      <SiteSection tone="sky" className={className}>
        <div className="mx-auto flex max-w-[520px] flex-col items-center text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-display">
            One email a week, with what to cook.
          </h2>
          <p className="mt-2 text-md text-ink-2">
            No more than one. Pause it any time, from the email itself.
          </p>
          <div className="mt-5 flex w-full flex-wrap gap-2">
            <Input
              type="email"
              placeholder="you@example.com"
              aria-label="Email"
              className="min-w-[200px] flex-1"
            />
            <Button size="md">Send it</Button>
          </div>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'blob') {
    return (
      <SiteSection tone="sky" className={className}>
        <div className="flex flex-col items-center text-center">
          <Blob name="chef" size={104} expression="wink" animate="hover" />
          <h2 className="mt-5 max-w-[18ch] font-display text-3xl font-extrabold tracking-display">
            Tell me what you have.
          </h2>
          <p className="mt-3 text-lg text-ink-2">{body}</p>
          <Button size="lg" className="mt-6" onClick={onStart}>
            Start cooking
          </Button>
        </div>
      </SiteSection>
    );
  }

  return (
    <SiteSection tone="ink" className={className}>
      <div className="flex flex-col items-center text-center">
        <h2 className="max-w-[18ch] font-display text-4xl font-extrabold leading-none tracking-display">
          {headline}
        </h2>
        <p className="mt-4 max-w-[46ch] text-lg text-ink-inv/80">{body}</p>
        <Button size="lg" onDark className="mt-6" onClick={onStart}>
          Start cooking
        </Button>
      </div>
    </SiteSection>
  );
}

/* ---------- s11 · Footer — the remaining variants ---------- */

export type FooterVariant = 'sitemap' | 'minimal' | 'newsletter' | 'app-badges' | 'legal';

export interface SiteFooterVariantProps {
  readonly variant?: FooterVariant;
  readonly className?: string;
}

const FOOTER_GROUPS = [
  { label: 'Product', links: ['How it works', 'Recipes', 'Pricing', 'The app'] },
  { label: 'Company', links: ['About', 'How we use AI', 'How we test recipes'] },
  { label: 'Legal', links: ['Privacy', 'Terms', 'Your data'] },
];

export function SiteFooterVariant({ variant = 'minimal', className }: SiteFooterVariantProps) {
  const wordmark = (
    <span className="inline-flex items-center gap-2">
      <KoboyoIcon name="cookingPot" size={22} className="text-sky" />
      <span className="font-display text-lg font-extrabold tracking-display">Kinnijije</span>
    </span>
  );

  if (variant === 'minimal') {
    return (
      <footer className={cn('border-t border-line bg-paper px-6 py-6', className)}>
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-4">
          {wordmark}
          <nav className="flex flex-wrap gap-5 text-sm">
            <Repeat each={['Privacy', 'Terms', 'How we use AI']}>
              {(link: string) => (
                <a key={link} href="#" className="text-ink-3 hover:text-ink">
                  {link}
                </a>
              )}
            </Repeat>
          </nav>
        </div>
      </footer>
    );
  }

  if (variant === 'newsletter') {
    return (
      <footer className={cn('border-t border-line bg-paper px-6 py-9', className)}>
        <div className="mx-auto grid max-w-[1080px] gap-8 md:grid-cols-2">
          <div>
            {wordmark}
            <p className="mt-2 max-w-[36ch] text-sm text-ink-3">
              What to cook, from what you have.
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
              One email a week
            </p>
            <div className="flex flex-wrap gap-2">
              <Input
                type="email"
                size="sm"
                placeholder="you@example.com"
                aria-label="Email"
                className="min-w-[180px] flex-1"
              />
              <Button size="sm">Send it</Button>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  if (variant === 'app-badges') {
    return (
      <footer className={cn('border-t border-line bg-paper px-6 py-9', className)}>
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-6">
          {wordmark}
          <div className="flex flex-wrap gap-3">
            <Repeat each={['App Store', 'Google Play']}>
              {(store: string) => (
                <span
                  key={store}
                  className="inline-flex items-center gap-2 rounded-blade-xs border border-ink bg-white px-4 py-2 text-sm font-extrabold shadow-drop-sm"
                >
                  <KoboyoIcon name="phone" size={16} />
                  {store}
                </span>
              )}
            </Repeat>
          </div>
        </div>
      </footer>
    );
  }

  if (variant === 'legal') {
    return (
      <footer className={cn('border-t border-line bg-paper px-6 py-9', className)}>
        <div className="mx-auto max-w-[1080px]">
          {wordmark}
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <Repeat each={FOOTER_GROUPS}>
              {(group: (typeof FOOTER_GROUPS)[number]) => (
                <div key={group.label}>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-4">
                    {group.label}
                  </p>
                  <ul className="flex flex-col gap-1">
                    <Repeat each={group.links}>
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
          <p className="mt-8 max-w-[70ch] text-xs leading-relaxed text-ink-4">
            Recipes marked ◆ Made by AI are generated by a language model; quantities are
            estimates and cook times are padded. Photographs marked AI image are generated.
            Nutrition figures are estimates worked out from ingredients, not measured. © Kinnijije.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn('border-t border-line bg-paper px-6 py-9', className)}>
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-start justify-between gap-8">
        <div>
          {wordmark}
          <p className="mt-2 max-w-[36ch] text-sm text-ink-3">
            What to cook, from what you have. Nigerian and West African food, first.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-10 gap-y-4">
          <Repeat each={FOOTER_GROUPS}>
            {(group: (typeof FOOTER_GROUPS)[number]) => (
              <div key={group.label} className="flex flex-col gap-2">
                <p className="text-xs font-extrabold uppercase tracking-overline text-ink-4">
                  {group.label}
                </p>
                <Repeat each={group.links}>
                  {(link: string) => (
                    <a key={link} href="#" className="text-sm text-ink-2 hover:text-ink">
                      {link}
                    </a>
                  )}
                </Repeat>
              </div>
            )}
          </Repeat>
        </nav>
      </div>
    </footer>
  );
}
