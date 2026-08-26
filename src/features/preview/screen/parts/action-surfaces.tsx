import { useState } from 'react';

import { Button, ButtonGroup, ContinueBar, Dock, Fab, HoldButton } from '@ui/primitives';
import { SuggestCTA } from '@ui/domain';

import { Api, Demo, Note, Row, Rule, Section, Specimen, StateCard, StateGrid } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/24-button-group.html
 *                                                          25-button-dock.html
 *                                                          31-suggest-cta.html
 *                                                          33-fab.html
 *                                                          34-hold-button.html
 *                                                          35-continue-bar.html
 */

export function ButtonGroupPart() {
  return (
    <Specimen
      title="Button group"
      spec="24-button-group.html"
      description="A cluster of related actions that share a single blade, so the group reads as one object."
    >
      <Rule>
        <b>The blade is applied to the group, not to each child</b> — leading corner round,
        trailing corner sharp, everything between square. Children render square and inherit the
        group’s cut.
      </Rule>

      <Section label="ROW">
        <Demo>
          <Row>
            <ButtonGroup label="Range">
              <Button variant="secondary">Day</Button>
              <Button variant="secondary">Week</Button>
              <Button variant="secondary">Month</Button>
            </ButtonGroup>
          </Row>
          <Row>
            <ButtonGroup label="Save options">
              <Button variant="secondary">Save</Button>
              <Button>Save &amp; cook</Button>
            </ButtonGroup>
          </Row>
        </Demo>
      </Section>

      <Section label="COLUMN">
        <Demo>
          <ButtonGroup direction="column" label="Actions" className="w-[220px]">
            <Button variant="secondary">Share recipe</Button>
            <Button variant="secondary">Add to plan</Button>
            <Button variant="secondary" destructive>
              Remove
            </Button>
          </ButtonGroup>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Ready.">
              <ButtonGroup label="Range">
                <Button variant="secondary">Day</Button>
                <Button variant="secondary">Week</Button>
              </ButtonGroup>
            </StateCard>
            <StateCard name="disabled" when="The whole cluster is unavailable.">
              <ButtonGroup label="Range" disabled>
                <Button variant="secondary">Day</Button>
                <Button variant="secondary">Week</Button>
              </ButtonGroup>
            </StateCard>
            <StateCard name="detached" when="Related but not one object.">
              <ButtonGroup label="Range" attached={false}>
                <Button variant="secondary">Day</Button>
                <Button variant="secondary">Week</Button>
              </ButtonGroup>
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<ButtonGroup direction?="row|column" attached? disabled? label? />

// the group owns the blade; children render square and inherit it`}</Api>
      </Section>
    </Specimen>
  );
}

