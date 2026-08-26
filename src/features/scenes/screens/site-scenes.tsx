import {
  SiteFaq,
  SiteFinalCta,
  SiteFooter,
  SiteHeader,
  SiteHero,
  SiteHowItWorks,
  SitePricing,
  SiteTrust,
  type FaqItem,
  type PricingTier,
} from '@ui/site';

import { SceneRoot } from '../parts/scene-frame';
import type { SceneFrame } from '../scenes.registry';

/**
 * The marketing site, composed end to end.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview-site/s90-scene-landing.html
 *
 * Every section is a component from `@ui/site`, and the trust section renders
 * real `MealCard`s — so the page structurally cannot claim a treatment the app
 * does not ship.
 */

const TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: '₦0',
    body: 'Everything you need to cook tonight.',
    features: [
      'Three meals from what you have',
      'Verified and AI recipes, always labelled',
      'Cook mode with timers',
      'Save what you like',
    ],
    cta: 'Start cooking',
  },
  {
    name: 'Kitchen',
    price: '₦1,500',
    period: '/month',
    body: 'For a household that cooks most nights.',
    features: [
      'Everything in Free',
      'Your standing kitchen, kept up to date',
      'Market list and low-stock nudges',
      'Weekly plan and portion scaling',
      'Photo and voice capture, unlimited',
    ],
    cta: 'Try it free for a month',
    featured: true,
  },
];

const FAQ: FaqItem[] = [
  {
    question: 'Do I have to keep a list of everything in my kitchen?',
    answer:
      'No. Tell it what you have right now, each time — that is the whole product. The standing kitchen is optional, and it is only ever topped up by things you already do: cooking a meal takes its ingredients out, ticking a market item puts them back.',
  },
  {
    question: 'How do I know a recipe is any good?',
    answer:
      'Every recipe says who wrote it. ✓ Verified means a person wrote and tested it. ◆ Made by AI means a model wrote it, and then the quantities are marked as estimates and the time is padded by 30%.',
  },
  {
    question: 'Is it only Nigerian food?',
    answer:
      'Nigerian and West African food is first-class rather than a category buried under “World”. Other cuisines are there too, but this is what the product is built around.',
  },
  {
    question: 'What happens to my photos?',
    answer:
      'A photo is read once to work out what is in it, kept with that extraction so a curator can check a bad reading, and deleted with your account.',
  },
];

/** The whole page, top to bottom. */
export function LandingScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <SceneRoot frame={frame}>
      <SiteHeader />
      <SiteHero variant={frame === 'phone' ? 'centred' : 'split'} />
      <SiteHowItWorks layout={frame === 'phone' ? 'timeline' : 'across'} />
      <SiteTrust />
      <SitePricing tiers={TIERS} />
      <SiteFaq items={FAQ} />
      <SiteFinalCta />
      <SiteFooter />
    </SceneRoot>
  );
}
