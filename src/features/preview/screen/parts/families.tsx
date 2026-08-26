import { useState } from 'react';

import { Chat } from '@ui/chat';
import { StockItem, StockItemSkeleton, StockLevelBar, StockUntracked, RestockSuggestion, FreshnessDot } from '@ui/stock';
import { InsightCard, InsightEvidence, InsightSkeleton, Streak, VarietyMeter, WeekStrip } from '@ui/insights';
import { ConstraintChip, MealSlot, MoodPicker, PortionScaler } from '@ui/planning';
import { CaptureMethods, CaptureRecovery, ExtractionResult, PermissionPrompt, PhotoCapture, VoiceCapture, type CaptureMethod } from '@ui/capture';
import { MealCard } from '@ui/domain';
import { Panel, RecentIngredients, SectionHeader, Avatar } from '@ui/structure';
import { Sidebar } from '@ui/navigation';

import { Api, Demo, Grid, Note, Row, Rule, Section, Specimen, Stack } from './preview-canvas';

/**
 * Visual spec: preview/420-429 (chat) · 400-413 (stock) · 440-447 (insights)
 *              460-465 (planning) · 54-57 + 237-240 (capture)
 *              182-sidebar · 200-section-header · 239-recent-ingredients · 89-avatar
 */

const EVIDENCE = {
  kind: 'rows' as const,
  summary: 'From your last 7 cooked meals',
  rows: [
    { id: '1', label: 'Jollof Rice', detail: 'Monday · rice' },
    { id: '2', label: 'Fried Rice', detail: 'Tuesday · rice' },
    { id: '3', label: 'Jollof Rice', detail: 'Thursday · rice' },
    { id: '4', label: 'Coconut Rice', detail: 'Saturday · rice' },
  ],
};

