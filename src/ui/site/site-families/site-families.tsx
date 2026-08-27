import { Repeat } from 'meemaw';

import { Blob, KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { Figure, MediaContainer } from '@ui/display';
import { Rating } from '@ui/inputs';
import { MealCard } from '@ui/domain';
import { Carousel, Tile } from '@ui/structure';
import { SiteEyebrow, SiteSection } from '../site-sections';

/**
 * The four site families that had no component at all.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview-site/s03-problem.html
 *                                                               s05-features.html
 *                                                               s06-social-proof.html
 *                                                               s07-recipe-gallery.html
 *
 * The site is the same stance at a louder register — the blade, the sky and the
 * three type families are identical; only the scale changes.
 */

/* ---------- s03 · Problem / agitation — 5 variants ---------- */

export type ProblemVariant = 'three-panel' | 'before-after' | 'stat-led' | 'quote-led' | 'photo';

export interface SiteProblemProps {
  readonly variant?: ProblemVariant;
  readonly className?: string;
}

const PAINS = [
  {
    icon: 'fridge' as KoboyoIconName,
    title: 'You have food, but no idea',
    body: 'A full fridge and nothing that reads as a meal.',
  },
  {
    icon: 'phone' as KoboyoIconName,
    title: 'Recipes want a shop first',
    body: 'Every result needs three things you do not have.',
  },
  {
    icon: 'purse' as KoboyoIconName,
    title: 'So you order out again',
    body: 'And the vegetables turn in the drawer.',
  },
];

/**
 * The problem, stated once.
 *
 * **Named after the cook's experience, not the product's.** "Meal planning is
 * hard" is a category; "you have food and no idea" is a Tuesday evening someone
 * recognises.
 */
export function SiteProblem({ variant = 'three-panel', className }: SiteProblemProps) {
  if (variant === 'before-after') {
    return (
      <SiteSection tone="white" className={className}>
        <SiteEyebrow>The evening</SiteEyebrow>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="rounded-blade-lg border border-critical-border bg-critical-soft p-6">
            <p className="text-xs font-extrabold uppercase tracking-overline text-critical-onsoft">
              Without
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-display">
              Twenty minutes in the fridge door.
            </p>
            <p className="mt-2 text-md text-ink-2">
              Then a search that wants tahini, then the delivery app.
            </p>
          </div>
          <div className="rounded-blade-lg border-bold border-ink bg-success-soft p-6 shadow-drop">
            <p className="text-xs font-extrabold uppercase tracking-overline text-success-onsoft">
              With
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-display">
              Three meals in ten seconds.
            </p>
            <p className="mt-2 text-md text-ink-2">
              All of them from what is already in there.
            </p>
          </div>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'stat-led') {
    return (
      <SiteSection tone="white" className={className}>
        <div className="flex flex-col items-center text-center">
          <Figure value="₦48,000" size="6xl" />
          <p className="mt-3 max-w-[42ch] text-lg text-ink-2">
            What a household of four throws away in a year, in vegetables that turned before
            anyone worked out what to do with them.
          </p>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'quote-led') {
    return (
      <SiteSection tone="sky" className={className}>
        <div className="flex flex-col items-center text-center">
          <blockquote className="max-w-[26ch] font-display text-4xl font-extrabold leading-tight tracking-display">
            “I have food. I just cannot think of anything.”
          </blockquote>
          <p className="mt-4 text-sm font-extrabold text-ink-3">
            Every cook, about six o'clock
          </p>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'photo') {
    return (
      <SiteSection tone="white" className={className}>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <MediaContainer ratio="4/3" fallbackIcon="fridge" />
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-display">
              This is a fridge with dinner in it.
            </h2>
            <p className="mt-3 text-lg text-ink-2">
              Rice, two tomatoes, an onion, half a chicken. That is Jollof, and it is forty-five
              minutes away.
            </p>
          </div>
        </div>
      </SiteSection>
    );
  }

  return (
    <SiteSection tone="white" className={className}>
      <SiteEyebrow>The evening</SiteEyebrow>
      <h2 className="mb-8 font-display text-3xl font-extrabold tracking-display">
        You already know how this goes.
      </h2>
      <div className="grid gap-5 md:grid-cols-3">
        <Repeat each={PAINS}>
          {(pain: (typeof PAINS)[number]) => (
            <div key={pain.title} className="rounded-blade-lg border border-line-2 bg-paper p-6">
              <KoboyoIcon name={pain.icon} size={30} className="text-ink-3" alone />
              <p className="mt-4 font-display text-lg font-extrabold tracking-display">
                {pain.title}
              </p>
              <p className="mt-1 text-md text-ink-2">{pain.body}</p>
            </div>
          )}
        </Repeat>
      </div>
    </SiteSection>
  );
}

/* ---------- s05 · Feature showcase — 7 variants ---------- */

export type FeatureVariant =
  | 'alternating'
  | 'bento'
  | 'carousel'
  | 'icon-grid'
  | 'screenshot'
  | 'comparison';

export interface Feature {
  readonly title: string;
  readonly body: string;
  readonly icon: KoboyoIconName;
}

const FEATURES: Feature[] = [
  {
    title: 'Three ways in',
    body: 'Type it, say it, or photograph your shelf. Typing always works, even when the rest does not.',
    icon: 'takingPhotoCamera',
  },
  {
    title: 'You always know who wrote it',
    body: 'Tested by a person, or written by a model with the quantities marked as estimates.',
    icon: 'tick',
  },
  {
    title: 'Cook mode',
    body: 'One step at a time, big enough to read across a kitchen, with the screen kept awake.',
    icon: 'kitchenTimer',
  },
  {
    title: 'A kitchen that keeps itself',
    body: 'Cooking takes things out, ticking the market list puts them back. No stock-taking.',
    icon: 'basket',
  },
];

export interface SiteFeaturesProps {
  readonly variant?: FeatureVariant;
  readonly features?: readonly Feature[];
  readonly className?: string;
}

export function SiteFeatures({
  variant = 'alternating',
  features = FEATURES,
  className,
}: SiteFeaturesProps) {
  if (variant === 'bento') {
    return (
      <SiteSection className={className}>
        <SiteEyebrow>What it does</SiteEyebrow>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Repeat each={[...features]}>
            {(feature: Feature, index: number) => (
              <Tile
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                body={feature.body}
                tone={index === 0 ? 'sky' : 'default'}
                className={index === 0 ? 'md:col-span-2 md:row-span-2' : undefined}
              />
            )}
          </Repeat>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'carousel') {
    return (
      <SiteSection className={className}>
        <SiteEyebrow>What it does</SiteEyebrow>
        <Carousel label="Features" className="mt-4">
          <Repeat each={[...features]}>
            {(feature: Feature) => (
              <div key={feature.title} className="w-[280px] shrink-0 snap-start">
                <Tile icon={feature.icon} title={feature.title} body={feature.body} />
              </div>
            )}
          </Repeat>
        </Carousel>
      </SiteSection>
    );
  }

  if (variant === 'icon-grid') {
    return (
      <SiteSection tone="white" className={className}>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          <Repeat each={[...features]}>
            {(feature: Feature) => (
              <div key={feature.title}>
                <span className="grid h-12 w-12 place-items-center rounded-blade-sm bg-sky-soft text-sky-on">
                  <KoboyoIcon name={feature.icon} size={24} />
                </span>
                <p className="mt-3 font-display text-md font-extrabold tracking-display">
                  {feature.title}
                </p>
                <p className="mt-1 text-sm text-ink-2">{feature.body}</p>
              </div>
            )}
          </Repeat>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'screenshot') {
    return (
      <SiteSection tone="sky" className={className}>
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[20ch] font-display text-3xl font-extrabold tracking-display">
            Three meals, and what each one needs.
          </h2>
          <p className="mt-3 max-w-[48ch] text-lg text-ink-2">
            The one with nothing to buy says so at the top. The one that needs a shop says that too.
          </p>
          <div className="mt-8 grid w-full max-w-[840px] gap-4 sm:grid-cols-3">
            <MealCard name="Jollof Rice" source="seed" minutes={45} match="nothing_to_buy" />
            <MealCard name="Egusi Soup" source="ai" minutes={70} match="strong_match" />
            <MealCard name="Ewa Agoyin" source="seed" minutes={55} match="needs_a_shop" />
          </div>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'comparison') {
    const rows = [
      { feature: 'Works from what you have', us: true, them: false },
      { feature: 'Nigerian food first-class', us: true, them: false },
      { feature: 'Says who wrote each recipe', us: true, them: false },
      { feature: 'No pantry to maintain', us: true, them: false },
      { feature: 'Thousands of recipes', us: false, them: true },
    ];

    return (
      <SiteSection tone="white" className={className}>
        <SiteEyebrow>Honestly</SiteEyebrow>
        <h2 className="mb-6 font-display text-3xl font-extrabold tracking-display">
          Where we win, and where we do not.
        </h2>
        <table className="w-full max-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="border-b-bold border-ink pb-2 text-left text-xs font-extrabold uppercase tracking-overline text-ink-3" />
              <th className="w-[110px] border-b-bold border-ink pb-2 text-center text-xs font-extrabold uppercase tracking-overline text-ink">
                Kinnijije
              </th>
              <th className="w-[110px] border-b-bold border-ink pb-2 text-center text-xs font-extrabold uppercase tracking-overline text-ink-3">
                A recipe site
              </th>
            </tr>
          </thead>
          <tbody>
            <Repeat each={rows}>
              {(row: (typeof rows)[number]) => (
                <tr key={row.feature}>
                  <td className="border-b border-line py-3 text-md text-ink-2">{row.feature}</td>
                  <td className="border-b border-line py-3 text-center">
                    {row.us ? (
                      <KoboyoIcon name="tick" size={18} className="text-success" />
                    ) : (
                      <span className="text-ink-4">—</span>
                    )}
                  </td>
                  <td className="border-b border-line py-3 text-center">
                    {row.them ? (
                      <KoboyoIcon name="tick" size={18} className="text-ink-3" />
                    ) : (
                      <span className="text-ink-4">—</span>
                    )}
                  </td>
                </tr>
              )}
            </Repeat>
          </tbody>
        </table>
        {/* The honest row is why this variant is worth having. */}
        <p className="mt-4 max-w-[52ch] text-sm text-ink-3">
          A recipe site has more recipes. We have the ones you can cook tonight.
        </p>
      </SiteSection>
    );
  }

  return (
    <SiteSection className={className}>
      <SiteEyebrow>What it does</SiteEyebrow>
      <div className="mt-4 flex flex-col gap-11">
        <Repeat each={[...features]}>
          {(feature: Feature, index: number) => (
            <div
              key={feature.title}
              className={cn(
                'grid items-center gap-8 md:grid-cols-2',
                index % 2 === 1 && 'md:[&>*:first-child]:order-2',
              )}
            >
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-blade-sm bg-sky-soft text-sky-on">
                  <KoboyoIcon name={feature.icon} size={24} />
                </span>
                <h3 className="mt-4 font-display text-2xl font-extrabold tracking-display">
                  {feature.title}
                </h3>
                <p className="mt-2 max-w-[46ch] text-lg text-ink-2">{feature.body}</p>
              </div>
              <MediaContainer ratio="4/3" fallbackIcon={feature.icon} />
            </div>
          )}
        </Repeat>
      </div>
    </SiteSection>
  );
}

/* ---------- s06 · Social proof — 6 variants ---------- */

export type ProofVariant =
  | 'logo-wall'
  | 'cards'
  | 'big-quote'
  | 'star-summary'
  | 'counter-row'
  | 'press';

export interface Testimonial {
  readonly quote: string;
  readonly name: string;
  readonly place: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'I stopped ordering out on Wednesdays. That is the whole review.',
    name: 'Ada',
    place: 'Lagos',
  },
  {
    quote: 'It found me a meal from half a yam and some spinach. I would not have thought of it.',
    name: 'Tunde',
    place: 'Ibadan',
  },
  {
    quote: 'The one thing I trust is that it tells me when a recipe was written by a machine.',
    name: 'Chidinma',
    place: 'Abuja',
  },
];

export interface SiteProofProps {
  readonly variant?: ProofVariant;
  readonly testimonials?: readonly Testimonial[];
  readonly className?: string;
}

/**
 * Proof.
 *
 * **Every variant here needs real users to point at.** Shipping a testimonial
 * section before anyone has said anything is the fastest way to make a whole
 * site read as invented.
 */
export function SiteProof({
  variant = 'cards',
  testimonials = TESTIMONIALS,
  className,
}: SiteProofProps) {
  if (variant === 'big-quote') {
    const first = testimonials[0];
    return (
      <SiteSection tone="sky" className={className}>
        <div className="flex flex-col items-center text-center">
          <blockquote className="max-w-[24ch] font-display text-4xl font-extrabold leading-tight tracking-display">
            “{first?.quote}”
          </blockquote>
          <p className="mt-5 flex items-center gap-2 text-sm font-extrabold text-ink-3">
            <Blob name={`${first?.name}@kinnijije.ng`} size={30} />
            {first?.name}, {first?.place}
          </p>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'star-summary') {
    return (
      <SiteSection tone="white" className={className}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Rating value={4.6} readOnly count={412} size="lg" />
          <p className="font-display text-2xl font-extrabold tracking-display">
            4.6 from 412 cooks
          </p>
          {/* The sample size is part of the claim, never omitted. */}
          <p className="max-w-[44ch] text-md text-ink-2">
            Every rating comes from someone who actually cooked the meal, not from someone who
            saved it.
          </p>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'counter-row') {
    const counts = [
      { label: 'Meals cooked', value: '48,200' },
      { label: 'Tested recipes', value: '412' },
      { label: 'Cooks', value: '1,204' },
      { label: 'Corrections applied', value: '318' },
    ];

    return (
      <SiteSection tone="ink" className={className}>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          <Repeat each={counts}>
            {(count: (typeof counts)[number]) => (
              <div key={count.label} className="text-center">
                <p className="font-mono text-4xl font-bold tnum text-ink-inv">{count.value}</p>
                <p className="mt-1 text-sm text-ink-inv/70">{count.label}</p>
              </div>
            )}
          </Repeat>
        </div>
      </SiteSection>
    );
  }

  if (variant === 'logo-wall' || variant === 'press') {
    const names = ['TechCabal', 'Zikoko', 'BellaNaija', 'Pulse NG', 'Guardian Life'];
    return (
      <SiteSection tone="white" className={className}>
        <p className="mb-6 text-center text-xs font-extrabold uppercase tracking-overline text-ink-3">
          {variant === 'press' ? 'Written about in' : 'As seen in'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-4">
          <Repeat each={names}>
            {(name: string) => (
              <span
                key={name}
                className="font-display text-lg font-extrabold tracking-display text-ink-4"
              >
                {name}
              </span>
            )}
          </Repeat>
        </div>
      </SiteSection>
    );
  }

  return (
    <SiteSection className={className}>
      <SiteEyebrow>From cooks</SiteEyebrow>
      <div className="mt-4 grid gap-5 md:grid-cols-3">
        <Repeat each={[...testimonials]}>
          {(item: Testimonial) => (
            <figure
              key={item.name}
              className="m-0 rounded-blade-lg border border-line-2 bg-white p-6"
            >
              <blockquote className="text-md text-ink">“{item.quote}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-2 text-sm font-extrabold text-ink-3">
                <Blob name={`${item.name}@kinnijije.ng`} size={28} />
                {item.name}, {item.place}
              </figcaption>
            </figure>
          )}
        </Repeat>
      </div>
    </SiteSection>
  );
}

/* ---------- s07 · Recipe gallery — 5 variants ---------- */

export type GalleryVariant = 'grid' | 'carousel' | 'masonry' | 'category-tabs' | 'search-preview';

const GALLERY = [
  { name: 'Jollof Rice, Party Style', source: 'seed' as const, minutes: 45 },
  { name: 'Egusi Soup & Pounded Yam', source: 'seed' as const, minutes: 70 },
  { name: 'Efo Riro', source: 'seed' as const, minutes: 40 },
  { name: 'Ewa Agoyin & Plantain', source: 'seed' as const, minutes: 55 },
  { name: 'Suya Skewers', source: 'ai' as const, minutes: 35 },
  { name: 'Moi Moi', source: 'seed' as const, minutes: 90 },
];

export interface SiteGalleryProps {
  readonly variant?: GalleryVariant;
  readonly className?: string;
}

/**
 * The recipes, shown.
 *
 * **Every card here is the real `MealCard`** — so the gallery cannot show a
 * treatment the app does not ship, and the provenance tag comes along whether
 * the marketing site remembers it or not.
 */
export function SiteGallery({ variant = 'grid', className }: SiteGalleryProps) {
  const cards = (
    <Repeat each={GALLERY}>
      {(recipe: (typeof GALLERY)[number]) => (
        <MealCard
          key={recipe.name}
          name={recipe.name}
          source={recipe.source}
          minutes={recipe.minutes}
          match="strong_match"
        />
      )}
    </Repeat>
  );

  if (variant === 'carousel') {
    return (
      <SiteSection className={className}>
        <SiteEyebrow>Tested recipes</SiteEyebrow>
        <Carousel label="Recipes" className="mt-4">
          <Repeat each={GALLERY}>
            {(recipe: (typeof GALLERY)[number]) => (
              <div key={recipe.name} className="w-[260px] shrink-0 snap-start">
                <MealCard
                  name={recipe.name}
                  source={recipe.source}
                  minutes={recipe.minutes}
                  match="strong_match"
                />
              </div>
            )}
          </Repeat>
        </Carousel>
      </SiteSection>
    );
  }

  if (variant === 'masonry') {
    return (
      <SiteSection className={className}>
        <SiteEyebrow>Tested recipes</SiteEyebrow>
        <div className="mt-4 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
          {cards}
        </div>
      </SiteSection>
    );
  }

  if (variant === 'category-tabs') {
    const categories = ['All', 'Rice', 'Soup', 'Under 30 min', 'One pot'];
    return (
      <SiteSection className={className}>
        <SiteEyebrow>Tested recipes</SiteEyebrow>
        <div className="mb-5 mt-4 flex flex-wrap gap-2">
          <Repeat each={categories}>
            {(category: string, index: number) => (
              <button
                key={category}
                type="button"
                className={cn(
                  'rounded-pill border px-4 py-2 text-sm font-extrabold transition-colors',
                  index === 0
                    ? 'border-ink bg-ink text-ink-inv'
                    : 'border-line-2 bg-white text-ink-2 hover:border-ink hover:text-ink',
                )}
              >
                {category}
              </button>
            )}
          </Repeat>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>
      </SiteSection>
    );
  }

  if (variant === 'search-preview') {
    return (
      <SiteSection tone="sky" className={className}>
        <div className="flex flex-col items-center text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-display">
            Try it with something you have.
          </h2>
          <div className="mt-6 w-full max-w-[520px] text-left">
            <ChipInputPreview />
          </div>
          <div className="mt-8 grid w-full max-w-[840px] gap-4 sm:grid-cols-3">
            <Repeat each={GALLERY.slice(0, 3)}>
              {(recipe: (typeof GALLERY)[number]) => (
                <MealCard
                  key={recipe.name}
                  name={recipe.name}
                  source={recipe.source}
                  minutes={recipe.minutes}
                  match="strong_match"
                  compact
                />
              )}
            </Repeat>
          </div>
        </div>
      </SiteSection>
    );
  }

  return (
    <SiteSection className={className}>
      <SiteEyebrow>Tested recipes</SiteEyebrow>
      <h2 className="mb-6 font-display text-3xl font-extrabold tracking-display">
        Written and cooked by people.
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>
      <div className="mt-8 flex justify-center">
        <Button variant="secondary" size="lg">
          See all 412
        </Button>
      </div>
    </SiteSection>
  );
}

/** A read-only basket, for the search-preview gallery. */
function ChipInputPreview() {
  return (
    <div className="rounded-blade border-bold border-ink bg-white p-3">
      <ul className="flex flex-wrap gap-2">
        <Repeat each={['Rice', 'Tomatoes', 'Onion']}>
          {(item: string) => (
            <li
              key={item}
              className="inline-flex items-center gap-2 rounded-blade-xs border border-ink bg-paper-2 px-3 py-[6px] text-sm font-extrabold"
            >
              <KoboyoIcon name="editPencil" size={13} />
              {item}
            </li>
          )}
        </Repeat>
      </ul>
    </div>
  );
}
