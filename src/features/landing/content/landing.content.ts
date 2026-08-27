import type { FaqItem, PricingTier } from '@ui/site';

/**
 * Landing page copy.
 *
 * Kept out of the screen so it reads as content rather than markup, and so a
 * wording change never risks touching layout. Lifted from the `landing` scene,
 * which is the design spec.
 */
export const PRICING_TIERS: readonly PricingTier[] = [
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

export const FAQ_ITEMS: readonly FaqItem[] = [
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
