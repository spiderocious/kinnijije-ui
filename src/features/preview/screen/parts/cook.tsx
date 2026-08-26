import { CookStep, CookStepError, CookStepSkeleton } from '@ui/domain/cook-step/cook-step';
import { HaveNeed, HaveNeedSkeleton } from '@ui/domain/have-need/have-need';
import { AiDisclosure, HonestyBar, WhyThisMeal } from '@ui/domain/honesty/honesty';
import { NoTimer, StepTimer } from '@ui/domain/step-timer/step-timer';
import { Card } from '@ui/structure/card/card';

import { Api, Demo, Grid, Note, Row, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/261-have-need.html
 *                                                          262-cook-step.html
 *                                                          263-step-timer.html
 *                                                          291-honesty-bar.html
 *                                                          292-ai-disclosure.html
 *                                                          293-why-this-meal.html
 */

const HAVE = [
  { id: '1', name: 'Rice', quantity: '3 cups' },
  { id: '2', name: 'Tomatoes', quantity: '6' },
  { id: '3', name: 'Onion', quantity: '2' },
  { id: '4', name: 'Scotch bonnet', quantity: '2' },
  { id: '5', name: 'Chicken', quantity: '1 kg' },
];

const NEED = [
  { id: '6', name: 'Palm oil', quantity: '1/2 cup' },
  { id: '7', name: 'Stock cubes', quantity: '2' },
];

export function HaveNeedPart() {
  return (
    <Specimen
      title="Have / need split"
      spec="261-have-need.html"
      description="The recipe's ingredients against the basket. Where a count becomes a shopping list."
    >
      <Rule>
        The need list is <b>enumerable</b>, unlike the meal card where it is only a count — that
        difference is the whole reason this exists rather than a second badge. And{' '}
        <b>“need” is NEUTRAL, never critical</b>: shopping is not an error state.
      </Rule>

      <Section label="THE SPLIT">
        <Demo tone="plain">
          <Card variant="quiet">
            <HaveNeed have={HAVE} need={NEED} />
          </Card>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo tone="plain">
          <Grid cols={2}>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">skeleton</p>
              <Card variant="quiet">
                <HaveNeedSkeleton />
              </Card>
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">no basket</p>
              <Card variant="quiet">
                <HaveNeed have={[]} need={[...HAVE, ...NEED]} noBasket />
              </Card>
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">stale</p>
              <Card variant="quiet">
                <HaveNeed have={HAVE} need={NEED} staleLabel="41 min ago" />
              </Card>
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">nothing to buy</p>
              <Card variant="quiet">
                <HaveNeed have={[...HAVE, ...NEED]} need={[]} />
              </Card>
            </div>
          </Grid>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function CookStepPart() {
  return (
    <Specimen
      title="Cook step · Step timer"
      spec="262-cook-step.html · 263-step-timer.html"
      description="Read from across a kitchen. The single largest type in the product."
    >
      <Rule>
        A cook is <b>two feet away with wet hands</b>, so the step body is 21–26px and the step
        number is unmissable. That is a reading-distance decision, not a style one — shrinking it
        to match the rest of the system would break the only screen used at arm’s length.
      </Rule>

      <Section label="THE STEP">
        <Demo tone="plain">
          <CookStep
            index={3}
            total={7}
            title="Fry the base"
            body="Fry until the oil floats to the top. This is the step people rush — give it the full time."
            timerMinutes={12}
          />
        </Demo>
        <Note>
          Cook mode runs on an ink ground; the screen is propped up across the kitchen. The step
          index is derived from position, never stored — a stored index drifts the moment a step is
          inserted.
        </Note>
      </Section>

      <Section label="THE TIMER">
        <Demo>
          <Row className="items-start gap-8">
            <StepTimer seconds={720} onDone={() => {}} />
            <StepTimer seconds={30} onDone={() => {}} />
            <div className="w-[220px]">
              <NoTimer />
            </div>
          </Row>
          <Note>
            Press play on the 30-second one and watch the last ten seconds pulse. On completion it
            fires a <b>banner, never a modal</b> — the cook is at a pot with both hands full.
          </Note>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo tone="plain">
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">skeleton</p>
              <CookStepSkeleton />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">error mid-cook</p>
              <CookStepError lastStep={3} />
            </div>
          </div>
        </Demo>
        <Note>The skeleton loads at the real measure — not a small one scaled up.</Note>
      </Section>

      <Section label="API">
        <Api>{`<CookStep index* total* title* body* timerMinutes? onStartTimer? onDark? />
<StepTimer seconds* onDone* disabled? size? />

// body type is 21-26px — a reading-distance decision, not a style one
// the step index is DERIVED from position, never stored
// survives navigation WITHIN cook mode; leaving cook mode ends it
// on completion: a soft chime and a persistent banner, NEVER a modal`}</Api>
      </Section>
    </Specimen>
  );
}

export function HonestyPart() {
  return (
    <Specimen
      title="Honesty bar · AI disclosure · Why this meal"
      spec="291-honesty-bar.html · 292-ai-disclosure.html · 293-why-this-meal.html"
      description="The whole trust claim, in one strip — and the long answer behind it."
    >
      <Rule>
        Three axes: <b>who wrote it</b>, <b>where the photo came from</b>, and{' '}
        <b>whether the quantities are exact</b>. The database models all three; the shipped app
        rendered one — so a cook could be looking at an AI-generated image beside a Verified badge
        with no way to tell.
      </Rule>

      <Section label="HONESTY BAR">
        <Demo tone="plain">
          <Grid cols={2}>
            <HonestyBar source="ai" imageKind="placeholder" onExplain={() => {}} />
            <HonestyBar source="seed" imageKind="photo" />
          </Grid>
        </Demo>
        <Note>
          A fully verified recipe with a real photo collapses to one line — three green rows saying
          “all good” is noise.
        </Note>

        <Demo tone="plain">
          <Grid cols={2}>
            <HonestyBar source="seed" imageKind="ai_image" onExplain={() => {}} />
            <HonestyBar source="ai" imageKind="ai_image" onExplain={() => {}} />
          </Grid>
        </Demo>
        <Note>
          The left case is the one the shipped app could not express: a <i>human-written</i> recipe
          with a <i>generated</i> photo. Both facts render.
        </Note>
      </Section>

      <Section label="AI DISCLOSURE — the long answer">
        <Demo>
          <div className="max-w-[520px]">
            <AiDisclosure />
          </div>
        </Demo>
        <Note>
          Reachable from <b>every</b> AI mark. A badge with no explanation is a claim, not a
          disclosure.
        </Note>
      </Section>

      <Section label="WHY THIS MEAL">
        <Demo tone="plain">
          <Grid cols={2}>
            <WhyThisMeal
              matched={['Rice', 'Tomatoes', 'Onion', 'Scotch bonnet', 'Chicken']}
              totalInBasket={6}
              reasons={['it is Nigerian (which you said you like)', 'it fits your “medium” difficulty']}
            />
            <WhyThisMeal matched={[]} totalInBasket={6} noMatch />
          </Grid>
        </Demo>
        <Note>
          It <b>names the matched ingredients</b> — a rationale with no evidence is marketing, and
          a suggestion nobody can audit is one nobody can report.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<HonestyBar source* imageKind* onExplain? />
<AiDisclosure onClose? />
<WhyThisMeal matched* totalInBasket* reasons? noMatch? />

// all THREE axes render — heroImageKind was never shown in the
//   shipped app at all
// AiDisclosure is reachable from EVERY AI mark
// WhyThisMeal names the MATCHED ingredients — a rationale with no
//   evidence is marketing`}</Api>
      </Section>
    </Specimen>
  );
}
