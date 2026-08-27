import { useState } from 'react';

import {
  HERO_BODY,
  HERO_HEADLINE,
  SiteCtaVariant,
  SiteFaqVariant,
  SiteFooterVariant,
  SiteHeaderVariant,
  SiteHeroDemo,
  SiteHeroVideo,
  SiteHowVariant,
  SitePricingVariant,
  SiteProblem,
  SiteFeatures,
  SiteGallery,
  SiteProof,
  SiteHero,
  type CtaVariant,
  type FaqVariant,
  type FooterVariant,
  type HeaderVariant,
  type HeroVariant,
  type HowVariant,
  type PricingVariant,
  type ProblemVariant,
  type ProofVariant,
  type GalleryVariant,
  type FeatureVariant,
} from '@ui/site';

import { Demo, Note, Row, Rule, Section, Specimen, Stack } from './preview-canvas';

/**
 * Visual spec: preview-site/s01-header … s11-footer
 *
 * Every marketing family, at every variant the manifest declares — 67 of them.
 * They are shown as a switcher rather than a wall, because the point of a
 * variant set is that you compare within a family, not across.
 */

const TIERS = [
  {
    name: 'Free',
    price: '₦0',
    body: 'Everything you need to cook tonight.',
    features: ['Suggestions from what you have', 'Nigerian and West African recipes', 'Cook mode'],
    cta: 'Start cooking',
  },
  {
    name: 'Kitchen',
    price: '₦1,500',
    period: '/month',
    body: 'For a household that plans.',
    features: ['Everything in Free', 'Week planning', 'Market lists', 'Stock tracking'],
    cta: 'Try it free',
    featured: true,
  },
];

const FAQS = [
  {
    question: 'Does it work with what I actually have?',
    answer: 'That is the whole idea. Tell it your six things and it works from those.',
  },
  {
    question: 'Are the recipes real?',
    answer:
      'Every recipe is labelled. Verified ones were cooked and checked by a person; AI ones say so, every time.',
  },
  {
    question: 'Do I need to pay?',
    answer: 'No. Suggestions and cook mode are free and stay free.',
  },
];

/** A small switcher, so a family is compared within itself. */
function Variants<T extends string>({
  values,
  value,
  onChange,
}: {
  readonly values: readonly T[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}) {
  return (
    <Row>
      {values.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={
            option === value
              ? 'rounded-blade-xs border border-ink bg-sky px-3 py-1 text-xs font-extrabold text-sky-onbase shadow-drop-sm'
              : 'rounded-blade-xs border border-line-2 bg-white px-3 py-1 text-xs font-extrabold text-ink-2 hover:bg-paper-2'
          }
        >
          {option}
        </button>
      ))}
    </Row>
  );
}

export function SiteHeaderHeroPart() {
  const [header, setHeader] = useState<HeaderVariant>('solid');
  const [hero, setHero] = useState<HeroVariant>('centred');

  return (
    <Specimen
      title="Header · Hero"
      spec="s01-header · s02-hero"
      description="Six headers and seven heroes, all making the same promise in the same words."
    >
      <Rule>
        <b>Every hero variant states the SAME promise, verbatim.</b> Only the amount of
        evidence beside it changes. <code>HERO_HEADLINE</code> and <code>HERO_BODY</code> are
        exported constants for exactly that reason — a marketing site whose headline drifts
        per layout starts making claims the product does not.
      </Rule>

      <Section label="HEADER — 6">
        <Variants
          values={['transparent', 'solid', 'centred', 'with-cta', 'mega', 'mobile-drawer']}
          value={header}
          onChange={setHeader}
        />
        <Demo>
          <SiteHeaderVariant variant={header} />
        </Demo>
      </Section>

      <Section label="HERO — 5 IN SiteHero, PLUS 2 OF ITS OWN">
        <Variants
          values={['centred', 'split', 'blob', 'testimonial', 'returning']}
          value={hero}
          onChange={setHero}
        />
        <Demo>
          <SiteHero variant={hero} />
        </Demo>
      </Section>

      <Section label="HERO — DEMO AND VIDEO">
        <Stack>
          <Demo>
            <SiteHeroDemo />
          </Demo>
          <Demo>
            <SiteHeroVideo />
          </Demo>
        </Stack>
        <Note>
          The live-demo hero is the strongest and the riskiest — it must degrade to the centred
          hero if anything fails, because a broken demo above the fold is worse than no demo.
          The promise it states is <code>{HERO_HEADLINE}</code>, the same as every other.
        </Note>
      </Section>
    </Specimen>
  );
}