export function ChatPart() {
  return (
    <Specimen
      title="Chat"
      spec="420-chat-user … 429-chat-disclaimer"
      description="The cook asking, the chef answering — and every answer says where it came from."
    >
      <Rule>
        <b><code>Chat.AI</code>'s <code>source</code> is a REQUIRED prop</b> — the same contract as
        the meal card's provenance. This product's whole claim is that you can tell where knowledge
        came from, so an answer that cannot cite its source does not render.
      </Rule>

      <Section label="A THREAD">
        <Demo tone="plain" className="p-0">
          <div className="mx-auto max-w-[520px] rounded-blade-lg border border-line-2 bg-paper">
            <Chat.Thread>
              <Chat.Disclaimer />
              <Chat.User text="What can I make with what I have?" />
              <Chat.AI
                body="You have enough for Jollof Rice and for Efo Riro. Jollof needs nothing extra; Efo Riro wants a bit more palm oil."
                source={{ kind: 'kitchen', age: 'today' }}
                actions={[
                  { label: 'Show me Jollof', onClick: () => {} },
                  { label: 'What about Efo Riro?', onClick: () => {} },
                ]}
              />
              <Chat.User text="Can I swap the palm oil?" />
              <Chat.AI
                body="Swap the palm oil for groundnut oil — it changes the colour but not much else."
                source={{ kind: 'recipe', ref: 'Efo Riro' }}
              />
              <Chat.User text="Something quick" status="failed" />
            </Chat.Thread>
            <Chat.Composer onSend={() => {}} />
          </div>
        </Demo>
        <Note>
          The blade is <b>mirrored</b> between the two bubbles so the sharp corners point back
          toward the sender. That is the only structural difference, and it is enough.
        </Note>
      </Section>

      <Section label="THE THREE CITATION KINDS, RANKED">
        <Demo tone="plain" className="p-0">
          <div className="mx-auto max-w-[520px] rounded-blade-lg border border-line-2 bg-paper">
            <Chat.Thread>
              <Chat.AI
                body="Jollof Rice takes about 45 minutes."
                source={{ kind: 'recipe', ref: 'Jollof Rice' }}
              />
              <Chat.AI
                body="You have six tomatoes and three scotch bonnets."
                source={{ kind: 'kitchen', age: 'today' }}
              />
              <Chat.AI
                body="Groundnut oil is a reasonable swap for palm oil."
                source={{ kind: 'general' }}
              />
            </Chat.Thread>
          </div>
        </Demo>
        <Note>
          Tested recipe &gt; your kitchen &gt; general knowledge. The weakest is{' '}
          <b>stated plainly</b> — the copy says it is not from a tested recipe.
        </Note>
      </Section>

      <Section label="STATES">
        <Demo tone="plain" className="p-0">
          <div className="mx-auto max-w-[520px] rounded-blade-lg border border-line-2 bg-paper">
            <Chat.Thread>
              <Chat.Thinking />
              <Chat.Unknown onWriteAnyway={() => {}} />
              <Chat.Error />
              <Chat.User text="Sending this one" status="sending" />
            </Chat.Thread>
          </div>
        </Demo>
        <Note>
          <b>“I do not know” is a first-class answer with its own state</b>, not an error — it says
          so rather than inventing. And a failed message <b>keeps its text</b>; retyping is the
          worst outcome here.
        </Note>
      </Section>

      <Section label="WITH AN ATTACHMENT">
        <Demo tone="plain" className="p-0">
          <div className="mx-auto max-w-[520px] rounded-blade-lg border border-line-2 bg-paper">
            <Chat.Thread>
              <Chat.AI
                body="This is the one I would cook tonight."
                source={{ kind: 'kitchen', age: 'today' }}
                attachment={
                  <MealCard
                    name="Jollof Rice"
                    source="seed"
                    minutes={45}
                    match="nothing_to_buy"
                    compact
                  />
                }
              />
            </Chat.Thread>
          </div>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Chat.Thread>
  <Chat.Disclaimer />
  <Chat.User text* status?="sent|sending|failed" onRetry? />
  <Chat.AI body* source* attachment? actions? />
  <Chat.Thinking /> <Chat.Unknown /> <Chat.Error />
</Chat.Thread>
<Chat.Composer onSend* suggestions? disabled? />

// Chat.AI's \`source\` is REQUIRED — an uncited answer cannot render,
//   the same way an unlabelled meal cannot
// three citation kinds, ranked: tested recipe > your kitchen > general
// a failed message KEEPS its text — retyping is the worst outcome`}</Api>
      </Section>
    </Specimen>
  );
}

