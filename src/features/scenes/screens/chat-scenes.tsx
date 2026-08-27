import { Repeat } from 'meemaw';

import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { AppBar, TabBar } from '@ui/navigation';
import { Panel, SectionHeader } from '@ui/structure';
import { Chat, ChatMeal, ChatStock } from '@ui/chat';
import { MealCard } from '@ui/domain';

import { DesktopShell, PHONE_NAV } from './shell';
import { SceneBody, SceneRoot } from '../parts/scene-frame';
import type { SceneFrame } from '../scenes.registry';

/**
 * The chat scenes.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/350-scene-chat-meal.html
 *                                                          … 355-scene-chat-about-meal.html
 *
 * Every answer on every one of these screens carries its source. That is not a
 * per-scene decision — `Chat.AI` will not render without one.
 */

const SUGGESTIONS = [
  'What can I make right now?',
  'Something under 30 minutes',
  'What is going off soon?',
];

/** The shell every chat scene shares. */
function ChatScene({
  frame,
  title,
  active = 'chat',
  children,
  aside,
}: {
  readonly frame: SceneFrame;
  readonly title: string;
  readonly active?: string;
  readonly children: React.ReactNode;
  readonly aside?: React.ReactNode;
}) {
  const thread = (
    <div className="flex min-h-0 flex-1 flex-col">
      <Chat.Thread>{children}</Chat.Thread>
      <Chat.Composer onSend={() => {}} suggestions={SUGGESTIONS} />
    </div>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active={active} title={title}>
          <div className={cn('grid h-full gap-6', aside !== undefined && 'lg:grid-cols-[1fr_300px]')}>
            <div className="flex min-h-[420px] flex-col overflow-hidden rounded-blade-lg border border-line-2 bg-white">
              {thread}
            </div>
            {aside !== undefined && <aside>{aside}</aside>}
          </div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title={title} />
      {thread}
      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 350 · Asking about a meal ---------- */

export function ChatMealScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <ChatScene frame={frame} title="Ask">
      <Chat.Disclaimer />
      <Chat.User text="What can I make with what I have?" />
      <Chat.AI
        body="You have enough for two things. Jollof needs nothing extra; Efo Riro wants a bit more palm oil."
        source={{ kind: 'kitchen', age: 'today' }}
        attachment={
          <ChatMeal
            meals={[
              { name: 'Jollof Rice', source: 'seed', minutes: 45, match: 'nothing_to_buy' },
              { name: 'Efo Riro', source: 'seed', minutes: 40, match: 'strong_match' },
            ]}
          />
        }
        actions={[
          { label: 'Open Jollof', onClick: () => {} },
          { label: 'What else?', onClick: () => {} },
        ]}
      />
    </ChatScene>
  );
}

/* ---------- 351 · Asking about stock ---------- */

export function ChatStockScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <ChatScene frame={frame} title="Ask" active="stock">
      <Chat.User text="How much rice do I have?" />
      <Chat.AI
        body="You are out of rice. It came off when you cooked Jollof on Thursday."
        source={{ kind: 'kitchen', age: 'today' }}
        attachment={
          <ChatStock
            countedAt="today"
            items={[
              { name: 'Long-grain rice', level: 'out', quantity: 0, unit: 'cups', storage: 'shelf' },
            ]}
          />
        }
        actions={[{ label: 'Add to market list', onClick: () => {} }]}
      />
    </ChatScene>
  );
}

/* ---------- 352 · Substitution ---------- */

export function ChatSubstitutionScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <ChatScene frame={frame} title="Ask">
      <Chat.User text="I have no palm oil. What can I use?" />
      <Chat.AI
        body="Groundnut oil works. It changes the colour but not much else — Efo Riro will look paler and taste close."
        source={{ kind: 'general' }}
        actions={[{ label: 'Use groundnut oil', onClick: () => {} }]}
      />
      <Chat.User text="Will it still be Efo Riro?" />
      <Chat.AI
        body="Close enough for a weeknight. The tested recipe calls for palm oil, so the colour is the honest difference."
        source={{ kind: 'recipe', ref: 'Efo Riro' }}
      />
    </ChatScene>
  );
}

/* ---------- 353 · The model failed ---------- */

export function ChatErrorScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <ChatScene frame={frame} title="Ask">
      <Chat.User text="What can I make with what I have?" />
      <Chat.Error onRetry={() => {}} />
      <Chat.User text="Anything with rice?" />
      <Chat.Unknown onWriteAnyway={() => {}} />
    </ChatScene>
  );
}

/* ---------- 354 · History ---------- */

const PAST = [
  { question: 'What can I make with what I have?', when: 'Today' },
  { question: 'Can I swap the palm oil?', when: 'Today' },
  { question: 'What is going off soon?', when: 'Tuesday' },
  { question: 'How much rice do I have?', when: 'Monday' },
];

export function ChatHistoryScene({ frame }: { readonly frame: SceneFrame }) {
  const list = (
    <Panel>
      <Panel.Header title="What you have asked" />
      <ul className="divide-y divide-line">
        <Repeat each={PAST}>
          {(item: (typeof PAST)[number]) => (
            <li key={item.question}>
              <button
                type="button"
                className="flex w-full items-baseline justify-between gap-3 px-pad py-row-y text-left transition-colors hover:bg-paper-2"
              >
                <span className="min-w-0 truncate text-ctrl text-ink">{item.question}</span>
                <span className="shrink-0 font-mono text-xs text-ink-3">{item.when}</span>
              </button>
            </li>
          )}
        </Repeat>
      </ul>
    </Panel>
  );

  if (frame === 'desktop') {
    return (
      <SceneRoot frame={frame}>
        <DesktopShell active="chat" title="Ask" actions={<Button variant="secondary">New question</Button>}>
          <div className="max-w-[620px]">{list}</div>
        </DesktopShell>
      </SceneRoot>
    );
  }

  return (
    <SceneRoot frame={frame}>
      <AppBar title="Ask" onBack={() => {}} backLabel="Back" />
      <SceneBody>{list}</SceneBody>
      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => {}} />
    </SceneRoot>
  );
}

/* ---------- 355 · About a specific meal ---------- */

export function ChatAboutMealScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <ChatScene
      frame={frame}
      title="About Jollof Rice"
      aside={
        <>
          <SectionHeader title="The recipe" level="group" className="mb-3" />
          <MealCard
            name="Jollof Rice, Party Style"
            source="seed"
            minutes={45}
            match="nothing_to_buy"
            heroImage={{ kind: 'photo' }}
          />
        </>
      }
    >
      <Chat.User text="Why does mine never come out this colour?" />
      <Chat.AI
        body="Usually the base is not fried long enough. The recipe says to wait until the oil floats to the top — that step is where the colour comes from."
        source={{ kind: 'recipe', ref: 'Jollof Rice, Party Style' }}
        actions={[{ label: 'Take me to that step', onClick: () => {} }]}
      />
      <Chat.User text="How long is long enough?" />
      <Chat.AI
        body="Twelve minutes on medium, and you are watching for the oil rather than the clock."
        source={{ kind: 'recipe', ref: 'Jollof Rice, Party Style' }}
      />
    </ChatScene>
  );
}