export function SiteBodyPart() {
  const [problem, setProblem] = useState<ProblemVariant>('three-panel');
  const [features, setFeatures] = useState<FeatureVariant>('alternating');
  const [proof, setProof] = useState<ProofVariant>('logo-wall');
  const [gallery, setGallery] = useState<GalleryVariant>('grid');

  return (
    <Specimen
      title="Problem · Features · Proof · Gallery"
      spec="s03-problem · s05-features · s06-proof · s07-gallery"
      description="The middle of the page: the itch, the answer, the evidence, the goods."
    >
      <Section label="PROBLEM — 5">
        <Variants
          values={['three-panel', 'before-after', 'stat-led', 'quote-led', 'photo']}
          value={problem}
          onChange={setProblem}
        />
        <Demo>
          <SiteProblem variant={problem} />
        </Demo>
      </Section>

      <Section label="FEATURES — 6">
        <Variants
          values={['alternating', 'bento', 'carousel', 'icon-grid', 'screenshot', 'comparison']}
          value={features}
          onChange={setFeatures}
        />
        <Demo>
          <SiteFeatures variant={features} />
        </Demo>
      </Section>

      <Section label="PROOF — 6">
        <Variants
          values={['logo-wall', 'cards', 'big-quote', 'star-summary', 'counter-row', 'press']}
          value={proof}
          onChange={setProof}
        />
        <Demo>
          <SiteProof variant={proof} />
        </Demo>
      </Section>

      <Section label="GALLERY — 5">
        <Variants
          values={['grid', 'carousel', 'masonry', 'category-tabs', 'search-preview']}
          value={gallery}
          onChange={setGallery}
        />
        <Demo>
          <SiteGallery variant={gallery} />
        </Demo>
        <Note>
          Gallery cards render the same <code>MealCard</code> the app does, with the same
          provenance contract. A marketing page that mocks up its own recipe cards is how a
          site ends up showing an "AI" badge the product stopped using.
        </Note>
      </Section>
    </Specimen>
  );
}

export function SiteClosersPart() {
  const [how, setHow] = useState<HowVariant>('across');
  const [pricing, setPricing] = useState<PricingVariant>('two-tier');
  const [faq, setFaq] = useState<FaqVariant>('accordion');
  const [cta, setCta] = useState<CtaVariant>('centred-card');
  const [footer, setFooter] = useState<FooterVariant>('sitemap');

  return (
    <Specimen
      title="How it works · Pricing · FAQ · Final CTA · Footer"
      spec="s04-how-it-works · s08-pricing · s09-faq · s10-final-cta · s11-footer"
      description="The bottom of the page, where a visitor either acts or leaves."
    >
      <Section label="HOW IT WORKS — 6">
        <Variants
          values={['across', 'timeline', 'sticky', 'tabbed', 'demo', 'numbered']}
          value={how}
          onChange={setHow}
        />
        <Demo>
          <SiteHowVariant variant={how} />
        </Demo>
      </Section>

      <Section label="PRICING — 5">
        <Variants
          values={['two-tier', 'three-tier', 'single', 'comparison', 'toggle']}
          value={pricing}
          onChange={setPricing}
        />
        <Demo>
          <SitePricingVariant variant={pricing} tiers={TIERS} />
        </Demo>
        <Note>
          The free tier is never framed as a trial. Suggestions and cook mode are free and stay
          free, so the pricing page says that rather than implying a countdown.
        </Note>
      </Section>

      <Section label="FAQ — 5">
        <Variants
          values={['accordion', 'two-column', 'categorised', 'search-first', 'with-cta']}
          value={faq}
          onChange={setFaq}
        />
        <Demo>
          <SiteFaqVariant variant={faq} items={FAQS} />
        </Demo>
      </Section>

      <Section label="FINAL CTA — 6">
        <Variants
          values={['full-bleed', 'centred-card', 'split', 'app-store', 'newsletter', 'blob']}
          value={cta}
          onChange={setCta}
        />
        <Demo>
          <SiteCtaVariant variant={cta} />
        </Demo>
      </Section>

      <Section label="FOOTER — 5">
        <Variants
          values={['sitemap', 'minimal', 'newsletter', 'app-badges', 'legal']}
          value={footer}
          onChange={setFooter}
        />
        <Demo>
          <SiteFooterVariant variant={footer} />
        </Demo>
      </Section>

      <Note>{HERO_BODY}</Note>
    </Specimen>
  );
}
