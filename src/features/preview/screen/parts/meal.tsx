import { Button } from '@ui/primitives';
import { Figure, Stat, StatSkeleton } from '@ui/display';
import { MealCard, MealCardError, MealCardSkeleton, Provenance, ProvenanceSkeleton } from '@ui/domain';

import { Api, Demo, Grid, Note, Row, Rule, Section, Specimen, StateCard, StateGrid } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/80-meal-card.html
 *                                                          290-provenance-pair.html
 *                                                          20-figure.html
 *                                                          82-stat.html
 */

export function ProvenancePart() {
  return (
    <Specimen
      title="The provenance pair"
      spec="290-provenance-pair.html"
      description="The single most important contract in this system. Verified and AI, rendered identically everywhere."
    >
      <Rule>
        <b>The label string is owned by the component.</b> No screen may render its own variant. In
        the shipped app the same recipe read “✓ Verified”, “Verified recipe” and “✓ Verified”
        across three consecutive screens — and the AI branch was worse.
      </Rule>

      <Section label="THE TWO LABELS">
        <Demo>
          <div className="flex flex-col gap-5">
            <div>
              <Provenance source="seed" />
              <p className="mt-2 max-w-[70ch] text-sm text-ink-2">
                Written and tested by a person. Quantities are exact, the time is measured. This is
                the seed — the product’s moat.
              </p>
            </div>
            <div>
              <Provenance source="ai" />
              <p className="mt-2 max-w-[70ch] text-sm text-ink-2">
                Written by a model. Quantities are estimates, the time is padded 30%, and every
                figure carries <code>≈</code>.
              </p>
            </div>
          </div>
        </Demo>
        <Note>
          Grape, not caution — being machine-written is not a warning, it is a different kind of
          claim.
        </Note>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="seed" when="A person wrote and tested it.">
              <Provenance source="seed" />
            </StateCard>
            <StateCard name="ai" when="A model wrote it.">
              <Provenance source="ai" />
            </StateCard>
            <StateCard name="unknown" when="Provenance missing — which is itself a bug, so it renders loudly.">
              <Provenance source={undefined} />
            </StateCard>
            <StateCard name="skeleton" when="Loading, at the true measure.">
              <ProvenanceSkeleton />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Rule tone="warn">
        This is a <b>required prop</b> on the meal card. A meal without a provenance tag does not
        render at all — which makes the three-different-labels bug structurally impossible rather
        than merely discouraged.
      </Rule>

      <Section label="API">
        <Api>{`<Provenance source* size?="sm|md" />

// the LABEL STRING is owned here — no screen may render its own variant
// an unknown source renders CRITICAL, because a recipe without
//   provenance is a data bug, not a neutral absence
// isApproximate(source) derives the ≈ — never passed separately,
//   so a card cannot claim "Verified" beside a padded time`}</Api>
      </Section>
    </Specimen>
  );
}