export function StockPart() {
  return (
    <Specimen
      title="The standing kitchen"
      spec="400-stock-item … 413-stock-empty"
      description="The pantry the v1 PRD deliberately excluded — and the rule that makes it safe to have."
    >
      <Rule>
        <b>The pantry is only ever maintained by side-effects of what the cook already does</b> —
        cooking a meal decrements it, ticking a market item increments it, one photo seeds it.{' '}
        <b>No screen asks a person to do stock-taking as a chore</b>; that is the friction the PRD
        says kills these products. If it ever needs manual upkeep, remove it.
      </Rule>

      <Section label="STOCK ITEMS">
        <Demo tone="plain">
          <Panel>
            <Panel.Header title="Your kitchen" />
            <Panel.List>
              <StockItem name="Tomatoes" icon="tomato" level="plenty" quantity={6} unit="medium" storage="fridge" freshness="fresh" onPress={() => {}} />
              <StockItem name="Scotch bonnet" icon="chilli" level="low" quantity={3} unit="left" storage="fridge" freshness="soon" onPress={() => {}} />
              <StockItem name="Long-grain rice" icon="bagRice" level="out" quantity={0} unit="cups" storage="shelf" onPress={() => {}} />
              <StockUntracked name="Palm oil" onTrack={() => {}} />
            </Panel.List>
          </Panel>
        </Demo>
        <Note>
          Four facts — what, how much, how fresh, where it lives. A pantry entry with only a name
          is a shopping list, not a kitchen.
        </Note>
      </Section>

      <Section label="THE LEVEL METER">
        <Demo>
          <Stack className="max-w-[260px]">
            <div>
              <p className="mb-1 text-sm font-extrabold">Plenty</p>
              <StockLevelBar level="plenty" />
            </div>
            <div>
              <p className="mb-1 text-sm font-extrabold">Running low</p>
              <StockLevelBar level="low" />
            </div>
            <div>
              <p className="mb-1 text-sm font-extrabold">Out</p>
              <StockLevelBar level="out" />
            </div>
            <div>
              <p className="mb-1 text-sm font-extrabold">Untracked</p>
              <StockLevelBar level="untracked" />
            </div>
            <div>
              <p className="mb-1 text-sm font-extrabold">From an old count</p>
              <StockLevelBar level="plenty" staleLabel="counted 6 days ago" />
            </div>
          </Stack>
        </Demo>
        <Note>
          <b>Thresholds belong to the item, not to the bar</b> — two onions is fine, two cups of
          rice is not. Untracked is a dashed rail, not a zero bar; they mean different things.
        </Note>
      </Section>

      <Section label="FRESHNESS · RESTOCK">
        <Demo>
          <Row className="mb-4">
            <span className="inline-flex items-center gap-2 text-sm"><FreshnessDot freshness="fresh" /> Fresh</span>
            <span className="inline-flex items-center gap-2 text-sm"><FreshnessDot freshness="soon" /> Use soon</span>
            <span className="inline-flex items-center gap-2 text-sm"><FreshnessDot freshness="past" /> Past its best</span>
          </Row>
          <Stack>
            <RestockSuggestion name="Long-grain rice" reason="4 saved meals need it" onAdd={() => {}} />
            <RestockSuggestion name="Palm oil" reason="you usually keep a bottle" onAdd={() => {}} />
          </Stack>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo tone="plain">
          <Grid cols={2}>
            <Panel>
              <Panel.Header title="Skeleton" />
              <Panel.List>
                <StockItemSkeleton />
                <StockItemSkeleton />
              </Panel.List>
            </Panel>
            <Panel>
              <Panel.Header title="Stale · failed · archived" />
              <Panel.List>
                <StockItem name="Tomatoes" icon="tomato" level="plenty" quantity={6} unit="medium" storage="fridge" staleLabel="counted 6 days ago" />
                <StockItem name="Tomatoes" icon="tomato" level="plenty" quantity={0} unit="" countFailed />
                <StockItem name="Tinned corn" level="out" quantity={0} unit="tins" archived />
              </Panel.List>
            </Panel>
          </Grid>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function InsightsPart() {
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <Specimen
      title="Insights"
      spec="440-insight-card … 447-variety-meter"
      description="An observation, with its evidence. The third required-slot contract."
    >
      <Rule>
        <b><code>evidence</code> is REQUIRED</b> — the same rule as the meal card's provenance and
        the chat's source. An observation with no working shown is indistinguishable from a guess,
        and this product's whole posture is showing its working.
      </Rule>

      <Section label="INSIGHT CARDS">
        <Demo tone="plain">
          <Grid cols={2}>
            <InsightCard
              icon="bagRice"
              title="You have cooked rice four times this week"
              body="Nothing wrong with that — but you have beans and yam sitting unused."
              evidence={EVIDENCE}
              onInspect={() => setShowEvidence((v) => !v)}
            />
            <InsightCard
              icon="chilli"
              title="You buy scotch bonnet about weekly"
              body="You are on day 9 and it is down to three."
              evidence={{ kind: 'count', summary: 'From your last 6 shops' }}
              staleLabel="kitchen counted 6 days ago"
            />
          </Grid>
        </Demo>
        <Note>
          Tap the evidence line on the first card — the working is <b>one tap from every insight</b>.
        </Note>

        {showEvidence && (
          <Demo>
            <InsightEvidence evidence={EVIDENCE} />
          </Demo>
        )}
      </Section>

      <Rule tone="warn">
        <b>Under four observations, nothing renders.</b> A pattern claimed from two data points is
        a guess wearing a chart, and it costs more trust than silence. And{' '}
        <b>an insight never renders an error state</b> — it renders nothing.
      </Rule>

      <Section label="THE WEEK · STREAK · VARIETY">
        <Demo>
          <WeekStrip
            className="mb-6"
            days={[
              { label: 'M', cooked: true, meal: 'Jollof Rice' },
              { label: 'T', cooked: true, meal: 'Fried Rice' },
              { label: 'W', cooked: false },
              { label: 'T', cooked: true, meal: 'Efo Riro' },
              { label: 'F', cooked: false },
              { label: 'S', cooked: true, meal: 'Ewa Agoyin' },
              { label: 'S', cooked: false },
            ]}
          />
          <Row className="items-start">
            <Streak days={6} />
            <VarietyMeter distinct={4} total={7} className="w-[220px]" />
          </Row>
        </Demo>
        <Note>
          A blank day is <b>not a failure</b> — it is a day the product knows nothing about, drawn
          as an empty square rather than a red one. The streak states a fact and stops: no points,
          no levels, no “don't break the chain” pressure.
        </Note>
      </Section>

      <Section label="STATES">
        <Demo tone="plain">
          <Grid cols={2}>
            <InsightSkeleton />
            <div className="grid place-items-center rounded-blade-lg border border-dashed border-line-2 bg-paper-2 p-6 text-center text-sm text-ink-3">
              Not enough history to observe anything — nothing renders.
            </div>
          </Grid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<InsightCard title* evidence* body? icon? staleLabel? onInspect? actions? />
<InsightEvidence evidence* />
<WeekStrip days* /> <Streak days* /> <VarietyMeter distinct* total* />

// \`evidence\` is REQUIRED — same rule as Meal provenance and Chat source
// under MIN_OBSERVATIONS (4), nothing renders
// an insight NEVER renders an error state; it renders nothing`}</Api>
      </Section>
    </Specimen>
  );
}

export function PlanningPart() {
  const [moods, setMoods] = useState<readonly string[]>(['comfort']);
  const [serves, setServes] = useState(4);
  const [vegetarian, setVegetarian] = useState(false);

  return (
    <Specimen
      title="Planning"
      spec="460-mood-picker … 465-portion-scaler"
      description="Mood, constraints, the week and portions — the taste-led way in."
    >
      <Rule>
        <b>Mood narrows, it never overrides.</b> A cook who picks “comfort food” with an empty
        kitchen still gets what is makeable — the mood reorders the results, it does not invent
        ingredients. Picking nothing is <b>valid</b>, and the copy says what that means.
      </Rule>

      <Section label="MOOD">
        <Demo>
          <div className="max-w-[520px]">
            <MoodPicker value={moods} onChange={setMoods} />
          </div>
          <Note>
            Multi-select is allowed — “quick AND peppery” is a real request. Clear them all to see
            what the empty state says.
          </Note>
        </Demo>

        <Demo>
          <div className="max-w-[520px]">
            <MoodPicker value={[]} onChange={() => {}} disabledReason="Add a few things first" />
          </div>
        </Demo>
      </Section>

      <Section label="CONSTRAINTS — these exclude">
        <Demo>
          <Row>
            <ConstraintChip label="Vegetarian" icon="seedling" active={vegetarian} onToggle={setVegetarian} />
            <ConstraintChip label="Under 30 min" icon="alarmClock" active onToggle={() => {}} />
            <ConstraintChip label="No pork" active={false} onToggle={() => {}} />
            <ConstraintChip label="Halal" active={false} onToggle={() => {}} />
          </Row>
        </Demo>
        <Note>Unlike mood, a constraint is a hard filter — it removes results.</Note>
      </Section>

      <Section label="THE WEEK — designed empty-first">
        <Demo tone="plain">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MealSlot day="Monday" meal={{ name: 'Egusi Soup', minutes: 70, source: 'seed' }} cooked />
            <MealSlot day="Tuesday" onPick={() => {}} />
            <MealSlot day="Wednesday" meal={{ name: 'Jollof Rice', minutes: 45, source: 'seed' }} onClear={() => {}} />
            <MealSlot day="Thursday" onPick={() => {}} />
            <MealSlot day="Friday" missing onPick={() => {}} />
            <MealSlot day="Saturday" meal={{ name: 'Indomie, upgraded', minutes: 20, source: 'ai' }} onClear={() => {}} />
            <MealSlot day="Sunday" onPick={() => {}} />
          </div>
        </Demo>
        <Note>
          <b>Empty is the default visual, not an error</b> — most slots in most weeks are empty, so
          the empty treatment is the one that had to be right. It is calm.
        </Note>
      </Section>

      <Section label="PORTIONS">
        <Demo>
          <PortionScaler serves={serves} onChange={setServes} baseServes={4} />
          <Note>
            It states what it was scaled <b>from</b>. A recipe silently rewritten for six gives a
            cook no way to sanity-check a quantity that looks wrong.
          </Note>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function CapturePart() {
  const [method, setMethod] = useState<CaptureMethod>('type');
  const [recording, setRecording] = useState(false);
  const [shots, setShots] = useState([{ id: '1', label: 'Fridge shelf' }]);

  return (
    <Specimen
      title="Capture"
      spec="54-voice-capture · 55-photo-capture · 56-multi-shot · 237-240"
      description="The three ways into the kitchen — and the rule that keeps the product working when two of them fail."
    >
      <Rule>
        <b>Typing always works.</b> Voice and photo are accelerants, never the only door — if the
        mic is blocked, the camera is broken or the model is down, the cook can still type and the
        product still functions. <code>disabled</code> cannot even contain <code>'type'</code>.
      </Rule>

      <Section label="THE THREE DOORS">
        <Demo>
          <Stack>
            <CaptureMethods value={method} onValueChange={setMethod} />
            <CaptureMethods value="type" onValueChange={() => {}} disabled={['voice', 'photo']} />
          </Stack>
        </Demo>
      </Section>

      <Section label="VOICE">
        <Demo>
          <Grid cols={2}>
            <VoiceCapture
              recording={recording}
              onStart={() => setRecording(true)}
              onStop={() => setRecording(false)}
              transcript={recording ? undefined : 'rice, two tomatoes and some pepper'}
            />
            <VoiceCapture
              recording={false}
              onStart={() => {}}
              onStop={() => {}}
              error="We cannot reach your microphone"
            />
          </Grid>
        </Demo>
      </Section>

      <Section label="PHOTO — the multi-shot tray">
        <Demo>
          <Stack>
            <PhotoCapture
              shots={shots}
              onCapture={() => setShots((s) => [...s, { id: String(Date.now()), label: 'Another angle' }])}
              onRemove={(id) => setShots((s) => s.filter((shot) => shot.id !== id))}
            />
            <PhotoCapture shots={shots} onCapture={() => {}} onRemove={() => {}} reading />
            <PhotoCapture shots={[]} onCapture={() => {}} onRemove={() => {}} error="That photo was too dark to read" />
          </Stack>
        </Demo>
        <Note>More angles read better than one wide shot — one photo rarely covers a kitchen.</Note>
      </Section>

      <Section label="EXTRACTION REVIEW">
        <Demo>
          <ExtractionResult
            items={[
              { id: '1', name: 'Rice', uncertain: false },
              { id: '2', name: 'Tomatoes', uncertain: false },
              { id: '3', name: 'Scotch bonnet', uncertain: false },
              { id: '4', name: 'Half a yam', uncertain: true },
              { id: '5', name: 'Something green', uncertain: true },
            ]}
            onConfirm={() => {}}
            onReject={() => {}}
          />
        </Demo>
        <Note>
          <b>Every extraction is reviewed, never auto-committed.</b> The cook confirms what is
          theirs — which is also what makes a bad reading diagnosable rather than mysterious.
        </Note>
      </Section>

      <Section label="PERMISSION · RECOVERY">
        <Demo tone="plain">
          <Grid cols={2}>
            <PermissionPrompt kind="camera" onAllow={() => {}} onSkip={() => {}} />
            <CaptureRecovery onRetry={() => {}} onType={() => {}} />
          </Grid>
        </Demo>
        <Note>
          Asked in context, with the reason, and <b>always skippable</b>. Never on first launch — a
          permission prompt before a user knows what the product does is the fastest way to a
          permanent denial.
        </Note>
      </Section>
    </Specimen>
  );
}

export function ShellPart() {
  const [nav, setNav] = useState('kitchen');

  return (
    <Specimen
      title="Shell pieces"
      spec="182-sidebar · 200-section-header · 239-recent-ingredients · 89-avatar"
      description="The desktop rail, the group label, the one-tap recents, and a person."
    >
      <Section label="SIDEBAR — the desktop counterpart to TabBar">
        <Demo tone="plain" className="p-0">
          <div className="flex h-[420px] overflow-hidden rounded-blade-lg border border-line-2 bg-white">
            <Sidebar
              value={nav}
              onValueChange={setNav}
              header={<span className="font-display text-lg font-extrabold tracking-display">Kinnijije</span>}
              footer={<Avatar name="ada@kinnijije.ng" size={30} label="Ada Obi" sublabel="ada@kinnijije.ng" />}
              groups={[
                {
                  items: [
                    { id: 'kitchen', label: 'Kitchen', icon: 'basket' },
                    { id: 'meals', label: 'Meals', icon: 'cookingPot' },
                    { id: 'chat', label: 'Ask', icon: 'speechBubble' },
                  ],
                },
                {
                  label: 'Your kitchen',
                  items: [
                    { id: 'stock', label: 'Stock', icon: 'shelf' },
                    { id: 'market', label: 'Market list', icon: 'shoppingBasket', count: 4 },
                    { id: 'plan', label: 'Plan', icon: 'calendarCircledDate' },
                  ],
                },
                {
                  label: 'You',
                  items: [
                    { id: 'saved', label: 'Saved', icon: 'bookmark' },
                    { id: 'week', label: 'This week', icon: 'chartBarBig' },
                    { id: 'settings', label: 'Settings', icon: 'settings' },
                  ],
                },
              ]}
            />
            <div className="grid flex-1 place-items-center text-sm text-ink-3">Screen content</div>
          </div>
        </Demo>
        <Note>
          A sidebar can <b>group</b>, which is why the desktop carries sections a phone has to bury
          in a menu. Like the tab bar, it shows destinations, never actions.
        </Note>
      </Section>

      <Section label="SECTION HEADER">
        <Demo>
          <Stack>
            <SectionHeader title="Tonight" count={3} />
            <SectionHeader title="In your kitchen" count={12} level="group" />
          </Stack>
        </Demo>
        <Note>
          The count is part of the header, because a group whose size you cannot see is one you
          cannot tell is truncated.
        </Note>
      </Section>

      <Section label="RECENT INGREDIENTS">
        <Demo>
          <RecentIngredients
            items={['Chicken', 'Palm oil', 'Plantain', 'Stock cubes', 'Onion']}
            onAdd={() => {}}
          />
        </Demo>
        <Note>
          The closest the product comes to remembering a kitchen <b>without asking anyone to
          maintain one</b> — derived from what was typed before, and tapping is optional.
        </Note>
      </Section>

      <Section label="AVATAR">
        <Demo>
          <Row>
            <Avatar name="ada@kinnijije.ng" />
            <Avatar name="tunde@kinnijije.ng" label="Tunde Bello" sublabel="tunde@kinnijije.ng" />
            <Avatar name="chidinma@kinnijije.ng" size={48} label="Chidinma Eze" sublabel="Admin" />
          </Row>
        </Demo>
      </Section>
    </Specimen>
  );
}
