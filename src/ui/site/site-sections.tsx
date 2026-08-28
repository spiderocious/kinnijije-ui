import type { ReactNode } from "react";
import { Repeat } from "meemaw";

import { Blob, KoboyoIcon, type KoboyoIconName } from "@icons";
import { cn } from "@shared/utils/cn";
import { Button } from "@ui/primitives";
import { MealCard } from "@ui/domain";

/**
 * The marketing site's section families.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview-site/s01-header.html
 *                                                               … s11-footer.html
 *
 * The site is the same stance at a **louder register** — the blade, the sky and
 * the three type families are identical; only the scale changes. Display type
 * goes up to 60–78px here, which it never does in the app.
 *
 * **Every hero variant states the SAME promise in the same words.** Only the
 * amount of evidence beside it changes. That is what stops a marketing site
 * drifting into claims the product does not make.
 *
 * Sections animate on scroll ONCE — never every time they re-enter the
 * viewport, which is the difference between polish and a page that will not sit
 * still.
 */

/* ---------- The shared section frame ---------- */

export interface SectionProps {
  /** A tinted band. `paper` is the default ground. */
  readonly tone?: "paper" | "white" | "sky" | "ink";
  readonly className?: string;
  readonly children: ReactNode;
}

const SECTION_TONE = {
  paper: "bg-paper text-ink",
  white: "bg-white text-ink",
  sky: "bg-sky-soft text-ink",
  ink: "bg-ink text-ink-inv",
} as const;

export function SiteSection({
  tone = "paper",
  className,
  children,
}: SectionProps) {
  return (
    <section className={cn("px-6 py-11", SECTION_TONE[tone], className)}>
      <div className="mx-auto max-w-[1080px]">{children}</div>
    </section>
  );
}

/** The overline that opens most sections. */
export function SiteEyebrow({ children }: { readonly children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-extrabold uppercase tracking-overline text-ink-3">
      {children}
    </p>
  );
}

/* ---------- Header ---------- */

export interface SiteHeaderProps {
  readonly onStart?: () => void;
  readonly onSignIn?: () => void;
}

