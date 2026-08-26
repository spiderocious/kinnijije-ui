import { useState } from 'react';
import { Repeat } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button, Dock, IconButton } from '@ui/primitives';
import { Callout, EmptyState } from '@ui/feedback';
import { Figure, Stat } from '@ui/display';
import { AppBar, TabBar } from '@ui/navigation';
import { Card, Panel, Row, SectionHeader } from '@ui/structure';
import { RestockSuggestion, StockItem, StockUntracked, type StorageKind } from '@ui/stock';
import type { KoboyoIconName } from '@icons';
import { InsightCard } from '@ui/insights';
import { MealCard } from '@ui/domain';
import {
  CaptureRecovery,
  ExtractionResult,
  PermissionPrompt,
  PhotoCapture,
} from '@ui/capture';

import { DesktopShell, PHONE_NAV } from './shell';
import { SceneBody, SceneRoot } from '../parts/scene-frame';
import type { SceneFrame } from '../scenes.registry';

/**
 * The standing kitchen and capture scenes.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/330-scene-kitchen-dashboard.html
 *                                                          … 344-scene-label-capture.html
 *
 * The pantry only exists because it is maintained by side-effects of what the
 * cook already does. Every screen here honours that: nothing asks for a count,
 * and the market list is what tops the kitchen back up.
 */

const LOW_STOCK = [
  { name: 'Scotch bonnet', reason: '3 left — you usually keep 10' },
  { name: 'Long-grain rice', reason: 'out — 4 saved meals need it' },
  { name: 'Palm oil', reason: 'nearly out' },
];

interface PantryEntry {
  readonly name: string;
  readonly icon: KoboyoIconName;
  readonly quantity: number;
  readonly unit: string;
  readonly storage: StorageKind;
}

const PERISHING: PantryEntry[] = [
  { name: 'Spinach', icon: 'seedling', quantity: 1, unit: 'bunch', storage: 'fridge' },
  { name: 'Tomatoes', icon: 'tomato', quantity: 6, unit: 'medium', storage: 'fridge' },
  { name: 'Chicken', icon: 'chickenCoop', quantity: 1, unit: 'kg', storage: 'fridge' },
];

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

/* ---------- 330 · The kitchen dashboard ---------- */

