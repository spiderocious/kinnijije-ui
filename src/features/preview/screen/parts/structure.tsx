import { useState } from 'react';
import { Blob } from '@icons';
import { IconButton } from '@ui/primitives';
import { EmptyFiltered, EmptyState } from '@ui/feedback';
import { Card, CardSkeleton, Panel, Row } from '@ui/structure';

import { Api, Demo, Grid, Note, Rule, Section, Specimen, StateCard, StateGrid } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/196-card.html
 *                                                          197-panel.html
 *                                                          216-row-recipe.html … 221-row-person.html
 *                                                          156-empty-state.html · 157-empty-filtered.html
 */

export function CardPart() {
  return (
    <Specimen
      title="Card · Panel"
      spec="196-card.html · 197-panel.html"
      description="The base surface, and the grouping surface. The pane/plate distinction in one prop."
    >
      <Rule>
        <b>Its absence was the single load-bearing gap in the shipped system</b> — ten sites across
        the consumer app hand-wrote <code>border-2 + shadow-paint + rounded</code>, and the admin
        wrote the same string three times inside one file.
      </Rule>

      <Section label="LOUD vs QUIET">
        <Demo tone="plain">
          <Grid cols={2}>
            <Card variant="loud">
              <p className="font-display text-md font-extrabold tracking-display">
                Card — the loud surface
              </p>
              <p className="mt-1 text-sm text-ink-2">
                2.5px ink border, full drop-edge. For objects that <b>act</b>.
              </p>
            </Card>
            <Card variant="quiet">
              <p className="font-display text-md font-extrabold tracking-display">Card — quiet</p>
              <p className="mt-1 text-sm text-ink-2">
                Hairline, no shadow. For objects that <b>hold</b>.
              </p>
            </Card>
          </Grid>
        </Demo>
      </Section>

      <Section label="PANEL — the grouping surface for dense screens">
        <Demo tone="plain">
          <Panel className="max-w-[480px]">
            <Panel.Header
              title="Ingredients"
              action={<IconButton icon="plus" label="Add ingredient" size="sm" variant="tertiary" />}
            />
            <Panel.List>
              <Row.IngredientHave name="Long-grain rice" quantity="3 cups" />
              <Row.IngredientHave name="Scotch bonnet" quantity="2" />
              <Row.IngredientNeed name="Tin tomatoes" quantity="400 g" />
            </Panel.List>
          </Panel>
        </Demo>
        <Note>
          <b>Console screens are made of panels; a phone screen is made of cards.</b> A panel
          assumes it sits among siblings and carries its own header; a card assumes it is the
          object of attention.
        </Note>
      </Section>

      <Section label="STATES">
        <Demo tone="plain">
          <StateGrid>
            <StateCard name="default" when="Loaded.">
              <Card variant="quiet">
                <p className="text-sm">A card</p>
              </Card>
            </StateCard>
            <StateCard name="skeleton" when="Same box, same padding.">
              <CardSkeleton variant="quiet" />
            </StateCard>
            <StateCard name="empty" when="No content — the card does not render at all.">
              <div className="text-sm text-ink-3">
                <Card variant="quiet">{undefined}</Card>
                (nothing renders — never a placeholder box)
              </div>
            </StateCard>
            <StateCard name="panel empty" when="Nothing in the section.">
              <Panel>
                <Panel.Header title="Ingredients" />
                <Panel.Empty>No ingredients yet</Panel.Empty>
              </Panel>
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Card variant?="loud|quiet" padding?="none|sm|md|lg" as? />
<Panel><Panel.Header title* action?/><Panel.Body/><Panel.List/><Panel.Empty/></Panel>

// loud = acts (drop-edge). quiet = holds (hairline).
//   The pane/plate distinction, in one prop
// an empty card does not render — it never becomes a placeholder box`}</Api>
      </Section>
    </Specimen>
  );
}

