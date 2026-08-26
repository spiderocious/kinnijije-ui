import { useState } from 'react';
import { Repeat } from 'meemaw';

import { cn } from '@shared/utils/cn';
import { Button, Dock } from '@ui/primitives';
import { Callout, EmptyState } from '@ui/feedback';
import { Figure, Stat } from '@ui/display';
import { AppBar, TabBar } from '@ui/navigation';
import { Card, Panel, Row, SectionHeader } from '@ui/structure';
import {
  InsightCard,
  InsightEvidence,
  Streak,
  VarietyMeter,
  WeekStrip,
} from '@ui/insights';
import { ConstraintChip, MealSlot, MoodPicker, PortionScaler } from '@ui/planning';
import { MealCard } from '@ui/domain';

import { DesktopShell, PHONE_NAV } from './shell';
import { SceneBody, SceneRoot } from '../parts/scene-frame';
import type { SceneFrame } from '../scenes.registry';

/**
 * The insight and planning scenes.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/360-scene-week-summary.html
 *                                                          … 374-scene-portions.html
 *
 * Every observation on these screens shows its working — `InsightCard` will not
 * render without evidence, so a scene cannot quietly make an unbacked claim.
 */

const WEEK = [
  { label: 'M', cooked: true, meal: 'Jollof Rice' },
  { label: 'T', cooked: true, meal: 'Fried Rice' },
  { label: 'W', cooked: false },
  { label: 'T', cooked: true, meal: 'Efo Riro' },
  { label: 'F', cooked: false },
  { label: 'S', cooked: true, meal: 'Ewa Agoyin' },
  { label: 'S', cooked: false },
];

const RICE_EVIDENCE = {
  kind: 'rows' as const,
  summary: 'From your last 7 cooked meals',
  rows: [
    { id: '1', label: 'Jollof Rice', detail: 'Monday · rice' },
    { id: '2', label: 'Fried Rice', detail: 'Tuesday · rice' },
    { id: '3', label: 'Efo Riro', detail: 'Thursday · greens' },
    { id: '4', label: 'Ewa Agoyin', detail: 'Saturday · beans' },
  ],
};

/* ---------- 360 · The week ---------- */