export function FigurePart() {
  return (
    <Specimen
      title="Figure"
      spec="20-figure.html · 133-status-approximate.html"
      description="The tabular number primitive. Every count, time, price and quantity renders through it."
    >
      <Rule>
        <b>The ≈ marker is owned here, not remembered by a screen.</b> The shipped app showed the
        same AI recipe as <code>≈30M</code> in favourites and <code>30 MIN</code> on two other
        screens — which is exactly what happens when the marker is a screen’s responsibility.
      </Rule>

      <Section label="SIZES">
        <Demo>
          <Row className="items-baseline">
            <Figure value="1,204" size="sm" />
            <Figure value="1,204" size="md" />
            <Figure value="1,204" size="lg" />
            <Figure value="1,204" size="xl" />
            <Figure value="1,204" size="2xl" />
            <Figure value="1,204" size="3xl" />
          </Row>
        </Demo>
      </Section>

      <Section label="EXACT vs APPROXIMATE">
        <Demo>
          <Grid cols={2}>
            <div>
              <p className="mb-2 text-sm font-extrabold text-ink-3">A verified recipe</p>
              <Figure value={45} unit="min" size="xl" />
              <p className="mt-1 text-sm text-ink-2">A tested quantity. No marker.</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-extrabold text-ink-3">An AI recipe</p>
              <Figure value={70} unit="min" approximate size="xl" />
              <p className="mt-1 text-sm text-ink-2">Padded 30%, and it says so.</p>
            </div>
          </Grid>
        </Demo>
        <Note>
          Screen readers hear “about 70 min” — the glyph is hidden and the word is spoken, so the
          honesty survives without sight.
        </Note>
      </Section>

      <Section label="WITH UNITS">
        <Demo>
          <Row className="items-baseline">
            <Figure value={45} unit="min" size="lg" />
            <Figure value={4} unit="serves" size="lg" />
            <Figure value="3,200" unit="₦" size="lg" />
            <Figure value={250} unit="g" size="lg" approximate />
            <Figure value="1,204" size="lg" muted />
          </Row>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function MealCardPart() {
  return (
    <Specimen
      title="Meal card"
      spec="80-meal-card.html"
      description="The object the whole product exists to show. Three meals, three cards, one decision."
    >
      <Rule>
        <b>The provenance contract lives here.</b> Every meal card renders its{' '}
        <code>source × heroImageKind × approximate</code> triple in one vocabulary.{' '}
        <code>source</code> is a required prop and <code>approximate</code> is <b>derived</b> from
        it, so a card cannot claim “Verified” beside a padded time.
      </Rule>

      <Section label="THREE MEALS, ONE DECISION">
        <Demo tone="plain">
          <Grid cols={3}>
            <MealCard
              name="Jollof Rice, Party Style"
              source="seed"
              minutes={45}
              match="nothing_to_buy"
              heroImage={{ kind: 'photo' }}
              matchLine="Uses 6 of your 6 things"
            />
            <MealCard
              name="Egusi Soup & Pounded Yam"
              source="ai"
              minutes={70}
              match="strong_match"
              heroImage={{ kind: 'ai_image' }}
              matchLine="Uses 5 of your 6 things"
            />
            <MealCard
              name="Ewa Agoyin & Plantain"
              source="seed"
              minutes={55}
              match="strong_match"
              heroImage={{ kind: 'placeholder' }}
              matchLine="Uses 4 of your 6 things"
            />
          </Grid>
        </Demo>
        <Note>
          The middle card is the AI one — note it carries the <code>≈</code> on its time{' '}
          <i>and</i> the AI-image tag on its hero. Both derive from one fact.
        </Note>
      </Section>

      <Section label="THE WEAK MATCH">
        <Demo tone="plain">
          <Grid cols={3}>
            <MealCard
              name="Jollof Rice"
              source="seed"
              minutes={45}
              match="nothing_to_buy"
              matchLine="Uses 6 of your 6 things"
            />
            <MealCard
              name="Indomie, upgraded"
              source="ai"
              minutes={20}
              match="needs_a_shop"
              matchLine="Uses 2 of your 6 things"
            />
            <div />
          </Grid>
        </Demo>
        <Note>
          A weak match demotes its CTA from primary to secondary, so the eye lands on the better
          card <b>without a word of explanation</b>.
        </Note>
      </Section>

      <Section label="COMPACT">
        <Demo tone="plain">
          <div className="flex max-w-[420px] flex-col gap-3">
            <MealCard name="Jollof Rice" source="seed" minutes={45} match="nothing_to_buy" compact />
            <MealCard name="Egusi Soup" source="ai" minutes={70} match="strong_match" compact />
          </div>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo tone="plain">
          <Grid cols={3}>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">default</p>
              <MealCard name="Jollof Rice" source="seed" minutes={45} match="nothing_to_buy" />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">skeleton</p>
              <MealCardSkeleton />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">error</p>
              <MealCardError />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">stale (offline)</p>
              <MealCard
                name="Jollof Rice"
                source="seed"
                minutes={45}
                match="strong_match"
                staleLabel="Offline · saved 41 min ago"
              />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">locked</p>
              <MealCard
                name="Jollof Rice"
                source="seed"
                minutes={45}
                match="strong_match"
                paused
              />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">empty (no suggestions)</p>
              <div className="flex flex-col items-start gap-3 rounded-blade-lg border border-dashed border-line-2 bg-paper-2 p-5">
                <p className="font-display text-md font-extrabold">Nothing matches yet</p>
                <p className="text-sm text-ink-2">
                  Add one or two more things and we will try again.
                </p>
                <Button variant="secondary" size="sm">
                  Add ingredients
                </Button>
              </div>
            </div>
          </Grid>
        </Demo>
        <Note>
          The skeleton mirrors <b>this exact card</b> — banner, photo, title, tag row, button — so
          nothing shifts when the data lands.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<MealCard name* source* minutes* match*
          heroImage? matchLine? onOpen? compact?
          staleLabel? paused? />

// \`source\` is REQUIRED — an unlabelled recipe cannot render, which
//   makes the three-different-Verified-labels bug structurally impossible
// \`approximate\` is DERIVED from source, never passed — so a card
//   cannot claim "Verified" beside a padded time
// a weak match demotes the CTA to secondary — the only signal, and
//   deliberately quiet
// an ai_image hero ALWAYS carries its tag`}</Api>
      </Section>
    </Specimen>
  );
}

export function StatPart() {
  return (
    <Specimen
      title="Stat"
      spec="82-stat.html · 83-stat-compact.html · 84-stat-icon.html"
      description="The everyday metric. Value first, label small, trend last."
    >
      <Rule>
        <b>The value is the loudest object</b>, the label is small above it, and the trend is
        subordinate to both. The value renders through <code>Figure</code> — a stat cannot format
        its own number, or two stats on one screen will disagree.
      </Rule>

      <Section label="WEIGHTS">
        <Demo tone="plain">
          <Grid cols={3}>
            <Stat label="Recipes published" value="248" delta="+12 this week" deltaTone="success" />
            <Stat label="Users" value="1,204" delta="+3.2%" deltaTone="success" />
            <Stat label="AI spend, 30 days" value="41.80" unit="$" delta="1,204 calls" />
          </Grid>
        </Demo>

        <Demo tone="plain">
          <Grid cols={4}>
            <Stat label="Cooked" value="12" weight="compact" />
            <Stat label="Saved" value="34" weight="compact" />
            <Stat label="This week" value="4" weight="compact" />
            <Stat label="Streak" value="6" unit="days" weight="compact" />
          </Grid>
        </Demo>

        <Demo tone="plain">
          <Grid cols={2}>
            <Stat label="In your kitchen" value="18" weight="icon" icon="basket" />
            <Stat label="Meals cooked" value="127" weight="icon" icon="cookingPot" />
          </Grid>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo tone="plain">
          <Grid cols={3}>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">default</p>
              <Stat label="Users" value="1,204" />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">skeleton</p>
              <StatSkeleton />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">error</p>
              <Stat label="Users" value={undefined} error="Could not load" />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">empty</p>
              <Stat label="Users" value={undefined} emptyLabel="No data yet" />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">stale</p>
              <Stat label="Users" value="1,204" staleLabel="41 min ago" />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">approximate</p>
              <Stat label="Est. spend" value="41.80" unit="$" approximate />
            </div>
          </Grid>
        </Demo>
        <Note>
          Every state keeps the same box, so a grid of six stats never reflows as they resolve at
          different times.
        </Note>
      </Section>
    </Specimen>
  );
}
