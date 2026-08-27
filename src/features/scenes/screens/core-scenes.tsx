import { useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { Blob, KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button, Dock, IconButton, PillButton } from '@ui/primitives';
import { ChipInput, Combobox, Field, Input, Switch, type ChipItem } from '@ui/inputs';
import { Callout, EmptyState } from '@ui/feedback';
import { Figure } from '@ui/display';
import { AppBar, TabBar, Tabs } from '@ui/navigation';
import { Card, Panel, RecentIngredients, SectionHeader, Avatar } from '@ui/structure';
import { CaptureMethods, PhotoCapture, VoiceCapture, type CaptureMethod } from '@ui/capture';
import {
  CookStep,
  HaveNeed,
  HonestyBar,
  MealCard,
  MealCardSkeleton,
  Provenance,
  RecipeHero,
  StepTimer,
  SuggestCTA,
  WhyThisMeal,
} from '@ui/domain';

import { DesktopShell, PHONE_NAV } from './shell';
import { SceneBody, SceneRoot } from '../parts/scene-frame';
import type { SceneFrame } from '../scenes.registry';

/**
 * The nine core app scenes.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/310-scene-kitchen.html
 *                                                          … 318-scene-auth.html
 *
 * **Nothing on these screens is hand-authored** — every block is a component
 * from the library. That is the point of each spec's composition audit, and the
 * thing the shipped app failed at 25 times.
 *
 * Each desktop variant shows something that genuinely does not fit on a phone.
 * Where it does not, the scene says so rather than stretching.
 */

/* ---------- 310 · The kitchen ---------- */

const RECENTS = ['Chicken', 'Palm oil', 'Plantain'];

export function KitchenScene({ frame }: { readonly frame: SceneFrame }) {
  const [method, setMethod] = useState<CaptureMethod>('type');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ChipItem[]>([
    { id: '1', label: 'Rice', source: 'typed' },
    { id: '2', label: 'Tomatoes', source: 'typed' },
    { id: '3', label: 'Scotch bonnet', source: 'typed' },
    { id: '4', label: 'Onion', source: 'typed' },
  ]);

  function add(label: string) {
    setItems((current) => [...current, { id: String(Date.now()), label, source: 'typed' }]);
  }

  const capture = (
    <>
      <CaptureMethods value={method} onValueChange={setMethod} className="mb-4" />

      <Show when={method === 'type'}>
        <Combobox
          query={query}
          onQueryChange={setQuery}
          onSelect={(option) => {
            add(option.label);
            setQuery('');
          }}
          onCreate={(label) => {
            add(label);
            setQuery('');
          }}
          onAbort={() => {}}
          options={[]}
          label="Add an ingredient"
        />
      </Show>

      <Show when={method === 'voice'}>
        <VoiceCapture recording={false} onStart={() => {}} onStop={() => {}} />
      </Show>

      <Show when={method === 'photo'}>
        <PhotoCapture shots={[]} onCapture={() => {}} onRemove={() => {}} />
      </Show>
    </>
  );

  const basket = (
    <>
      <SectionHeader title="In your kitchen" count={items.length} className="mb-3" />
      <ChipInput
        items={items}
        label="Your kitchen"
        onAdd={add}
        onRemove={(id) => setItems((c) => c.filter((i) => i.id !== id))}
      />
      <RecentIngredients items={RECENTS} onAdd={add} className="mt-5" />
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="kitchen" title="What is in your kitchen?">
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div>
              {capture}
              <div className="mt-6">{basket}</div>
            </div>

            {/* The makeable count only fits here — that is what earns the width. */}
            <aside className="flex flex-col gap-4">
              <Card variant="quiet">
                <p className="text-sm text-ink-2">From your kitchen you could make</p>
                <Figure value={11} size="3xl" />
                <p className="text-sm text-ink-2">meals, right now</p>
              </Card>
              <SuggestCTA ingredientCount={items.length} />
            </aside>
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar
        title="Kinnijije"
        action={<Avatar name="ada@kinnijije.ng" size={30} />}
      />
      <SceneBody>
        <h1 className="mb-4 font-display text-2xl font-extrabold tracking-display">
          What is in your kitchen?
        </h1>
        {capture}
        <div className="mt-6">{basket}</div>
      </SceneBody>

      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <SuggestCTA ingredientCount={items.length} />
          </Dock.Primary>
        </Dock.Actions>
      </Dock>

      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 311 · Suggestions ---------- */

const SUGGESTIONS = [
  {
    name: 'Jollof Rice, Party Style',
    source: 'seed' as const,
    minutes: 45,
    match: 'nothing_to_buy' as const,
    matchLine: 'Uses 6 of your 6 things',
    heroImage: { kind: 'photo' as const },
  },
  {
    name: 'Egusi Soup & Pounded Yam',
    source: 'ai' as const,
    minutes: 70,
    match: 'strong_match' as const,
    matchLine: 'Uses 5 of your 6 things',
    heroImage: { kind: 'ai_image' as const },
  },
  {
    name: 'Ewa Agoyin & Plantain',
    source: 'seed' as const,
    minutes: 55,
    match: 'needs_a_shop' as const,
    matchLine: 'Uses 3 of your 6 things',
    heroImage: { kind: 'placeholder' as const },
  },
];

export function SuggestionsScene({ frame }: { readonly frame: SceneFrame }) {
  const cards = (
    <Repeat each={SUGGESTIONS}>
      {(meal: (typeof SUGGESTIONS)[number]) => <MealCard key={meal.name} {...meal} />}
    </Repeat>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell
          active="kitchen"
          title="Three meals for tonight"
          actions={<PillButton icon="cycle">Re-suggest</PillButton>}
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-5 sm:grid-cols-3">{cards}</div>

            {/* The explainer only fits here. */}
            <aside className="flex flex-col gap-4">
              <Callout
                tone="info"
                title="Why these three?"
                body="They use the most of what you already have. The third needs a shop, so its button is quieter."
              />
              <WhyThisMeal
                matched={['Rice', 'Tomatoes', 'Onion', 'Scotch bonnet', 'Chicken', 'Stock cubes']}
                totalInBasket={6}
                reasons={['it is Nigerian (which you said you like)']}
              />
            </aside>
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar
        title="Tonight"
        onBack={() => {}}
        backLabel="Kitchen"
        action={<PillButton size="sm" icon="cycle">Re-suggest</PillButton>}
      />
      <SceneBody className="flex flex-col gap-5">{cards}</SceneBody>
      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 312 · The recipe ---------- */

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

const STEPS = [
  'Blend the peppers, tomatoes and onion until smooth.',
  'Heat the oil and fry the blended base until it darkens.',
  'Fry until the oil floats to the top. This is the step people rush.',
  'Add the rice and stock, then stir once.',
  'Cover tightly and steam on low heat.',
  'Rest off the heat for five minutes before serving.',
];

export function RecipeScene({ frame }: { readonly frame: SceneFrame }) {
  const [tab, setTab] = useState('ingredients');

  const detail = (
    <Tabs value={tab} onValueChange={setTab}>
      <Tabs.List label="Recipe sections">
        <Tabs.Tab value="ingredients">Ingredients</Tabs.Tab>
        <Tabs.Tab value="steps">Steps</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="ingredients">
        <HaveNeed have={HAVE} need={NEED} />
      </Tabs.Panel>

      <Tabs.Panel value="steps">
        <ol className="flex flex-col gap-3">
          <Repeat each={STEPS}>
            {(step: string, index: number) => (
              <li key={step} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-blade-xs border border-ink font-mono text-sm font-bold tnum">
                  {index + 1}
                </span>
                <span className="text-ctrl text-ink-2">{step}</span>
              </li>
            )}
          </Repeat>
        </ol>
      </Tabs.Panel>
    </Tabs>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell
          active="kitchen"
          title="Jollof Rice, Party Style"
          actions={
            <>
              <Button variant="secondary" icon="bookmarkSave">
                Save
              </Button>
              <Button icon="cookingPot">Start cooking</Button>
            </>
          }
        >
          {/* Hero left, ingredients right, and no dock — the actions live in
              the header where a mouse already is. */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <RecipeHero
                name="Jollof Rice, Party Style"
                source="seed"
                minutes={45}
                serves={4}
                difficulty="medium"
                heroImage={{ kind: 'photo' }}
                size="full"
              />
              <HonestyBar source="seed" imageKind="photo" />
            </div>
            <div>
              {detail}
              <Callout
                tone="info"
                title="Two things missing"
                body="Both are on your market list already."
                className="mt-5"
              />
            </div>
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar onBack={() => {}} backLabel="Suggestions" action={<IconButton icon="share" label="Share" variant="tertiary" />} />
      <SceneBody className="flex flex-col gap-5">
        <RecipeHero name="Jollof Rice, Party Style" source="seed" minutes={45} serves={4} difficulty="medium" heroImage={{ kind: 'photo' }} size="compact" />
        {detail}
        <HonestyBar source="seed" imageKind="photo" />
      </SceneBody>

      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg" icon="cookingPot">
              Start cooking
            </Button>
          </Dock.Primary>
          <Dock.Secondary>
            <Button variant="secondary" size="lg" icon="bookmarkSave" aria-label="Save">
              Save
            </Button>
          </Dock.Secondary>
        </Dock.Actions>
      </Dock>
    </SceneRoot>
  );
}

/* ---------- 313 · Cook mode ---------- */

export function CookScene({ frame }: { readonly frame: SceneFrame }) {
  const [step, setStep] = useState(3);
  const total = STEPS.length;
  const body = STEPS[step - 1] ?? '';

  const controls = (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        onDark
        size="lg"
        disabled={step === 1}
        onClick={() => setStep((s) => Math.max(1, s - 1))}
      >
        Previous
      </Button>
      <Button
        size="lg"
        onDark
        iconEnd="arrowRight"
        disabled={step === total}
        onClick={() => setStep((s) => Math.min(total, s + 1))}
      >
        Next step
      </Button>
    </div>
  );

  if (frame === 'desktop') {
    return (
      // No nav at all — leaving cook mode is a decision, not a stray tap.
      <SceneRoot frame={frame} className="bg-ink">
        <AppBar title="Jollof Rice, Party Style" onBack={() => {}} backLabel="Exit" onDark />
        <div className="grid flex-1 gap-8 p-8 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col justify-between gap-6">
            <CookStep index={step} total={total} title="Fry the base" body={body} />
            {controls}
          </div>

          {/* The timer and the next steps get their own column. */}
          <aside className="flex flex-col items-center gap-6 rounded-blade-lg border border-white/15 p-6">
            <StepTimer seconds={720} onDone={() => {}} />
            <div className="w-full">
              <p className="mb-3 text-xs font-extrabold uppercase tracking-overline text-sky-300">
                Coming up
              </p>
              <ol className="flex flex-col gap-2">
                <Repeat each={STEPS.slice(step, step + 2)}>
                  {(next: string, index: number) => (
                    <li key={next} className="text-sm text-ink-inv/70">
                      <span className="font-mono text-xs text-sky-300">Step {step + index + 1}</span>
                      <br />
                      {next}
                    </li>
                  )}
                </Repeat>
              </ol>
            </div>
          </aside>
        </div>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame} className="bg-ink">
      <AppBar title={`Step ${step} / ${total}`} onBack={() => {}} backLabel="Exit" onDark />
      <div className="flex flex-1 flex-col gap-6 p-5">
        <CookStep index={step} total={total} title="Fry the base" body={body} />
        <div className="flex justify-center">
          <StepTimer seconds={720} onDone={() => {}} size={112} />
        </div>
        <div className="mt-auto">{controls}</div>
      </div>
    </SceneRoot>
  );
}

/* ---------- 314 · Favourites ---------- */

export function FavouritesScene({ frame }: { readonly frame: SceneFrame }) {
  const saved = SUGGESTIONS.slice(0, 2);

  const list = (
    <div className={cn('grid gap-4', frame === 'desktop' && 'sm:grid-cols-3')}>
      <Repeat each={saved}>
        {(meal: (typeof SUGGESTIONS)[number]) => (
          <MealCard key={meal.name} {...meal} compact={frame === 'phone'} />
        )}
      </Repeat>
    </div>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="saved" title="Saved">
          <SectionHeader title="Your recipes" count={saved.length} className="mb-4" />
          {list}
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Saved" />
      <SceneBody>{list}</SceneBody>
      <TabBar items={PHONE_NAV} value="saved" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 315 · Settings ---------- */

export function SettingsScene({ frame }: { readonly frame: SceneFrame }) {
  const [metric, setMetric] = useState(true);
  const [notify, setNotify] = useState(false);

  const panels = (
    <div className="flex flex-col gap-5">
      <Panel>
        <Panel.Header title="How things are measured" />
        <Panel.Body>
          <div className="flex flex-col gap-4">
            <Switch checked={metric} onCheckedChange={setMetric} label="Metric units" />
            <p className="text-sm text-ink-3">
              Local measures — derica, cup, wrap — are always shown alongside.
            </p>
          </div>
        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Header title="What we send you" />
        <Panel.Body>
          <div className="flex flex-col gap-4">
            <Switch checked={notify} onCheckedChange={setNotify} label="Low-stock nudges" />
            <Switch checked={false} onCheckedChange={() => {}} label="Weekly summary" />
            <Switch
              checked={false}
              onCheckedChange={() => {}}
              label="Auto-publish recipes"
              lockReason="Admin only"
            />
          </div>
        </Panel.Body>
      </Panel>

      <Panel>
        <Panel.Header title="How we use AI" />
        <Panel.Body>
          <p className="text-sm text-ink-2">
            When nothing tested matches your kitchen, we ask a model and label the result{' '}
            <b>◆ Made by AI</b>. Quantities become estimates and the time is padded 30%.
          </p>
        </Panel.Body>
      </Panel>
    </div>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="settings" title="Settings">
          <div className="max-w-[640px]">{panels}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Settings" />
      <SceneBody>{panels}</SceneBody>
      <TabBar items={PHONE_NAV} value="you" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 316 · Onboarding ---------- */

export function OnboardingScene({ frame }: { readonly frame: SceneFrame }) {
  const content = (
    <div className="flex flex-col items-center gap-5 text-center">
      <Blob name="chef" size={96} expression="happy" />
      <h1 className="font-display text-3xl font-extrabold leading-tight tracking-display">
        Tell me what you have.
      </h1>
      <p className="max-w-[42ch] text-md text-ink-2">
        Type it, say it, or take a photo of your shelf — and I will find you three meals you can
        cook tonight.
      </p>

      <Card variant="quiet" className="w-full max-w-[420px] text-left">
        <p className="text-sm font-extrabold text-ink">You will always know who wrote a recipe</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Provenance source="seed" size="sm" />
          <Provenance source="ai" size="sm" />
        </div>
        <p className="mt-3 text-sm text-ink-2">
          Tested by a person, or written by a model with the quantities marked as estimates.
        </p>
      </Card>
    </div>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <div className="grid min-h-full place-items-center p-11">
          <div className="w-full max-w-[560px]">
            {content}
            <Button size="lg" fullWidth className="mt-7">
              Open my kitchen
            </Button>
          </div>
        </div>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <SceneBody className="grid place-items-center">{content}</SceneBody>
      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg">Open my kitchen</Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
    </SceneRoot>
  );
}

/* ---------- 317 · Offline ---------- */

export function OfflineScene({ frame }: { readonly frame: SceneFrame }) {
  const body = (
    <>
      <Callout
        tone="caution"
        title="You are offline"
        body="Saved recipes still work. New suggestions need a connection."
        className="mb-5"
      />

      <SectionHeader title="Saved and ready" count={2} className="mb-3" />
      <div className={cn('grid gap-4', frame === 'desktop' && 'sm:grid-cols-3')}>
        <MealCard
          name="Jollof Rice, Party Style"
          source="seed"
          minutes={45}
          match="strong_match"
          staleLabel="Offline · saved 41 min ago"
        />
        <MealCard
          name="Efo Riro"
          source="seed"
          minutes={40}
          match="strong_match"
          staleLabel="Offline · saved 2 hours ago"
        />
      </div>
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="saved" title="Offline">
          {body}
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Offline" />
      <SceneBody>{body}</SceneBody>
      <TabBar items={PHONE_NAV} value="saved" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 318 · Auth ---------- */

export function AuthScene({ frame }: { readonly frame: SceneFrame }) {
  const form = (
    <div className="flex w-full max-w-[400px] flex-col gap-4">
      <div className="mb-2 text-center">
        <KoboyoIcon name="cookingPot" size={40} className="text-sky" alone />
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-display">
          Sign in to save
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          You can cook without an account. Signing in keeps your recipes.
        </p>
      </div>

      <Field label="Email">
        {({ id, describedBy }) => (
          <Input id={id} aria-describedby={describedBy} type="email" placeholder="you@example.com" />
        )}
      </Field>

      <Button size="lg" fullWidth>
        Email me a link
      </Button>

      <p className="text-center text-xs text-ink-3">
        No password. We send a link that signs you in.
      </p>
    </div>
  );

  return (
    <SceneRoot frame={frame}>
      <div className="grid min-h-full place-items-center p-6">{form}</div>
    </SceneRoot>
  );
}

/* ---------- Empty / loading variants of the kitchen ---------- */

export function KitchenEmptyScene({ frame }: { readonly frame: SceneFrame }) {
  const body = (
    <>
      <h1 className="mb-4 font-display text-2xl font-extrabold tracking-display">
        What is in your kitchen?
      </h1>
      <CaptureMethods value="type" onValueChange={() => {}} className="mb-4" />
      <ChipInput items={[]} label="Your kitchen" onAdd={() => {}} onRemove={() => {}} />
      <RecentIngredients items={RECENTS} onAdd={() => {}} className="mt-5" />
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="kitchen" title="What is in your kitchen?">
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div>{body}</div>
            <aside>
              <SuggestCTA
                ingredientCount={0}
                state="disabled"
                disabledReason="Add at least one ingredient"
              />
            </aside>
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Kinnijije" action={<Avatar name="ada@kinnijije.ng" size={30} />} />
      <SceneBody>{body}</SceneBody>
      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <SuggestCTA
              ingredientCount={0}
              state="disabled"
              disabledReason="Add at least one ingredient"
            />
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}

export function SuggestionsLoadingScene({ frame }: { readonly frame: SceneFrame }) {
  const skeletons = (
    <div className={cn('grid gap-5', frame === 'desktop' && 'sm:grid-cols-3')}>
      <MealCardSkeleton />
      <MealCardSkeleton />
      <MealCardSkeleton />
    </div>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="kitchen" title="Finding you three meals…">
          {skeletons}
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Tonight" onBack={() => {}} backLabel="Kitchen" />
      <SceneBody className="flex flex-col gap-5">
        <div className="flex justify-center py-4">
          <SuggestCTA ingredientCount={6} state="loading" />
        </div>
        {skeletons}
      </SceneBody>
      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}

export function SuggestionsEmptyScene({ frame }: { readonly frame: SceneFrame }) {
  const empty = (
    <EmptyState
      title="Nothing matches yet"
      body="Add one or two more things and we will try again."
      action={{ label: 'Add ingredients', onClick: () => {} }}
    />
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="kitchen" title="Tonight">
          <div className="max-w-[520px]">{empty}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Tonight" onBack={() => {}} backLabel="Kitchen" />
      <SceneBody>{empty}</SceneBody>
      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}