export function DockPart() {
  return (
    <Specimen
      title="Button dock"
      spec="25-button-dock.html"
      description="The bottom action bar. One commit, one optional secondary, and a notice slot for the reason a commit is blocked."
    >
      <Rule>
        It holds the screen’s <b>one</b> commit and at most one secondary, sits in the thumb zone,
        and carries a top edge so it never floats ambiguously over content.{' '}
        <b>The dock never animates in and out on scroll</b> — a bar that appears and disappears is
        a bar the thumb cannot learn.
      </Rule>

      <Section label="IN CONTEXT">
        <Demo tone="plain" className="p-0">
          <div className="h-[200px] overflow-y-auto rounded-blade-lg bg-white">
            <div className="p-6">
              <p className="mb-3 font-display text-lg font-extrabold">Jollof Rice</p>
              <p className="text-sm text-ink-2">
                Screen content scrolls under the dock. Scroll this panel — the bar holds and its
                top edge does the separating.
              </p>
              <div className="mt-4 h-[160px] rounded-blade-sm bg-paper-2" />
            </div>
            <Dock>
              <Dock.Actions>
                <Dock.Primary>
                  <Button size="lg">Start cooking</Button>
                </Dock.Primary>
                <Dock.Secondary>
                  <Button variant="secondary" size="lg">
                    Save
                  </Button>
                </Dock.Secondary>
              </Dock.Actions>
            </Dock>
          </div>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Ready.">
              <Dock className="static">
                <Dock.Actions>
                  <Dock.Primary>
                    <Button>Start cooking</Button>
                  </Dock.Primary>
                </Dock.Actions>
              </Dock>
            </StateCard>
            <StateCard name="loading" when="Committing.">
              <Dock className="static">
                <Dock.Actions>
                  <Dock.Primary>
                    <Button loading>Start cooking</Button>
                  </Dock.Primary>
                </Dock.Actions>
              </Dock>
            </StateCard>
            <StateCard name="locked" when="Gated — the reason sits above the bar.">
              <Dock className="static">
                <Dock.Notice tone="caution">Sign in to start cooking</Dock.Notice>
                <Dock.Actions>
                  <Dock.Primary>
                    <Button disabled>Start cooking</Button>
                  </Dock.Primary>
                </Dock.Actions>
              </Dock>
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Dock>
  <Dock.Notice tone? />        // optional — a lock or a warning
  <Dock.Actions>
    <Dock.Primary />           // REQUIRED — a dock with no commit is just a bar
    <Dock.Secondary />         // optional, at most ONE
  </Dock.Actions>
</Dock>

// a third action belongs in a menu, not the dock`}</Api>
      </Section>
    </Specimen>
  );
}

export function SuggestCtaPart() {
  return (
    <Specimen
      title="Suggest-meals CTA"
      spec="31-suggest-cta.html"
      description="The funnel’s single commit. Owns its own count, its loading copy and — critically — the reason it is ever disabled."
    >
      <Rule>
        The product’s <b>one</b> unified primary. Every path through the kitchen screen ends here,
        so it is a named component rather than a button with a label — that way its disabled
        reason, its count and its loading copy can never diverge between the three capture methods.
      </Rule>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="At least one ingredient.">
              <SuggestCTA ingredientCount={6} />
            </StateCard>
            <StateCard name="loading" when="The engine is running — the blob holds the wait.">
              <SuggestCTA ingredientCount={6} state="loading" />
            </StateCard>
            <StateCard name="disabled" when="Nothing in the basket yet. The reason is visible, not implied.">
              <SuggestCTA
                ingredientCount={0}
                state="disabled"
                disabledReason="Add at least one ingredient"
              />
            </StateCard>
            <StateCard name="featureDisabled" when="The AI feature flag is off.">
              <SuggestCTA
                ingredientCount={6}
                state="featureDisabled"
                disabledReason="Suggestions are paused"
                disabledDetail="We have turned this off briefly. Your saved recipes still work."
              />
            </StateCard>
            <StateCard name="error" when="The engine failed. The basket is kept.">
              <SuggestCTA
                ingredientCount={6}
                state="error"
                errorMessage="Could not reach the kitchen. Try again."
              />
            </StateCard>
            <StateCard name="one thing" when="The label agrees with the count.">
              <SuggestCTA ingredientCount={1} />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Rule tone="warn">
        <b>A silent disabled CTA is a bug report.</b> <code>disabledReason</code> is required
        whenever the CTA is not actionable — modelled as a discriminated union, so a disabled CTA
        with no reason will not compile.
      </Rule>

      <Section label="API">
        <Api>{`<SuggestCTA ingredientCount* onSuggest?
            state?="ready|loading|disabled|featureDisabled|error" />

// state="disabled"        requires disabledReason
// state="featureDisabled" requires disabledReason, optional disabledDetail
// state="error"           requires errorMessage
// no \`label\` prop: the copy is owned here so the three capture
// methods cannot diverge`}</Api>
      </Section>
    </Specimen>
  );
}

