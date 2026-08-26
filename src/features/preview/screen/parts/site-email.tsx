import {
  HaveYouEatenEmail,
  LowStockEmail,
  UseItUpEmail,
  WeeklyEmail,
  WelcomeEmail,
} from '@ui/email/templates';
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
  type HeroVariant,
  type PricingTier,
} from '@ui/site/site-sections';

import { Api, Demo, Note, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview-site/s01-header.html … s11-footer.html
 *              design-system/projects/kinnijije-v2/preview/480-email-shell.html … 384-email-welcome.html
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

const HERO_VARIANTS: { variant: HeroVariant; label: string; note: string }[] = [
  { variant: 'centred', label: 'Centred colossal', note: 'Type does everything. Fastest to read, least to build.' },
  { variant: 'split', label: 'Split with the app', note: 'Copy left, a real screen right. Proof the product exists.' },
  { variant: 'blob', label: 'Blobatar-led', note: 'The chef introduces itself. Warmest, most character-forward.' },
  { variant: 'testimonial', label: 'Testimonial-led', note: 'A quote before the pitch. Needs real users to point at.' },
  { variant: 'returning', label: 'Low-key returning', note: 'For a visitor who already has an account. No pitch, just a door.' },
];

export function SitePart() {
  return (
    <Specimen
      title="Marketing site"
      spec="preview-site/s01-header.html … s11-footer.html"
      description="The same stance at a louder register — the blade, the sky and the three type families are identical; only the scale changes."
    >
      <Rule>
        <b>Every hero variant states the SAME promise in the same words.</b> Only the amount of
        evidence beside it changes — that is what stops a marketing site drifting into claims the
        product does not make.
      </Rule>

      <Section label="HERO — five treatments, one promise">
        {HERO_VARIANTS.map((entry) => (
          <div key={entry.variant} className="mb-6">
            <p className="mb-2 font-mono text-xs font-bold uppercase">{entry.label}</p>
            <Demo tone="plain" className="overflow-hidden p-0">
              <SiteHero variant={entry.variant} />
            </Demo>
            <Note>{entry.note}</Note>
          </div>
        ))}
      </Section>

      <Section label="HOW IT WORKS">
        <Demo tone="plain" className="overflow-hidden p-0">
          <SiteHowItWorks />
        </Demo>
        <Note>
          Three steps, always three. The product genuinely is three steps, so anything longer is
          padding and anything shorter hides the input methods.
        </Note>
      </Section>

      <Section label="TRUST — the site's version of the honesty claim">
        <Demo tone="plain" className="overflow-hidden p-0">
          <SiteTrust />
        </Demo>
        <Note>
          The proof is <b>the real meal card component</b>, not a mockup of one — so the site
          cannot show a treatment the app does not actually ship.
        </Note>
      </Section>

      <Section label="PRICING">
        <Demo tone="plain" className="overflow-hidden p-0">
          <SitePricing tiers={TIERS} />
        </Demo>
      </Section>

      <Section label="FAQ">
        <Demo tone="plain" className="overflow-hidden p-0">
          <SiteFaq items={FAQ} />
        </Demo>
      </Section>

      <Section label="FINAL CTA · FOOTER">
        <Demo tone="plain" className="overflow-hidden p-0">
          <SiteFinalCta />
          <SiteFooter />
        </Demo>
      </Section>

      <Section label="HEADER">
        <Demo tone="plain" className="overflow-hidden p-0">
          <SiteHeader />
          <div className="bg-paper px-6 py-9 text-center text-sm text-ink-3">Page content</div>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<SiteHeader onStart? onSignIn? />
<SiteHero variant?="centred|split|blob|testimonial|returning" onStart? />
<SiteHowItWorks layout?="across|timeline" />
<SiteTrust />
<SitePricing tiers* />
<SiteFaq items* />
<SiteFinalCta onStart? />
<SiteFooter />

// every hero variant states the SAME promise — only the evidence changes
// sections animate on scroll ONCE, never every re-entry`}</Api>
      </Section>
    </Specimen>
  );
}

export function EmailPart() {
  return (
    <Specimen
      title="Email templates"
      spec="480-email-shell.html … 384-email-welcome.html"
      description="A genuinely different register — tables only, inline styles, no CSS variables, no flexbox."
    >
      <Rule>
        Email clients have <b>no CSS variables, no flexbox, and no reliable border-radius</b>. This
        whole module is tables and inline hex values.{' '}
        <b>The blade degrades to a rectangle in Outlook, and that is accepted</b> — the colour, the
        type and the copy carry the identity, and no email is worth a VML hack.
      </Rule>

      <Rule tone="warn">
        <b>Frequency is part of the spec, not a runtime detail.</b> Low-stock at most weekly and
        only when something blocks a meal the cook actually makes. “Have you eaten?” at most once a
        fortnight, and <b>never twice unanswered</b> — a second unanswered nudge is nagging, and
        the third is why people mark mail as spam.
      </Rule>

      <Section label="HAVE YOU EATEN? — the hardest copy in the system">
        <Demo tone="plain" className="p-0">
          <HaveYouEatenEmail
            suggestion={{ name: 'Efo Riro & Pounded Yam', minutes: 40, note: 'uses the spinach' }}
          />
        </Demo>
        <Note>
          It is <b>a question, not a reprimand</b> — people stop cooking for reasons that are none
          of the product’s business. The pause link sits in the body, not only the footer.
        </Note>

        <Demo tone="plain" className="p-0">
          <HaveYouEatenEmail />
        </Demo>
        <Note>
          Nothing in the kitchen to point at — the email is shorter and asks nothing of them.
        </Note>
      </Section>

      <Section label="RUNNING LOW">
        <Demo tone="plain" className="p-0">
          <LowStockEmail
            headline="Rice is the one that matters — four of your saved meals need it."
            items={[
              { name: 'Long-grain rice', state: 'Out', reason: '4 saved meals need it' },
              { name: 'Scotch bonnet', state: '3 left', reason: 'you usually keep 10' },
              { name: 'Palm oil', state: 'Nearly out' },
            ]}
          />
        </Demo>
        <Note>
          If nothing is low, nothing is sent — there is no empty version of this email.
        </Note>
      </Section>

      <Section label="WEEKLY SUMMARY">
        <Demo tone="plain" className="p-0">
          <WeeklyEmail
            cooked={4}
            meals={[
              { name: 'Jollof Rice, Party Style', minutes: 45, source: 'seed' },
              { name: 'Egusi Soup', minutes: 70, source: 'ai' },
            ]}
          />
        </Demo>
        <Note>
          Even here the provenance contract holds — the AI meal keeps its label and its{' '}
          <code>≈</code>.
        </Note>
      </Section>

      <Section label="USE IT UP">
        <Demo tone="plain" className="p-0">
          <UseItUpEmail
            ingredient="Spinach"
            daysLeft={2}
            meal={{ name: 'Efo Riro', minutes: 40 }}
          />
        </Demo>
      </Section>

      <Section label="WELCOME">
        <Demo tone="plain" className="p-0">
          <WelcomeEmail name="Ada" />
        </Demo>
        <Note>
          The only transactional email in the set, and the one place the trust claim is stated in
          full before the cook has seen a single recipe.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<EmailShell preheader*>…</EmailShell>
<EmailHeader title? /> <EmailBody/> <EmailHeading/> <EmailText/>
<EmailButton href* label* variant?="primary|secondary" />
<EmailCard name* minutes* source* href* />
<EmailFooter unsubscribeHref* pauseHref? />

// \`preheader\` is REQUIRED — it is the second line in every inbox
// padding is on the CELL, never on the anchor — Outlook ignores
//   anchor padding
// ONE primary per email — a second halves the response to both
// max width 520px; single column; every image has alt text`}</Api>
      </Section>
    </Specimen>
  );
}