export function SiteHeader({ onStart, onSignIn }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-nav border-b border-line bg-paper/95 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4">
        <span className="inline-flex items-center gap-2">
          <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-blade-xs bg-sky text-white">
            {/* Lighter than the nav marks — it sits on solid sky, where a
                    thinner line holds up and a heavy one fills in. */}
            <KoboyoIcon name="utensilsCrossed" size={15} weight={0.75} alone />
          </span>
          <span className="font-display text-xl font-extrabold tracking-display">
            Kinnijije
          </span>
        </span>

        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#how"
            className="text-sm font-extrabold text-ink-2 hover:text-ink"
          >
            How it works
          </a>
          <a
            href="#recipes"
            className="text-sm font-extrabold text-ink-2 hover:text-ink"
          >
            Recipes
          </a>
          <a
            href="#pricing"
            className="text-sm font-extrabold text-ink-2 hover:text-ink"
          >
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="tertiary" size="sm" onClick={onSignIn}>
            Sign in
          </Button>
          <Button size="sm" onClick={onStart}>
            Start cooking
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */

export type HeroVariant =
  | "centred"
  | "split"
  | "blob"
  | "testimonial"
  | "returning";

export interface SiteHeroProps {
  readonly variant?: HeroVariant;
  readonly onStart?: () => void;
  readonly className?: string;
}

/** The one promise, in the same words, at five levels of evidence. */
const HEADLINE = "Your whole kitchen, planned.";
const BODY =
  "Tell it what is in your kitchen and it will tell you what to cook tonight — Nigerian and West African food, first.";

export function SiteHero({
  variant = "centred",
  onStart,
  className,
}: SiteHeroProps) {
  if (variant === "split") {
    return (
      <SiteSection className={className}>
        <div className="grid items-center gap-9 md:grid-cols-2">
          <div>
            <h1 className="font-display text-5xl font-extrabold leading-none tracking-display">
              {HEADLINE}
            </h1>
            <p className="mt-4 max-w-[46ch] text-lg text-ink-2">{BODY}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={onStart}>
                Start cooking
              </Button>
              <Button size="lg" variant="secondary">
                See a sample recipe
              </Button>
            </div>
          </div>
          {/* Proof that the product exists — a real component, not a mockup. */}
          <MealCard
            name="Jollof Rice, Party Style"
            source="seed"
            minutes={45}
            match="nothing_to_buy"
            heroImage={{ kind: "photo" }}
            matchLine="Uses 6 of your 6 things"
          />
        </div>
      </SiteSection>
    );
  }

  if (variant === "blob") {
    return (
      <SiteSection tone="sky" className={className}>
        <div className="flex flex-col items-center text-center">
          <Blob name="chef" size={104} expression="happy" animate="hover" />
          <h1 className="mt-5 font-display text-5xl font-extrabold leading-none tracking-display">
            I will find you dinner.
          </h1>
          <p className="mt-4 max-w-[52ch] text-lg text-ink-2">{BODY}</p>
          <Button size="lg" className="mt-6" onClick={onStart}>
            Show me
          </Button>
        </div>
      </SiteSection>
    );
  }

  if (variant === "testimonial") {
    return (
      <SiteSection className={className}>
        <div className="flex flex-col items-center text-center">
          <blockquote className="max-w-[24ch] font-display text-4xl font-extrabold leading-tight tracking-display">
            “I stopped ordering out on Wednesdays. That is the whole review.”
          </blockquote>
          <p className="mt-4 flex items-center gap-2 text-sm font-extrabold text-ink-3">
            <Blob name="ada@kinnijije.ng" size={28} />
            Ada, Lagos
          </p>
          <p className="mt-7 font-display text-2xl font-extrabold tracking-display">
            {HEADLINE}
          </p>
          <Button size="lg" className="mt-5" onClick={onStart}>
            Start cooking
          </Button>
        </div>
      </SiteSection>
    );
  }

  if (variant === "returning") {
    return (
      <SiteSection tone="white" className={className}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-display">
              Welcome back.
            </h1>
            <p className="mt-1 text-md text-ink-2">
              Your kitchen is empty — tell us what you have.
            </p>
          </div>
          <Button size="lg" onClick={onStart}>
            Open the app
          </Button>
        </div>
      </SiteSection>
    );
  }

  return (
    <SiteSection className={className}>
      <div className="flex flex-col items-center text-center">
        <h1 className="max-w-[16ch] font-display text-6xl font-extrabold leading-none tracking-display">
          {HEADLINE}
        </h1>
        <p className="mt-5 max-w-[54ch] text-lg text-ink-2">{BODY}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={onStart}>
            Start cooking
          </Button>
          <Button size="lg" variant="secondary">
            See a sample recipe
          </Button>
        </div>
      </div>
    </SiteSection>
  );
}

/* ---------- How it works ---------- */

export interface HowStep {
  readonly icon: KoboyoIconName;
  readonly title: string;
  readonly body: string;
}

/** Three steps, always three. The product genuinely is three steps. */
const STEPS: HowStep[] = [
  {
    icon: "basket",
    title: "Say what you have",
    body: "Type it, say it into your phone, or take a photo of your fridge.",
  },
  {
    icon: "cookingPot",
    title: "Get three meals",
    body: "Mostly from what is already there, with what you would need to buy.",
  },
  {
    icon: "kitchenTimer",
    title: "Cook one",
    body: "Full-screen steps, timers, and the screen stays awake.",
  },
];

export function SiteHowItWorks({
  layout = "across",
  className,
}: {
  readonly layout?: "across" | "timeline";
  readonly className?: string;
}) {
  return (
    <SiteSection tone="white" className={className}>
      <SiteEyebrow>How it works</SiteEyebrow>
      <h2 className="mb-8 font-display text-3xl font-extrabold tracking-display">
        Three steps. That is the whole thing.
      </h2>

      <div
        className={cn(
          layout === "across"
            ? "grid gap-6 md:grid-cols-3"
            : "flex flex-col gap-6",
        )}
      >
        <Repeat each={STEPS}>
          {(step: HowStep, index: number) => (
            <div
              key={step.title}
              className={cn(
                "rounded-blade-lg border border-line-2 bg-paper p-6",
                layout === "timeline" && "flex items-start gap-5",
              )}
            >
              <span className="mb-3 flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-blade-xs bg-sky-soft text-sky-on">
                  <KoboyoIcon name={step.icon} size={22} />
                </span>
                <span className="font-mono text-sm font-bold tnum text-ink-3">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </span>
              <span className="block">
                <span className="block font-display text-lg font-extrabold tracking-display">
                  {step.title}
                </span>
                <span className="mt-1 block text-md text-ink-2">
                  {step.body}
                </span>
              </span>
            </div>
          )}
        </Repeat>
      </div>
    </SiteSection>
  );
}

/* ---------- Trust — the site's version of the honesty claim ---------- */

export function SiteTrust({ className }: { readonly className?: string }) {
  return (
    <SiteSection tone="sky" className={className}>
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <SiteEyebrow>What we promise</SiteEyebrow>
          <h2 className="font-display text-3xl font-extrabold tracking-display">
            You always know who wrote the recipe.
          </h2>
          <p className="mt-3 max-w-[48ch] text-md text-ink-2">
            Recipes written and tested by a person are marked <b>✓ Verified</b>.
            When nothing tested matches your kitchen, we ask a model and label
            it <b>◆ Made by AI</b> — with the quantities marked as estimates and
            the time padded, because models under-estimate.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <MealCard
            name="Jollof Rice, Party Style"
            source="seed"
            minutes={45}
            match="nothing_to_buy"
            compact
          />
          <MealCard
            name="Egusi Soup"
            source="ai"
            minutes={70}
            match="strong_match"
            compact
          />
        </div>
      </div>
    </SiteSection>
  );
}

/* ---------- Pricing ---------- */

export interface PricingTier {
  readonly name: string;
  readonly price: string;
  readonly period?: string;
  readonly body: string;
  readonly features: readonly string[];
  readonly cta: string;
  readonly featured?: boolean;
}

export function SitePricing({
  tiers,
  className,
}: {
  readonly tiers: readonly PricingTier[];
  readonly className?: string;
}) {
  return (
    <SiteSection tone="white" className={className}>
      <SiteEyebrow>Pricing</SiteEyebrow>
      <h2 className="mb-8 font-display text-3xl font-extrabold tracking-display">
        Free to cook. Pay only if you want more.
      </h2>

      <div className="grid gap-5 md:grid-cols-2">
        <Repeat each={[...tiers]}>
          {(tier: PricingTier) => (
            <div
              key={tier.name}
              className={cn(
                "flex flex-col rounded-blade-lg border p-6",
                tier.featured === true
                  ? "border-bold border-ink bg-paper shadow-drop"
                  : "border-line-2 bg-paper",
              )}
            >
              <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
                {tier.name}
              </p>
              <p className="mt-2 font-mono text-4xl font-bold tnum">
                {tier.price}
                {tier.period !== undefined && (
                  <span className="ml-1 font-sans text-md font-semibold text-ink-3">
                    {tier.period}
                  </span>
                )}
              </p>
              <p className="mt-2 text-md text-ink-2">{tier.body}</p>

              <ul className="mt-5 flex flex-1 flex-col gap-2">
                <Repeat each={[...tier.features]}>
                  {(feature: string) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-ink-2"
                    >
                      <KoboyoIcon
                        name="tick"
                        size={15}
                        className="mt-[2px] shrink-0 text-success"
                      />
                      {feature}
                    </li>
                  )}
                </Repeat>
              </ul>

              <Button
                className="mt-6"
                fullWidth
                variant={tier.featured === true ? "primary" : "secondary"}
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

/* ---------- FAQ ---------- */

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export function SiteFaq({
  items,
  className,
}: {
  readonly items: readonly FaqItem[];
  readonly className?: string;
}) {
  return (
    <SiteSection className={className}>
      <SiteEyebrow>Questions</SiteEyebrow>
      <h2 className="mb-6 font-display text-3xl font-extrabold tracking-display">
        The things people ask
      </h2>

      <div className="flex flex-col gap-3">
        <Repeat each={[...items]}>
          {(item: FaqItem) => (
            <details
              key={item.question}
              className="group rounded-blade border border-line-2 bg-white px-5 py-4"
            >
              <summary className="cursor-pointer list-none font-display text-md font-extrabold tracking-display marker:hidden">
                {item.question}
              </summary>
              <p className="mt-2 text-md text-ink-2">{item.answer}</p>
            </details>
          )}
        </Repeat>
      </div>
    </SiteSection>
  );
}

/* ---------- Final CTA + footer ---------- */

export function SiteFinalCta({ onStart }: { readonly onStart?: () => void }) {
  return (
    <SiteSection tone="ink">
      <div className="flex flex-col items-center text-center">
        <h2 className="max-w-[18ch] font-display text-4xl font-extrabold leading-none tracking-display">
          What is in your kitchen right now?
        </h2>
        <p className="mt-4 max-w-[46ch] text-lg text-ink-inv/80">
          Three meals, in about ten seconds. No account needed to try it.
        </p>
        <Button size="lg" onDark className="mt-6" onClick={onStart}>
          Start cooking
        </Button>
      </div>
    </SiteSection>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper px-6 py-9">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-start justify-between gap-8">
        <div>
          <span className="inline-flex items-center gap-2">
            <KoboyoIcon name="cookingPot" size={22} className="text-sky" />
            <span className="font-display text-lg font-extrabold tracking-display">
              Kinnijije
            </span>
          </span>
          <p className="mt-2 max-w-[36ch] text-sm text-ink-3">
            What to cook, from what you have. Nigerian and West African food,
            first.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-extrabold uppercase tracking-overline text-ink-4">
              Product
            </p>
            <a href="#how" className="text-ink-2 hover:text-ink">
              How it works
            </a>
            <a href="#pricing" className="text-ink-2 hover:text-ink">
              Pricing
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-extrabold uppercase tracking-overline text-ink-4">
              Company
            </p>
            <a href="#about" className="text-ink-2 hover:text-ink">
              About
            </a>
            <a href="#ai" className="text-ink-2 hover:text-ink">
              How we use AI
            </a>
          </div>
        </nav>
      </div>
    </footer>
  );
}
