import { useState } from 'react';

import { Button } from '@ui/primitives/button/button';
import { IconButton } from '@ui/primitives/icon-button/icon-button';
import { Callout } from '@ui/feedback/callout/callout';
import { CircularProgress, Progress, StepProgress } from '@ui/feedback/progress/progress';
import { Tooltip } from '@ui/feedback/tooltip/tooltip';
import { AppBar } from '@ui/navigation/app-bar/app-bar';
import { TabBar, type TabBarItem } from '@ui/navigation/tab-bar/tab-bar';
import { Tabs } from '@ui/navigation/tabs/tabs';

import { Api, Demo, Note, Row, Rule, Section, Specimen, Stack, StateCard, StateGrid } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/148-callout.html
 *                                                          152-progress-linear.html … 154
 *                                                          161-tooltip.html
 *                                                          180-app-bar · 181-tab-bar · 183-tabs
 */

const NAV_ITEMS: TabBarItem[] = [
  { id: 'kitchen', label: 'Kitchen', icon: 'basket' },
  { id: 'meals', label: 'Meals', icon: 'cookingPot' },
  { id: 'market', label: 'Market', icon: 'shoppingBasket', count: 4 },
  { id: 'you', label: 'You', icon: 'user' },
];

export function CalloutPart() {
  return (
    <Specimen
      title="Callout"
      spec="148-callout.html"
      description="The inline notice. Ambient, persistent, non-blocking."
    >
      <Rule>
        Sits in the content and <b>stays</b>. The shipped app never reached for this — eleven files
        hand-wrote <code>&lt;p role="alert"&gt;</code> instead, which announces something urgent to
        a screen reader every time the page renders.{' '}
        <b>A callout does not dismiss</b> — if it should vanish it is a Toast.
      </Rule>

      <Section label="TONES">
        <Demo>
          <Stack>
            <Callout
              tone="ai"
              title="Quantities are estimates"
              body="This recipe was written by a model, so amounts are approximate."
            />
            <Callout
              tone="caution"
              title="You are offline"
              body="Saved recipes still work. New suggestions need a connection."
            />
            <Callout tone="success" title="Every ingredient is in your kitchen" />
            <Callout
              tone="critical"
              title="Could not save"
              body="Check your connection and try again."
              action={
                <Button variant="secondary" size="sm">
                  Retry
                </Button>
              }
            />
            <Callout tone="info" title="Checking…" loading />
          </Stack>
        </Demo>
        <Note>
          <code>tone</code> is the only colour input — there is no <code>background</code> prop.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<Callout tone* title* body? action? loading? />

// \`tone\` is the ONLY colour input — there is no \`background\` prop
// a callout does not dismiss; if it should vanish it is a Toast,
//   and if it belongs above the whole screen it is a Banner`}</Api>
      </Section>
    </Specimen>
  );
}

export function ProgressPart() {
  return (
    <Specimen
      title="Progress"
      spec="152-progress-linear.html · 153-progress-circular.html · 154-progress-stepper.html"
      description="Determinate when there is a real number, indeterminate when there is not."
    >
      <Rule>
        <b>Never fake a percentage.</b> A bar that reaches 90% and waits is worse than a marching
        one — it makes a promise the system cannot keep, and the user learns not to trust the next
        bar either. Omit <code>value</code> for indeterminate; the type makes that explicit.
      </Rule>

      <Section label="LINEAR">
        <Demo>
          <Stack>
            <Progress value={62} label="2 of 3 photos · 62%" />
            <Progress indeterminate label="Reading your photo…" tone="ai" />
            <Progress value={40} tone="critical" label="Stopped part-way" />
            <Progress value={0} label="Not started" />
          </Stack>
        </Demo>
        <Note>
          The second has no number and says so with a marching band rather than inventing one.
        </Note>
      </Section>

      <Section label="CIRCULAR">
        <Demo>
          <Row>
            <CircularProgress value={62} label="62 percent" />
            <CircularProgress value={100} tone="success" label="Complete" />
            <CircularProgress indeterminate tone="ai" label="Working" />
          </Row>
        </Demo>
      </Section>

      <Section label="STEPPER">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Mid-flow.">
              <StepProgress current={3} total={5} />
            </StateCard>
            <StateCard name="not started" when="Step one.">
              <StepProgress current={1} total={5} />
            </StateCard>
            <StateCard name="clickable" when="Only when the flow genuinely allows revisiting.">
              <StepProgress current={3} total={5} clickable />
            </StateCard>
            <StateCard name="disabled" when="Flow locked.">
              <StepProgress current={3} total={5} disabled />
            </StateCard>
          </StateGrid>
        </Demo>
        <Note>
          <code>clickable</code> defaults <b>false</b> — a stepper that looks navigable but is not
          is a small betrayal.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<Progress value* tone? label? />           // determinate
<Progress indeterminate tone? label? />   // no number known
<StepProgress current* total* clickable? />
<CircularProgress value? indeterminate? size? tone? />

// omit \`value\` for indeterminate — never pass a guessed percentage
// \`clickable\` defaults FALSE — do not look navigable unless you are
// a determinate bar never animates backwards`}</Api>
      </Section>
    </Specimen>
  );
}