export function FabPart() {
  return (
    <Specimen
      title="Floating action button"
      spec="33-fab.html"
      description="The floating add. Circular by exception to the blade, because a blade on a floating circle reads as damage."
    >
      <Rule>
        Circular, floating, and <b>at most one per screen</b>. Reserved for the action a user takes
        repeatedly on a list — add an ingredient, add a recipe.
      </Rule>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Ready.">
              <Fab label="Add ingredient" floating={false} />
            </StateCard>
            <StateCard name="loading" when="Working.">
              <Fab label="Add ingredient" floating={false} loading />
            </StateCard>
            <StateCard name="disabled" when="Limit reached.">
              <Fab label="Add ingredient" floating={false} disabled />
            </StateCard>
            <StateCard name="custom icon" when="A domain glyph.">
              <Fab icon="takingPhotoCamera" label="Snap your shelf" floating={false} />
            </StateCard>
          </StateGrid>
        </Demo>
        <Note>Shown unfloated here; in an app it is fixed to the bottom-right thumb zone.</Note>
      </Section>
    </Specimen>
  );
}

export function HoldButtonPart() {
  const [removed, setRemoved] = useState(false);

  return (
    <Specimen
      title="Hold-to-confirm"
      spec="34-hold-button.html"
      description="Press and hold. The middle rung between a plain tap and a typed confirmation."
    >
      <Rule>
        The user <b>presses and holds</b>. Used where a typed confirmation is too heavy but a
        single tap is too light — unsaving a favourite, discarding a draft. Releasing early cancels
        and the fill retreats; an interrupted hold never commits.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <Row>
            <HoldButton icon="trash" onConfirm={() => setRemoved(true)}>
              Hold to remove
            </HoldButton>
            {removed && (
              <span className="text-sm font-extrabold text-success-onsoft">Removed.</span>
            )}
          </Row>
          <Note>Hold it for about a second. Let go early and nothing happens.</Note>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Idle.">
              <HoldButton onConfirm={() => {}}>Hold to remove</HoldButton>
            </StateCard>
            <StateCard name="non-destructive" when="A draft, not a deletion.">
              <HoldButton destructive={false} onConfirm={() => {}}>
                Hold to discard
              </HoldButton>
            </StateCard>
            <StateCard name="disabled" when="Not permitted.">
              <HoldButton disabled onConfirm={() => {}}>
                Hold to remove
              </HoldButton>
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function ContinueBarPart() {
  const [step, setStep] = useState(2);

  return (
    <Specimen
      title="Continue bar"
      spec="35-continue-bar.html"
      description="The stepped-flow footer. Back, progress and next as one component, so the step count cannot drift from the buttons."
    >
      <Rule>
        It carries <b>back, progress and next together</b>, so a user always knows how far in they
        are — and the dots can never say 3-of-5 while the button says “Finish”.
      </Rule>

      <Section label="LIVE">
        <Demo tone="plain" className="p-0">
          <div className="rounded-blade-lg bg-white">
            <div className="p-6">
              <p className="font-display text-lg font-extrabold">Step {step}</p>
              <p className="text-sm text-ink-2">Use the bar below to move through the flow.</p>
            </div>
            <ContinueBar
              step={step}
              totalSteps={4}
              onBack={() => setStep((current) => Math.max(1, current - 1))}
              onNext={() => setStep((current) => Math.min(4, current + 1))}
              className="static"
            />
          </div>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Mid-flow.">
              <ContinueBar step={2} totalSteps={4} className="static px-0" />
            </StateCard>
            <StateCard name="first step" when="Back is unavailable.">
              <ContinueBar step={1} totalSteps={4} className="static px-0" />
            </StateCard>
            <StateCard name="last step" when="Next becomes Finish.">
              <ContinueBar step={4} totalSteps={4} className="static px-0" />
            </StateCard>
            <StateCard name="loading" when="Saving the step.">
              <ContinueBar step={2} totalSteps={4} loading className="static px-0" />
            </StateCard>
            <StateCard name="disabled" when="Step incomplete.">
              <ContinueBar step={2} totalSteps={4} nextDisabled className="static px-0" />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>
    </Specimen>
  );
}
