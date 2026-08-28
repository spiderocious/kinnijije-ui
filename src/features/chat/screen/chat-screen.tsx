import { useEffect, useRef, useState, type FormEvent } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { Callout } from '@ui/feedback';
import { Input } from '@ui/inputs';
import { AppBar } from '@ui/navigation';
import { Button, IconButton } from '@ui/primitives';

import { useAsk, useChatHistory, useClearChat } from '../hooks/use-chat';
import { ChatMessage } from '../parts/chat-message';
import type { ChatHistoryItem } from '../services/chat.api';

/** Openers, so an empty screen is not a blank prompt to nobody. */
const STARTERS = [
  'What can I make tonight?',
  'Add rice and tomatoes to my market list',
  'What is about to spoil?',
  'I have no meat — what then?',
];

/**
 * Chat with the kitchen.
 *
 * The assistant can ACT — it adds to stock and to the market list through the
 * tool round-trip — so by the time a reply lands here the work is already done.
 * Nothing on this screen asks for confirmation; it reports what happened.
 */
export default function ChatScreen() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history = [] } = useChatHistory();
  const ask = useAsk();
  const clear = useClearChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history.length, ask.isPending]);

  const send = (text: string): void => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || ask.isPending) return;
    ask.mutate(trimmed);
    setQuestion('');
  };

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    send(question);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-ground">
      <AppBar
        title="Ask about your kitchen"
        onBack={() => {
          void navigate({ to: ROUTES.KITCHEN });
        }}
        backLabel="Kitchen"
        action={
          <Show when={history.length > 0}>
            <IconButton
              icon="trash"
              label="Clear this conversation"
              onClick={() => {
                clear.mutate();
              }}
            />
          </Show>
        }
      />

      <div className="mx-auto w-full max-w-[720px] flex-1 px-5 py-5 sm:px-6">
        <Show when={history.length === 0}>
          <div className="py-8 text-center">
            <KoboyoIcon name="robotForAi" size={64} className="text-grape" alone />
            <p className="mt-4 font-display text-lg font-extrabold text-ink">
              Ask me anything about food
            </p>
            <p className="mt-1 text-sm text-ink-2">
              I know what is in your kitchen and what you have been cooking — and I can add things
              for you.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Repeat each={STARTERS}>
                {(starter: string) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => {
                      send(starter);
                    }}
                    className="rounded-full border border-line bg-white px-3.5 py-2 text-xs text-ink transition-colors hover:border-sky hover:bg-sky-soft"
                  >
                    {starter}
                  </button>
                )}
              </Repeat>
            </div>
          </div>
        </Show>

        <div className="flex flex-col gap-5">
          <Repeat each={[...history]}>
            {(message: ChatHistoryItem) => <ChatMessage key={message.id} message={message} />}
          </Repeat>
        </div>

        {/* A thinking row shaped like a reply, so the layout does not jump when
            the real one arrives. */}
        <Show when={ask.isPending}>
          <div className="mt-5 flex gap-3">
            <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-grape-soft">
              <KoboyoIcon name="robotForAi" size={18} className="text-grape-onsoft" alone />
            </span>
            <div className="flex-1 rounded-blade bg-white px-4 py-3">
              <div className="h-3 w-2/5 rounded-full bg-line animate-shimmer" />
              <div className="mt-2 h-3 w-4/5 rounded-full bg-line animate-shimmer" />
              <p className="mt-2.5 font-mono text-[11px] text-ink-3">
                checking your kitchen…
              </p>
            </div>
          </div>
        </Show>

        <Show when={ask.error !== null}>
          <Callout
            tone="critical"
            title="That did not work"
            body={ask.error?.message}
            className="mt-4"
          />
        </Show>

        <div ref={bottomRef} className="h-2" />
      </div>

      <form
        onSubmit={submit}
        className="sticky bottom-0 border-t border-line bg-ground/95 p-4 backdrop-blur"
      >
        <div className="mx-auto flex w-full max-w-[720px] gap-2">
          <Input
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
            }}
            placeholder="What can I make tonight?"
            size="lg"
            className="flex-1"
          />
          <Button
            type="submit"
            size="lg"
            loading={ask.isPending}
            disabled={question.trim().length === 0}
          >
            Ask
          </Button>
        </div>
      </form>
    </div>
  );
}