export function WeekSummaryScene({ frame }: { readonly frame: SceneFrame }) {
  const [open, setOpen] = useState(false);

  const summary = (
    <>
      <WeekStrip days={WEEK} className="mb-6" />
      <div className={cn('grid gap-3', frame === 'phone' ? 'grid-cols-2' : 'grid-cols-4')}>
        <Stat label="Cooked" value={4} weight="compact" />
        <Stat label="Distinct meals" value={4} weight="compact" />
        <Stat label="Ate out" value={2} weight="compact" />
        <Stat label="Spent, roughly" value="12,400" unit="₦" weight="compact" approximate />
      </div>
    </>
  );

  const noticed = (
    <div className="flex flex-col gap-4">
      <InsightCard
        icon="bagRice"
        title="You have cooked rice four times this week"
        body="Nothing wrong with that — but you have beans and yam sitting unused."
        evidence={RICE_EVIDENCE}
        onInspect={() => setOpen((v) => !v)}
      />
      {open && <InsightEvidence evidence={RICE_EVIDENCE} />}
      <InsightCard
        icon="chilli"
        title="You buy scotch bonnet about weekly"
        body="You are on day 9 and it is down to three."
        evidence={{ kind: 'count', summary: 'From your last 6 shops' }}
      />
    </div>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="week" title="Your week">
          {/* The seven-day grid and the insight column side by side — the
              reason this screen has a desktop variant at all. */}
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              {summary}
              <div className="mt-6 flex flex-wrap gap-4">
                <Streak days={6} />
                <VarietyMeter distinct={4} total={7} className="w-[240px]" />
              </div>
            </div>
            <aside>
              <SectionHeader title="Noticed" className="mb-3" />
              {noticed}
            </aside>
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Your week" />
      <SceneBody className="flex flex-col gap-6">
        {summary}
        <Streak days={6} />
        <div>
          <SectionHeader title="Noticed" className="mb-3" />
          {noticed}
        </div>
      </SceneBody>
      <TabBar items={PHONE_NAV} value="you" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 361 · What should I eat ---------- */

export function ShouldEatScene({ frame }: { readonly frame: SceneFrame }) {
  const body = (
    <>
      <InsightCard
        icon="bowlSoup"
        title="You have not had anything green since Thursday"
        body="Efo Riro would use the spinach that is about to turn."
        evidence={RICE_EVIDENCE}
        className="mb-5"
        actions={<Button size="sm">Show me Efo Riro</Button>}
      />
      <SectionHeader title="These would balance the week" className="mb-3" />
      <div className={cn('grid gap-4', frame === 'desktop' && 'sm:grid-cols-2')}>
        <MealCard name="Efo Riro" source="seed" minutes={40} match="nothing_to_buy" matchLine="Uses the spinach" />
        <MealCard name="Ewa Agoyin" source="seed" minutes={55} match="strong_match" matchLine="Uses the beans" />
      </div>
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="week" title="What should I eat?">
          <div className="max-w-[720px]">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="What should I eat?" onBack={() => {}} backLabel="Week" />
      <SceneBody>{body}</SceneBody>
      <TabBar items={PHONE_NAV} value="you" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 362 · Nutrition ---------- */

export function NutritionScene({ frame }: { readonly frame: SceneFrame }) {
  const body = (
    <>
      <Callout
        tone="ai"
        title="These are estimates"
        body="Worked out from typical quantities, not from what you actually put in the pot. Treat them as a rough shape, not a number."
        className="mb-5"
      />

      <div className={cn('grid gap-3', frame === 'phone' ? 'grid-cols-2' : 'grid-cols-4')}>
        <Stat label="Protein" value={68} unit="g" weight="compact" approximate />
        <Stat label="Carbs" value={310} unit="g" weight="compact" approximate />
        <Stat label="Greens" value={2} unit="days" weight="compact" />
        <Stat label="Meals" value={4} weight="compact" />
      </div>

      <div className="mt-5">
        <VarietyMeter distinct={4} total={7} />
      </div>
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="week" title="Roughly, this week">
          <div className="max-w-[680px]">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Roughly, this week" onBack={() => {}} backLabel="Week" />
      <SceneBody>{body}</SceneBody>
    </SceneRoot>
  );
}

/* ---------- 363 · Repeats ---------- */

const REPEATS = [
  { name: 'Jollof Rice', times: 6 },
  { name: 'Efo Riro', times: 4 },
  { name: 'Fried Rice', times: 3 },
];

export function RepeatsScene({ frame }: { readonly frame: SceneFrame }) {
  const list = (
    <Panel>
      <Panel.Header title="What you cook most" />
      <ul className="divide-y divide-line">
        <Repeat each={REPEATS}>
          {(item: (typeof REPEATS)[number]) => (
            <li key={item.name} className="flex items-baseline justify-between gap-3 px-pad py-row-y">
              <span className="min-w-0 truncate font-semibold text-ink">{item.name}</span>
              <span className="shrink-0">
                <Figure value={item.times} unit="times" size="sm" muted />
              </span>
            </li>
          )}
        </Repeat>
      </ul>
    </Panel>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="week" title="Your repeats">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {list}
            <aside>
              <InsightCard
                icon="repeat"
                title="Rice is in half of what you cook"
                body="Worth knowing rather than worth fixing."
                evidence={RICE_EVIDENCE}
              />
            </aside>
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Your repeats" onBack={() => {}} backLabel="Week" />
      <SceneBody>{list}</SceneBody>
    </SceneRoot>
  );
}

/* ---------- 364 · Spend ---------- */

export function SpendScene({ frame }: { readonly frame: SceneFrame }) {
  const body = (
    <>
      <Callout
        tone="caution"
        title="Roughly, and only roughly"
        body="Worked out from market prices we have seen, not from your receipts. If you upload receipts it gets closer."
        className="mb-5"
      />

      <Card variant="quiet" className="mb-5">
        <p className="text-sm text-ink-2">This week, on food</p>
        <Figure value="12,400" unit="₦" size="3xl" approximate />
        <p className="mt-1 text-sm text-ink-3">across 4 cooked meals and one shop</p>
      </Card>

      <Panel>
        <Panel.Header title="Where it went" />
        <ul className="divide-y divide-line">
          <Repeat each={[
            { name: 'Market shop, Saturday', amount: '8,400' },
            { name: 'Rice and oil, Tuesday', amount: '3,200' },
            { name: 'Pepper and tomatoes', amount: '800' },
          ]}>
            {(row: { name: string; amount: string }) => (
              <li key={row.name} className="flex items-baseline justify-between gap-3 px-pad py-row-y">
                <span className="min-w-0 truncate text-ctrl text-ink-2">{row.name}</span>
                <Figure value={row.amount} unit="₦" size="sm" approximate />
              </li>
            )}
          </Repeat>
        </ul>
      </Panel>
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="week" title="Roughly, what you spent">
          <div className="max-w-[620px]">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Roughly, what you spent" onBack={() => {}} backLabel="Week" />
      <SceneBody>{body}</SceneBody>
    </SceneRoot>
  );
}

/* ---------- 365 · Milestone ---------- */

export function MilestoneScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <SceneRoot frame={frame}>
      <div className="grid min-h-full place-items-center p-6">
        <div className="flex max-w-[440px] flex-col items-center gap-5 text-center">
          <Streak days={30} />
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-display">
            Thirty days of cooking.
          </h1>
          <p className="text-md text-ink-2">
            Twenty-two different meals. That is more variety than most weeks manage.
          </p>
          {/* States a fact and stops — no points, no levels, no pressure. */}
          <Button size="lg">Nice</Button>
        </div>
      </div>
    </SceneRoot>
  );
}

/* ---------- 370 · Mood ---------- */

export function MoodScene({ frame }: { readonly frame: SceneFrame }) {
  const [moods, setMoods] = useState<readonly string[]>([]);

  const body = (
    <>
      <h1 className="mb-2 font-display text-2xl font-extrabold tracking-display">
        What do you feel like?
      </h1>
      <p className="mb-5 text-md text-ink-2">
        Pick as many as you like, or none — we will still only show what you can actually make.
      </p>
      <MoodPicker value={moods} onChange={setMoods} />
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell
          active="kitchen"
          title="What do you feel like?"
          actions={<Button icon="cookingPot">Find me something</Button>}
        >
          <div className="max-w-[620px]">
            <MoodPicker value={moods} onChange={setMoods} />
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar onBack={() => {}} backLabel="Kitchen" />
      <SceneBody>{body}</SceneBody>
      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg" icon="cookingPot">
              Find me something
            </Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
    </SceneRoot>
  );
}

/* ---------- 371 · Constraints ---------- */

export function ConstraintsScene({ frame }: { readonly frame: SceneFrame }) {
  const [active, setActive] = useState<Record<string, boolean>>({ 'Under 30 min': true });

  const chips = ['Vegetarian', 'No pork', 'Halal', 'Under 30 min', 'One pot', 'No frying'];

  const body = (
    <>
      <Callout
        tone="info"
        title="These remove results"
        body="Unlike a mood, a constraint is a hard filter — if nothing matches, we will say so rather than quietly ignoring one."
        className="mb-5"
      />
      <div className="flex flex-wrap gap-3">
        <Repeat each={chips}>
          {(label: string) => (
            <ConstraintChip
              key={label}
              label={label}
              active={active[label] ?? false}
              onToggle={(next) => setActive((c) => ({ ...c, [label]: next }))}
            />
          )}
        </Repeat>
      </div>
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="settings" title="What to leave out" actions={<Button>Save</Button>}>
          <div className="max-w-[620px]">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="What to leave out" onBack={() => {}} backLabel="Settings" />
      <SceneBody>{body}</SceneBody>
      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg">Save</Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
    </SceneRoot>
  );
}

/* ---------- 372 · The week plan ---------- */

const DAYS = [
  { day: 'Monday', meal: { name: 'Egusi Soup', minutes: 70, source: 'seed' as const }, cooked: true },
  { day: 'Tuesday' },
  { day: 'Wednesday', meal: { name: 'Jollof Rice', minutes: 45, source: 'seed' as const } },
  { day: 'Thursday' },
  { day: 'Friday' },
  { day: 'Saturday', meal: { name: 'Indomie, upgraded', minutes: 20, source: 'ai' as const } },
  { day: 'Sunday' },
];

export function WeekPlanScene({ frame }: { readonly frame: SceneFrame }) {
  const grid = (
    <div className={cn('grid gap-3', frame === 'phone' ? 'grid-cols-2' : 'grid-cols-7')}>
      <Repeat each={DAYS}>
        {(entry: (typeof DAYS)[number]) => (
          <MealSlot
            key={entry.day}
            day={frame === 'desktop' ? entry.day.slice(0, 3) : entry.day}
            meal={entry.meal}
            cooked={entry.cooked ?? false}
            onPick={() => {}}
            onClear={() => {}}
          />
        )}
      </Repeat>
    </div>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell
          active="plan"
          title="This week"
          actions={<Button icon="shoppingBasket">Turn into a market list</Button>}
        >
          {/* The seven-day grid only fits here. */}
          {grid}
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="This week" />
      <SceneBody>{grid}</SceneBody>
      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg" icon="shoppingBasket">
              Turn into a market list
            </Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
      <TabBar items={PHONE_NAV} value="market" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 373 · Plan to market ---------- */

export function PlanToMarketScene({ frame }: { readonly frame: SceneFrame }) {
  const body = (
    <>
      <Callout
        tone="success"
        title="Three meals, nine things"
        body="We took out what your kitchen already has."
        className="mb-5"
      />
      <Panel>
        <Panel.Header title="What to buy" action={<span className="font-mono text-sm text-ink-3">₦8,400</span>} />
        <Panel.List>
          <Row.Market name="Long-grain rice" quantity="2 kg · for Jollof" ticked={false} onToggle={() => {}} />
          <Row.Market name="Egusi" quantity="500 g · for Egusi Soup" ticked={false} onToggle={() => {}} />
          <Row.Market name="Palm oil" quantity="1 bottle · for Efo Riro" ticked={false} onToggle={() => {}} />
        </Panel.List>
      </Panel>
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="plan" title="From your plan" actions={<Button>Save to market list</Button>}>
          <div className="max-w-[620px]">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="From your plan" onBack={() => {}} backLabel="Plan" />
      <SceneBody>{body}</SceneBody>
      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg">Save to market list</Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
    </SceneRoot>
  );
}

/* ---------- 374 · Portions ---------- */

export function PortionsScene({ frame }: { readonly frame: SceneFrame }) {
  const [serves, setServes] = useState(8);

  const body = (
    <>
      <PortionScaler serves={serves} onChange={setServes} baseServes={4} className="mb-5" />
      <Panel>
        <Panel.Header title="What that means" />
        <ul className="divide-y divide-line">
          <Repeat each={[
            { name: 'Long-grain rice', base: 3, unit: 'cups' },
            { name: 'Tomatoes', base: 6, unit: 'medium' },
            { name: 'Scotch bonnet', base: 2, unit: '' },
          ]}>
            {(row: { name: string; base: number; unit: string }) => (
              <li key={row.name} className="flex items-baseline justify-between gap-3 px-pad py-row-y">
                <span className="min-w-0 truncate text-ctrl text-ink">{row.name}</span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <Figure value={row.base} unit={row.unit} size="sm" muted />
                  <span className="text-ink-4">→</span>
                  <Figure
                    value={Math.round((row.base * serves) / 4 * 10) / 10}
                    unit={row.unit}
                    size="sm"
                  />
                </span>
              </li>
            )}
          </Repeat>
        </ul>
      </Panel>
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="kitchen" title="Cooking for how many?">
          <div className="max-w-[620px]">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Cooking for how many?" onBack={() => {}} backLabel="Recipe" />
      <SceneBody>{body}</SceneBody>
      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg">Use these amounts</Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
    </SceneRoot>
  );
}

/* ---------- Empty week ---------- */

export function WeekEmptyScene({ frame }: { readonly frame: SceneFrame }) {
  const empty = (
    <EmptyState
      title="Not enough cooking yet"
      body="Cook a few meals and we will start noticing patterns. Under four, anything we said would be a guess."
      action={{ label: 'Find something to cook', onClick: () => {} }}
    />
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="week" title="Your week">
          <div className="max-w-[520px]">{empty}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Your week" />
      <SceneBody>{empty}</SceneBody>
      <TabBar items={PHONE_NAV} value="you" onValueChange={() => {}} />
    </SceneRoot>
  );
}