export function RowsPart() {
  const [ticked, setTicked] = useState<Record<string, boolean>>({ a: false, b: true });

  return (
    <Specimen
      title="Rows"
      spec="216-row-recipe.html … 228-row-market.html"
      description="Purpose-built row shapes. The shipped system had one generic row; the domain needs sixteen."
    >
      <Rule>
        A <code>ListItem</code> with fifteen optional props is not a component, it is a config
        format — and every call site ends up passing a different subset, which is how the same
        class string got hand-copied across three admin files. Each row is <b>named for what it
        holds</b>.
      </Rule>

      <Section label="ROW — RECIPE (the curator's row)">
        <Demo tone="plain">
          <Panel>
            <Panel.List>
              <Row.Recipe
                name="Jollof Rice, Party Style"
                source="seed"
                minutes={45}
                serves={4}
                status="published"
                onPress={() => {}}
              />
              <Row.Recipe
                name="Egusi Soup & Pounded Yam"
                source="ai"
                minutes={70}
                serves={6}
                status="draft"
                onPress={() => {}}
              />
              <Row.Recipe
                name="Ewa Agoyin & Plantain"
                source="seed"
                minutes={55}
                serves={3}
                status="published"
                staleLabel="41 min ago"
              />
            </Panel.List>
          </Panel>
        </Demo>
        <Note>
          Photo, name, provenance, time, status — five facts, scannable down a column. The AI row
          carries its <code>≈</code> automatically.
        </Note>
      </Section>

      <Section label="ROW — INGREDIENT (have / need)">
        <Demo tone="plain">
          <Panel>
            <Panel.List>
              <Row.IngredientHave name="Long-grain rice" quantity="3 cups" />
              <Row.IngredientHave name="Scotch bonnet" quantity="2" />
              <Row.IngredientNeed name="Tin tomatoes" quantity="400 g" />
              <Row.IngredientNeed name="Half a yam" quantity="1 tuber" maybe />
            </Panel.List>
          </Panel>
        </Demo>
        <Note>
          <b>“Need” is neutral, never critical</b> — missing an ingredient is not an error, it is a
          shopping list. The fourth row is an uncertain photo match.
        </Note>
      </Section>

      <Section label="ROW — STEP">
        <Demo tone="plain">
          <Panel>
            <Panel.List>
              <Row.Step index={1} instruction="Blend the peppers, tomatoes and onion." done />
              <Row.Step index={2} instruction="Fry the paste until the oil separates." minutes={15} />
              <Row.Step index={3} instruction="Add the rice and stock, then cover." minutes={25} />
            </Panel.List>
          </Panel>
        </Demo>
      </Section>

      <Section label="ROW — PERSON (the console)">
        <Demo tone="plain">
          <div className="counter">
            <Panel>
              <Panel.List>
                <Row.Person
                  name="Ada Obi"
                  email="ada@kinnijije.ng"
                  role="admin"
                  status="active"
                  avatar={<Blob name="ada@kinnijije.ng" size={36} />}
                  onPress={() => {}}
                />
                <Row.Person
                  name="Tunde Bello"
                  email="tunde@kinnijije.ng"
                  role="user"
                  status="suspended"
                  avatar={<Blob name="tunde@kinnijije.ng" size={36} />}
                  onPress={() => {}}
                />
              </Panel.List>
            </Panel>
          </div>
        </Demo>
        <Note>
          Wrapped in <code>.counter</code> — the same rows at the curator's density, with no
          density prop anywhere.
        </Note>
      </Section>

      <Section label="ROW — MARKET">
        <Demo tone="plain">
          <Panel>
            <Panel.List>
              <Row.Market
                name="Tin tomatoes"
                quantity="400 g"
                ticked={ticked.a ?? false}
                onToggle={(next) => setTicked((current) => ({ ...current, a: next }))}
              />
              <Row.Market
                name="Groundnut oil"
                quantity="1 bottle"
                ticked={ticked.b ?? false}
                onToggle={(next) => setTicked((current) => ({ ...current, b: next }))}
              />
            </Panel.List>
          </Panel>
        </Demo>
        <Note>
          Ticking a market item is what tops the pantry back up — the standing kitchen is only ever
          maintained by side-effects of what the cook already does, never by stock-taking.
        </Note>
      </Section>

      <Section label="STATES">
        <Demo tone="plain">
          <Grid cols={2}>
            <Panel>
              <Panel.Header title="Skeleton — row-shaped, at the true measure" />
              <Panel.List>
                <Row.Skeleton />
                <Row.Skeleton />
                <Row.Skeleton />
              </Panel.List>
            </Panel>
            <Panel>
              <Panel.Header title="Locked — dimmed but still readable" />
              <Panel.List>
                <Row.Recipe
                  name="Jollof Rice, Party Style"
                  source="seed"
                  minutes={45}
                  serves={4}
                  status="published"
                  locked
                />
              </Panel.List>
            </Panel>
          </Grid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Row.Recipe name* source* minutes* serves* status* onPress? trailing? />
<Row.IngredientHave name* quantity* />
<Row.IngredientNeed name* quantity* maybe? />
<Row.Step index* instruction* done? minutes? />
<Row.Person name* email* role* status* avatar? />
<Row.Market name* quantity* ticked* onToggle* />
<Row.Skeleton />

// a NAMED row, not a generic ListItem with fifteen props
// the trailing slot takes at most ONE control — a second goes in
//   the action menu`}</Api>
      </Section>
    </Specimen>
  );
}

export function EmptyStatePart() {
  return (
    <Specimen
      title="Empty state"
      spec="156-empty-state.html · 157-empty-filtered.html"
      description="Succeeded, and the answer is zero. Often that is good news."
    >
      <Rule>
        <b>An empty state with no way out is a design failure.</b> Only two kinds legitimately have
        no action, and both must say which they are: <code>kind="good"</code> (the empty queue) and{' '}
        <code>kind="terminal"</code>. Every other empty state must supply an action — the
        discriminated union makes that a <b>compile error</b>, not a code-review note.
      </Rule>

      <Section label="WITH A WAY OUT">
        <Demo tone="plain">
          <EmptyState
            title="Nothing saved yet"
            body="Find a meal you like and tap the heart — it will wait here for you."
            action={{ label: 'Find a meal', onClick: () => {} }}
          />
        </Demo>
      </Section>

      <Section label="THE GOOD OUTCOME — deliberately no CTA">
        <Demo tone="plain">
          <EmptyState
            kind="good"
            title="You are all caught up"
            body="No corrections waiting. Nice."
          />
        </Demo>
        <Note>
          An empty review queue means the team is on top of it. Offering a CTA here would invent
          work that does not exist.
        </Note>
      </Section>

      <Section label="FILTERED — a different state entirely">
        <Demo tone="plain">
          <Grid cols={2}>
            <EmptyFiltered filterCount={1} onClear={() => {}} />
            <EmptyFiltered filterCount={3} onClear={() => {}} />
          </Grid>
        </Demo>
        <Note>
          The data exists; the filter is hiding it. Offering “create one” here would be wrong — the
          way out is always to clear the filter.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<EmptyState title* body? art? action* />              // action REQUIRED
<EmptyState kind="good"     title* body? />           // no action allowed
<EmptyState kind="terminal" title* body? />           // no action allowed
<EmptyFiltered filterCount* onClear* />

// \`action\` is required EXCEPT for the good outcome and the terminal
//   case — enforced by the type, not by a review comment
// filtered-empty is a DIFFERENT state — its way out is
//   'clear the filter', never 'create one'`}</Api>
      </Section>
    </Specimen>
  );
}