export function TooltipPart() {
  return (
    <Specimen
      title="Tooltip"
      spec="161-tooltip.html"
      description="A label, never a paragraph. One short line explaining a control."
    >
      <Rule>
        <b>One short line.</b> If it needs two sentences it is a Popover; if it needs an action it
        is definitely a Popover, because a tooltip cannot be reached by keyboard reliably.{' '}
        <code>content</code> is typed as <code>string</code> precisely so a button cannot be put
        inside one.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <Row>
            <Tooltip content="Times are padded 30% for AI recipes">
              <Button variant="secondary">Hover me (top)</Button>
            </Tooltip>
            <Tooltip content="Verified by a person" side="right">
              <IconButton icon="tick" label="Verified" />
            </Tooltip>
            <Tooltip content="Add to your market list" side="bottom">
              <IconButton icon="shoppingBasket" label="Market" />
            </Tooltip>
          </Row>
          <Note>
            There is a 400ms hover delay before it appears, and it leaves immediately — a lingering
            tooltip blocks whatever is under it.
          </Note>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Tooltip content* side?="top|right|bottom|left" />

// content is a STRING — one line. If it needs more, or an action,
//   use a Popover
// portals to the body — it must escape any overflow:hidden ancestor,
//   which is the single most common reason a tooltip renders clipped`}</Api>
      </Section>
    </Specimen>
  );
}

export function NavigationPart() {
  const [tab, setTab] = useState('ingredients');
  const [nav, setNav] = useState('kitchen');

  return (
    <Specimen
      title="Navigation"
      spec="180-app-bar.html · 181-tab-bar.html · 183-tabs.html"
      description="The app bar, the phone's tab bar, and tabs — distinguished from Segmented by what they do to the data."
    >
      <Rule>
        <b>Tabs LOAD different data; a segmented control RESHAPES data already loaded.</b> That is
        the whole distinction and it decides which one you reach for. Getting it wrong gives a
        product two navigation idioms that look identical and behave differently.
      </Rule>

      <Section label="APP BAR">
        <Demo tone="plain" className="p-0">
          <div className="overflow-hidden rounded-blade-lg bg-white">
            <AppBar
              title="Jollof Rice, Party Style"
              onBack={() => {}}
              backLabel="Meals"
              action={<IconButton icon="bookmark" label="Save recipe" variant="tertiary" />}
              sticky={false}
            />
            <div className="p-6 text-sm text-ink-2">Screen content.</div>
          </div>
        </Demo>

        <Demo tone="plain" className="p-0">
          <div className="overflow-hidden rounded-blade-lg">
            <AppBar title="Step 2 of 6" onBack={() => {}} backLabel="Exit" onDark sticky={false} />
            <div className="bg-ink p-6 text-sm text-ink-inv">Cook mode runs on an ink ground.</div>
          </div>
        </Demo>
        <Note>
          At most <b>one</b> trailing control. The back affordance carries a label, not a bare
          chevron — a chevron alone tells a screen-reader user nothing about where they are going.
        </Note>
      </Section>

      <Section label="TABS — they load">
        <Demo>
          <Tabs value={tab} onValueChange={setTab}>
            <Tabs.List label="Recipe sections">
              <Tabs.Tab value="ingredients">Ingredients</Tabs.Tab>
              <Tabs.Tab value="steps">Steps</Tabs.Tab>
              <Tabs.Tab value="notes" count={2}>
                Notes
              </Tabs.Tab>
              <Tabs.Tab value="nutrition" disabled>
                Nutrition
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="ingredients">
              <p className="text-sm text-ink-2">You have 5 of 7 things.</p>
            </Tabs.Panel>
            <Tabs.Panel value="steps">
              <p className="text-sm text-ink-2">Six steps, about 45 minutes.</p>
            </Tabs.Panel>
            <Tabs.Panel value="notes">
              <p className="text-sm text-ink-2">Two corrections from cooks.</p>
            </Tabs.Panel>
          </Tabs>
        </Demo>
        <Note>
          Arrow keys move roving focus and wrap. Each panel owns its own loading and empty state —
          the strip never blocks on one.
        </Note>
      </Section>

      <Section label="TAB BAR — the phone's primary navigation">
        <Demo tone="plain" className="p-0">
          <div className="mx-auto max-w-[400px] overflow-hidden rounded-blade-lg border border-line-2 bg-white">
            <div className="p-8 text-center text-sm text-ink-3">Screen content</div>
            <TabBar items={NAV_ITEMS} value={nav} onValueChange={setNav} className="static" />
          </div>
        </Demo>
        <Note>
          Three to five destinations, in the thumb zone, with <b>the label always visible</b>. A
          tab bar shows destinations, never actions — a “＋” here is the most common misuse.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<AppBar title? onBack? backLabel? action? sticky? onDark? />
<TabBar items* value* onValueChange* />
<Tabs value* onValueChange*>
  <Tabs.List label*><Tabs.Tab value* count? disabled? /></Tabs.List>
  <Tabs.Panel value* />
</Tabs>

// Tabs LOAD different data; Segmented RESHAPES loaded data
// AppBar takes at most ONE trailing control
// TabBar shows DESTINATIONS, never actions`}</Api>
      </Section>
    </Specimen>
  );
}