export function KitchenDashboardScene({ frame }: { readonly frame: SceneFrame }) {
  const stats = (
    <div className={cn('grid gap-3', frame === 'phone' ? 'grid-cols-2' : 'grid-cols-4')}>
      <Stat label="Things in" value={34} weight="compact" />
      <Stat label="Running low" value={6} weight="compact" />
      <Stat label="Use soon" value={3} weight="compact" />
      <Stat label="Could make" value={11} weight="compact" />
    </div>
  );

  const lowStock = (
    <div>
      <SectionHeader title="Worth doing something about" className="mb-3" />
      <div className="flex flex-col gap-3">
        <Repeat each={LOW_STOCK}>
          {(item: (typeof LOW_STOCK)[number]) => (
            <RestockSuggestion key={item.name} name={item.name} reason={item.reason} onAdd={() => {}} />
          )}
        </Repeat>
      </div>
    </div>
  );

  const useFirst = (
    <Panel>
      <Panel.Header title="Use these first" />
      <Panel.List>
        <Repeat each={PERISHING.slice(0, 2)}>
          {(item: PantryEntry) => (
            <StockItem
              key={item.name}
              name={item.name}
              icon={item.icon}
              level="low"
              quantity={item.quantity}
              unit={item.unit}
              storage={item.storage}
              freshness="soon"
              onPress={() => {}}
            />
          )}
        </Repeat>
      </Panel.List>
    </Panel>
  );

  const noticed = (
    <InsightCard
      icon="bagRice"
      title="You have cooked rice four times this week"
      body="Beans and yam are sitting unused."
      evidence={EVIDENCE}
      onInspect={() => {}}
    />
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="stock" title="Your kitchen">
          <p className="mb-5 font-mono text-xs text-ink-3">counted today</p>
          {stats}
          {/* The insight column only fits here. */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-6">
              {lowStock}
              {useFirst}
            </div>
            <aside className="flex flex-col gap-4">
              <SectionHeader title="Noticed" level="group" />
              {noticed}
            </aside>
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Your kitchen" />
      <SceneBody className="flex flex-col gap-6">
        <div>
          <p className="mb-3 font-mono text-xs text-ink-3">counted today</p>
          {stats}
        </div>
        {lowStock}
        {useFirst}
        <div>
          <SectionHeader title="Noticed" level="group" className="mb-3" />
          {noticed}
        </div>
      </SceneBody>
      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 331 · Stock by location ---------- */

const BY_LOCATION: { storage: StorageKind; items: PantryEntry[] }[] = [
  {
    storage: 'fridge',
    items: PERISHING,
  },
  {
    storage: 'shelf',
    items: [
      { name: 'Long-grain rice', icon: 'bagRice', quantity: 0, unit: 'cups', storage: 'shelf' },
      { name: 'Palm oil', icon: 'bottleWater', quantity: 1, unit: 'bottle', storage: 'shelf' },
    ],
  },
];

export function StockLocationScene({ frame }: { readonly frame: SceneFrame }) {
  const groups = (
    <div className="flex flex-col gap-5">
      <Repeat each={BY_LOCATION}>
        {(group: (typeof BY_LOCATION)[number]) => (
          <Panel key={group.storage}>
            <Panel.Header
              title={group.storage.charAt(0).toUpperCase() + group.storage.slice(1)}
              action={
                <span className="font-mono text-xs text-ink-3">{group.items.length}</span>
              }
            />
            <Panel.List>
              <Repeat each={group.items}>
                {(item: PantryEntry) => (
                  <StockItem
                    key={item.name}
                    name={item.name}
                    icon={item.icon}
                    level={item.quantity === 0 ? 'out' : 'plenty'}
                    quantity={item.quantity}
                    unit={item.unit}
                    storage={item.storage}
                    onPress={() => {}}
                  />
                )}
              </Repeat>
              <StockUntracked name="Stock cubes" onTrack={() => {}} />
            </Panel.List>
          </Panel>
        )}
      </Repeat>
    </div>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="stock" title="Stock">
          <div className="grid gap-5 lg:grid-cols-2">{groups}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Stock" onBack={() => {}} backLabel="Kitchen" />
      <SceneBody>{groups}</SceneBody>
      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 332 · Running low ---------- */

export function LowStockScene({ frame }: { readonly frame: SceneFrame }) {
  const body = (
    <>
      <p className="mb-5 text-md text-ink-2">
        6 things. Three of them are in meals you cook often.
      </p>
      <div className="flex flex-col gap-3">
        <Repeat each={LOW_STOCK}>
          {(item: (typeof LOW_STOCK)[number]) => (
            <RestockSuggestion key={item.name} name={item.name} reason={item.reason} onAdd={() => {}} />
          )}
        </Repeat>
      </div>
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell
          active="stock"
          title="Running low"
          actions={<Button icon="shoppingBasket">Add all to market list</Button>}
        >
          <div className="max-w-[620px]">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Running low" onBack={() => {}} backLabel="Kitchen" />
      <SceneBody>{body}</SceneBody>
      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg" icon="shoppingBasket">
              Add all to market list
            </Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 333 · Add stock ---------- */

export function AddStockScene({ frame }: { readonly frame: SceneFrame }) {
  const body = (
    <>
      <Callout
        tone="info"
        title="You do not have to do this"
        body="Your kitchen fills itself as you cook and shop. This is for when you want to correct something."
        className="mb-5"
      />

      <Panel>
        <Panel.Header title="Recently used" />
        <Panel.List>
          <Repeat each={PERISHING}>
            {(item: PantryEntry) => (
              <Row.Market
                key={item.name}
                name={item.name}
                quantity={`${item.quantity} ${item.unit}`}
                ticked={false}
                onToggle={() => {}}
              />
            )}
          </Repeat>
        </Panel.List>
      </Panel>
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="stock" title="Add to your kitchen" actions={<Button>Save</Button>}>
          <div className="max-w-[620px]">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Add to your kitchen" onBack={() => {}} backLabel="Stock" />
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

/* ---------- 334 · Stock detail ---------- */

export function StockDetailScene({ frame }: { readonly frame: SceneFrame }) {
  const detail = (
    <div className="flex flex-col gap-5">
      <Card variant="quiet">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-blade-sm bg-dish-fill text-dish-line">
            <KoboyoIcon name="tomato" size={32} />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-display">Tomatoes</h2>
            <Figure value={6} unit="medium" size="lg" />
            <p className="mt-1 font-mono text-xs text-ink-3">counted today · fridge</p>
          </div>
        </div>
      </Card>

      <Panel>
        <Panel.Header title="What changed it" />
        <Panel.List>
          <Row.Step index={1} instruction="Cooked Jollof Rice — used 4" minutes={undefined} />
          <Row.Step index={2} instruction="Ticked off the market list — added 10" />
          <Row.Step index={3} instruction="Read from a shelf photo — seeded 6" />
        </Panel.List>
      </Panel>

      <Callout
        tone="neutral"
        title="Nothing here was typed in"
        body="Every change came from cooking, shopping, or a photo — which is the only way this stays accurate."
      />
    </div>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="stock" title="Tomatoes">
          <div className="max-w-[620px]">{detail}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar onBack={() => {}} backLabel="Stock" />
      <SceneBody>{detail}</SceneBody>
    </SceneRoot>
  );
}

/* ---------- 335 · Market list ---------- */

const MARKET = [
  { name: 'Long-grain rice', why: 'for Jollof Rice · you usually buy 2kg', qty: '2 kg' },
  { name: 'Scotch bonnet', why: 'for 2 saved meals · you usually buy 10', qty: '10' },
  { name: 'Palm oil', why: 'for Efo Riro', qty: '1 bottle' },
  { name: 'Tomatoes', why: '', qty: '6 medium' },
];

export function MarketListScene({ frame }: { readonly frame: SceneFrame }) {
  const [ticked, setTicked] = useState<Record<string, boolean>>({});

  const list = (
    <Panel>
      <Panel.Header
        title="9 things"
        action={<span className="font-mono text-sm text-ink-3">roughly ₦8,400</span>}
      />
      <Panel.List>
        <Repeat each={MARKET}>
          {(item: (typeof MARKET)[number]) => (
            <Row.Market
              key={item.name}
              name={item.name}
              quantity={item.why === '' ? item.qty : `${item.qty} · ${item.why}`}
              ticked={ticked[item.name] ?? false}
              onToggle={(next) => setTicked((c) => ({ ...c, [item.name]: next }))}
            />
          )}
        </Repeat>
      </Panel.List>
    </Panel>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell
          active="market"
          title="Market list"
          actions={<Button icon="shoppingCart">I am at the market</Button>}
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {list}
            {/* What each item unblocks only fits here. */}
            <aside>
              <Callout
                tone="info"
                title="What these unblock"
                body="Rice alone is in four of your saved meals. Buying it makes all four cookable tonight."
              />
            </aside>
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Market list" action={<IconButton icon="plus" label="Add an item" variant="tertiary" />} />
      <SceneBody>{list}</SceneBody>
      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg" icon="shoppingCart">
              I am at the market
            </Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
      <TabBar items={PHONE_NAV} value="market" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 336 · Market mode ---------- */

export function MarketModeScene({ frame }: { readonly frame: SceneFrame }) {
  const [ticked, setTicked] = useState<Record<string, boolean>>({ 'Long-grain rice': true });
  const done = Object.values(ticked).filter(Boolean).length;

  // Big targets — this is used one-handed, in a crowd, holding a bag.
  return (
    <SceneRoot frame={frame}>
      <AppBar
        title={`Market · ${done} / 9`}
        onBack={() => {}}
        backLabel="Exit"
      />

      <SceneBody className="px-3">
        <SectionHeader title="Shelf" level="group" className="mb-3 px-1" />
        <ul className="flex flex-col gap-2">
          <Repeat each={MARKET}>
            {(item: (typeof MARKET)[number]) => {
              const on = ticked[item.name] ?? false;
              return (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => setTicked((c) => ({ ...c, [item.name]: !on }))}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-blade border-bold px-4 py-4 text-left',
                      'transition-colors duration-fast',
                      on
                        ? 'border-success-border bg-success-soft'
                        : 'border-ink bg-white shadow-drop-sm',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-blade-xs border-bold',
                        on ? 'border-ink bg-success text-white' : 'border-line-2',
                      )}
                    >
                      {on && <KoboyoIcon name="tick" size={17} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-lg font-extrabold',
                          on ? 'text-ink-3 line-through' : 'text-ink',
                        )}
                      >
                        {item.name}
                      </span>
                      <span className="font-mono text-sm text-ink-3">{item.qty}</span>
                    </span>
                  </button>
                </li>
              );
            }}
          </Repeat>
        </ul>
      </SceneBody>

      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg" icon="basket">
              Done — update my kitchen
            </Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
    </SceneRoot>
  );
}

/* ---------- 337 · Use it up ---------- */

export function UseItUpScene({ frame }: { readonly frame: SceneFrame }) {
  const perishing = (
    <Panel>
      <Panel.Header title="Use these first" />
      <Panel.List>
        <Repeat each={PERISHING}>
          {(item: PantryEntry) => (
            <StockItem
              key={item.name}
              name={item.name}
              icon={item.icon}
              level="low"
              quantity={item.quantity}
              unit={item.unit}
              storage={item.storage}
              freshness="soon"
            />
          )}
        </Repeat>
      </Panel.List>
    </Panel>
  );

  const meals = (
    <div className={cn('grid gap-4', frame === 'desktop' && 'sm:grid-cols-2')}>
      <MealCard
        name="Efo Riro"
        source="seed"
        minutes={40}
        match="nothing_to_buy"
        matchLine="Uses the spinach and tomatoes"
      />
      <MealCard
        name="Chicken Stew"
        source="seed"
        minutes={55}
        match="strong_match"
        matchLine="Uses the chicken and tomatoes"
      />
    </div>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="stock" title="Use these first">
          <p className="mb-5 text-md text-ink-2">Three things worth cooking soon.</p>
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            {perishing}
            <div>
              <SectionHeader title="These would use them" className="mb-3" />
              {meals}
            </div>
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Use these first" onBack={() => {}} backLabel="Kitchen" />
      <SceneBody className="flex flex-col gap-6">
        <p className="text-md text-ink-2">Three things worth cooking soon.</p>
        {perishing}
        <div>
          <SectionHeader title="These would use them" className="mb-3" />
          {meals}
        </div>
      </SceneBody>
      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 338 · Stock history ---------- */

export function StockHistoryScene({ frame }: { readonly frame: SceneFrame }) {
  const history = (
    <Panel>
      <Panel.Header title="Everything that changed your kitchen" />
      <Panel.List>
        <Row.Step index={1} instruction="Cooked Jollof Rice — rice, tomatoes, onion out" />
        <Row.Step index={2} instruction="Ticked 9 things off the market list" />
        <Row.Step index={3} instruction="Read a shelf photo — 14 things seeded" />
        <Row.Step index={4} instruction="Cooked Efo Riro — spinach, palm oil out" />
      </Panel.List>
    </Panel>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="stock" title="Kitchen history">
          <div className="max-w-[680px]">{history}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="History" onBack={() => {}} backLabel="Stock" />
      <SceneBody>{history}</SceneBody>
    </SceneRoot>
  );
}

/* ---------- 339 · Empty kitchen ---------- */

export function EmptyKitchenScene({ frame }: { readonly frame: SceneFrame }) {
  const body = (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-blade-sm bg-sky-soft text-sky-on">
        <KoboyoIcon name="takingPhotoCamera" size={32} />
      </span>
      <h1 className="font-display text-2xl font-extrabold tracking-display">
        Let us see your kitchen
      </h1>
      <p className="max-w-[44ch] text-md text-ink-2">
        One photo of a shelf or inside your fridge. We will read what is there and you can fix
        anything we get wrong.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" icon="takingPhotoCamera">
          Photograph a shelf
        </Button>
        <Button variant="secondary" size="lg">
          Add a few by hand
        </Button>
      </div>
      {/* The skip is always visible — the pantry is optional by design. */}
      <p className="text-sm text-ink-3">You can skip this — suggestions work without it.</p>
    </div>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="stock" title="Your kitchen">
          <div className="mx-auto max-w-[560px] py-8">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Your kitchen" />
      <SceneBody className="grid place-items-center">{body}</SceneBody>
      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 340-341 · Upload receipt / shelf scan ---------- */

export function ShelfScanScene({ frame }: { readonly frame: SceneFrame }) {
  const [shots, setShots] = useState([{ id: '1', label: 'Fridge shelf' }]);

  const body = (
    <>
      <p className="mb-5 text-md text-ink-2">
        Two or three angles read better than one wide shot.
      </p>
      <PhotoCapture
        shots={shots}
        onCapture={() => setShots((s) => [...s, { id: String(Date.now()), label: 'Another angle' }])}
        onRemove={(id) => setShots((s) => s.filter((shot) => shot.id !== id))}
      />
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell
          active="stock"
          title="Photograph your shelf"
          actions={<Button icon="sparkle">Read these {shots.length}</Button>}
        >
          <div className="max-w-[620px]">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Photograph your shelf" onBack={() => {}} backLabel="Kitchen" />
      <SceneBody>{body}</SceneBody>
      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg" icon="sparkle">
              Read these {shots.length}
            </Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
    </SceneRoot>
  );
}

export function UploadReceiptScene({ frame }: { readonly frame: SceneFrame }) {
  const body = (
    <>
      <Callout
        tone="info"
        title="A receipt is the fastest way to fill a kitchen"
        body="It lists what you bought and how much, which is more than a photo of a shelf can tell us."
        className="mb-5"
      />
      <PhotoCapture
        shots={[{ id: '1', label: 'Market receipt' }]}
        onCapture={() => {}}
        onRemove={() => {}}
        maxShots={2}
      />
    </>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="stock" title="Upload a receipt" actions={<Button icon="sparkle">Read it</Button>}>
          <div className="max-w-[620px]">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Upload a receipt" onBack={() => {}} backLabel="Kitchen" />
      <SceneBody>{body}</SceneBody>
      <Dock>
        <Dock.Actions>
          <Dock.Primary>
            <Button size="lg" icon="sparkle">
              Read it
            </Button>
          </Dock.Primary>
        </Dock.Actions>
      </Dock>
    </SceneRoot>
  );
}

/* ---------- 342 · Extraction review ---------- */

export function ExtractionReviewScene({ frame }: { readonly frame: SceneFrame }) {
  const result = (
    <ExtractionResult
      items={[
        { id: '1', name: 'Rice', uncertain: false },
        { id: '2', name: 'Tomatoes', uncertain: false },
        { id: '3', name: 'Scotch bonnet', uncertain: false },
        { id: '4', name: 'Onion', uncertain: false },
        { id: '5', name: 'Half a yam', uncertain: true },
        { id: '6', name: 'Something green', uncertain: true },
      ]}
      onConfirm={() => {}}
      onReject={() => {}}
    />
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="stock" title="What we read">
          {/* The source photo beside the reads — the whole reason this has a
              desktop variant. A bad reading is diagnosable here and nowhere else. */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHeader title="What we looked at" level="group" className="mb-3" />
              <div className="grid h-[280px] place-items-center rounded-blade-lg border border-ink bg-dish-fill text-dish-line">
                <KoboyoIcon name="takingPhotoCamera" size={48} alone />
              </div>
            </div>
            <div>
              <SectionHeader title="What we found" level="group" className="mb-3" />
              {result}
            </div>
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="What we read" onBack={() => {}} backLabel="Retake" />
      <SceneBody>{result}</SceneBody>
    </SceneRoot>
  );
}

/* ---------- 343 · Capture recovery ---------- */

export function CaptureRecoveryScene({ frame }: { readonly frame: SceneFrame }) {
  const body = <CaptureRecovery onRetry={() => {}} onType={() => {}} />;

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="stock" title="Photograph your shelf">
          <div className="mx-auto max-w-[520px] py-8">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Photograph your shelf" onBack={() => {}} backLabel="Kitchen" />
      <SceneBody className="grid place-items-center">{body}</SceneBody>
    </SceneRoot>
  );
}

/* ---------- 344 · Permission ---------- */

export function LabelCaptureScene({ frame }: { readonly frame: SceneFrame }) {
  const body = <PermissionPrompt kind="camera" onAllow={() => {}} onSkip={() => {}} />;

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="stock" title="Your kitchen">
          <div className="mx-auto max-w-[520px] py-8">{body}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Your kitchen" onBack={() => {}} backLabel="Back" />
      <SceneBody className="grid place-items-center">{body}</SceneBody>
    </SceneRoot>
  );
}

/* ---------- Empty market list ---------- */

export function MarketEmptyScene({ frame }: { readonly frame: SceneFrame }) {
  const empty = (
    <EmptyState
      kind="good"
      title="Nothing to buy"
      body="Your kitchen has everything your saved meals need."
    />
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="market" title="Market list">
          <div className="max-w-[520px]">{empty}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Market list" />
      <SceneBody>{empty}</SceneBody>
      <TabBar items={PHONE_NAV} value="market" onValueChange={() => {}} />
    </SceneRoot>
  );
}
