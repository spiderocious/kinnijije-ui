import { useState, type ReactNode } from 'react';
import { Repeat, Show } from 'meemaw';

import { BlobThinking, KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';

/**
 * The chat surface — the cook asking, the chef answering.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/420-chat-user.html
 *                                                          421-chat-ai.html
 *                                                          422-chat-thinking.html
 *                                                          423-chat-composer.html
 *                                                          424-chat-suggestion.html
 *                                                          425-chat-citation.html
 *                                                          428-chat-error.html
 *                                                          429-chat-disclaimer.html
 *
 * **`Chat.AI.Source` is a REQUIRED slot** — the same contract as
 * `Meal.Provenance`. This product's whole claim is that you can tell where
 * knowledge came from, so an answer that cannot cite its source does not
 * render.
 *
 * The blade is **mirrored** between the two bubbles so the sharp corners point
 * back toward the sender. That is the only structural difference between them,
 * and it is enough.
 */

/* ---------- Citation — the source line ---------- */

export type CitationKind = 'recipe' | 'kitchen' | 'general';

const CITATION_COPY: Record<CitationKind, (ref: string, age?: string) => string> = {
  // Ranked by how much each is worth.
  recipe: (ref) => `From ${ref} — a tested recipe`,
  kitchen: (_ref, age) => `From your kitchen — counted ${age ?? 'today'}`,
  general: () => 'General knowledge — not from a tested recipe',
};

const CITATION_CLASS: Record<CitationKind, string> = {
  recipe: 'text-success-onsoft',
  kitchen: 'text-info-onsoft',
  // The weakest, and the copy says so plainly.
  general: 'text-ink-3',
};

const CITATION_ICON = {
  recipe: 'cookbook',
  kitchen: 'basket',
  general: 'robotForAi',
} as const;

export interface ChatCitationProps {
  readonly kind: CitationKind;
  /** What was cited — a recipe name, a count. Unused for `general`. */
  readonly ref?: string;
  /** How old the kitchen count is. */
  readonly age?: string;
}

function ChatCitation({ kind, ref = '', age }: ChatCitationProps) {
  return (
    <p
      className={cn(
        'mt-2 flex items-center gap-[6px] text-xs font-extrabold',
        CITATION_CLASS[kind],
      )}
    >
      <KoboyoIcon name={CITATION_ICON[kind]} size={13} />
      {CITATION_COPY[kind](ref, age)}
    </p>
  );
}

/* ---------- The cook's turn ---------- */

export interface ChatUserProps {
  readonly text: string;
  readonly status?: 'sent' | 'sending' | 'failed';
  readonly onRetry?: () => void;
}

/** Sky ground, right-aligned, blade pointing home. */
function ChatUser({ text, status = 'sent', onRetry }: ChatUserProps) {
  return (
    <li className="flex flex-col items-end">
      <div
        className={cn(
          'max-w-[85%] px-4 py-3 text-ctrl font-semibold',
          // Mirrored blade — the sharp corners point back at the sender.
          'rounded-[6px_20px_6px_20px] bg-sky text-sky-onbase',
          status === 'sending' && 'opacity-70',
          status === 'failed' && 'bg-critical-soft text-critical-onsoft',
        )}
      >
        {/* A failed message KEEPS its text — retyping is the worst outcome. */}
        {text}
      </div>

      <Show when={status === 'failed'}>
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 text-xs font-extrabold text-critical-onsoft underline decoration-2 underline-offset-2"
        >
          Not sent — tap to retry
        </button>
      </Show>
    </li>
  );
}

/* ---------- The chef's turn ---------- */

/**
 * Waiting on the first token.
 *
 * **Distinct from `Chat.Thinking`.** Thinking is a short wait before anything
 * has been decided; this is the answer's own bubble, already placed, filling
 * in. Reusing one for the other makes a long answer look like a stall.
 */
function ChatAiSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2 py-2">
      <span className="block h-[13px] w-[88%] animate-shimmer rounded-[3px] bg-skeleton" />
      <span className="block h-[13px] w-[76%] animate-shimmer rounded-[3px] bg-skeleton" />
      <span className="block h-[13px] w-[54%] animate-shimmer rounded-[3px] bg-skeleton" />
    </div>
  );
}

/** The source line, before the citation resolves. Holds the answer's footer. */
function ChatCitationSkeleton() {
  return (
    <span
      aria-hidden="true"
      className="mt-2 block h-[12px] w-40 animate-shimmer rounded-[3px] bg-skeleton"
    />
  );
}

export interface ChatAiProps {
  readonly body: ReactNode;
  /** REQUIRED — an uncited answer cannot render. */
  readonly source: ChatCitationProps;
  /** A meal card or stock readout, inline. */
  readonly attachment?: ReactNode;
  /** Follow-up chips. */
  readonly actions?: readonly { readonly label: string; readonly onClick: () => void }[];
  /**
   * Mid-answer — tokens are still arriving.
   *
   * The citation and the follow-up chips are HELD BACK until the answer
   * finishes: a source rendered beside half an answer claims to support a
   * sentence that has not been written yet.
   */
  readonly streaming?: boolean;
}

function ChatAi({ body, source, attachment, actions, streaming = false }: ChatAiProps) {
  return (
    <li className="flex flex-col items-start">
      <div className="max-w-[85%] rounded-[20px_6px_20px_6px] border border-line-2 bg-white px-4 py-3">
        <div className="text-ctrl text-ink">
          {body}
          {/* The caret marks an answer still arriving, so a paused stream does
              not read as a finished, oddly short answer. */}
          <Show when={streaming}>
            <span
              aria-hidden="true"
              className="ml-[2px] inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-ink"
            />
          </Show>
        </div>

        <Show when={attachment !== undefined && !streaming}>
          <div className="mt-3">{attachment}</div>
        </Show>

        {/* The required slot — held back until the answer is whole. */}
        <Show when={!streaming}>
          <ChatCitation {...source} />
        </Show>
      </div>

      <Show when={!streaming && actions !== undefined && actions.length > 0}>
        <ul className="mt-2 flex flex-wrap gap-2">
          <Repeat each={[...(actions ?? [])]}>
            {(action: { label: string; onClick: () => void }) => (
              <li key={action.label}>
                <button
                  type="button"
                  onClick={action.onClick}
                  className="rounded-pill border border-line-2 bg-white px-3 py-[6px] text-xs font-extrabold text-ink-2 transition-colors hover:border-sky-edge hover:bg-sky-soft hover:text-sky-on"
                >
                  {action.label}
                </button>
              </li>
            )}
          </Repeat>
        </ul>
      </Show>
    </li>
  );
}

/** Waiting on the first token. */
function ChatThinking({ label = 'Thinking' }: { readonly label?: string }) {
  return (
    <li className="flex items-center gap-3">
      <BlobThinking size={36} label={label} />
      <span className="rounded-[20px_6px_20px_6px] border border-line-2 bg-white px-4 py-3 text-ctrl text-ink-3">
        {label}…
      </span>
    </li>
  );
}

/**
 * It genuinely does not know — and says so rather than inventing.
 *
 * "I do not know" is a first-class answer with its own state, not an error.
 */
function ChatUnknown({ onWriteAnyway }: { readonly onWriteAnyway?: () => void }) {
  return (
    <li className="flex flex-col items-start">
      <div className="max-w-[85%] rounded-[20px_6px_20px_6px] border border-line-2 bg-white px-4 py-3">
        <p className="text-ctrl text-ink">
          I do not have a tested recipe for that one, and I would rather not guess at quantities
          for something I have not seen.
        </p>
        <Show when={onWriteAnyway !== undefined}>
          <Button variant="secondary" size="sm" className="mt-3" onClick={onWriteAnyway}>
            Write one anyway, marked as a guess
          </Button>
        </Show>
      </div>
    </li>
  );
}

/** The model failed mid-conversation. */
function ChatError({ onRetry }: { readonly onRetry?: () => void }) {
  return (
    <li className="flex flex-col items-start">
      <div className="max-w-[85%] rounded-[20px_6px_20px_6px] border border-critical-border bg-critical-soft px-4 py-3">
        <p className="flex items-center gap-2 text-ctrl font-extrabold text-critical-onsoft">
          <KoboyoIcon name="error" size={16} />
          That did not come through.
        </p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </li>
  );
}

/* ---------- The composer ---------- */

export interface ChatComposerProps {
  readonly onSend: (text: string) => void;
  /** AI is flagged off. The composer stays visible and says why. */
  readonly disabled?: boolean;
  /**
   * Sending.
   *
   * **The field locks and the text stays.** Clearing the draft on send and
   * restoring it on failure loses whatever the user typed the moment the
   * network hiccups — and this is a composer people type paragraphs into.
   */
  readonly sending?: boolean;
  readonly placeholder?: string;
  /** Starter prompts, shown only on an empty thread. */
  readonly suggestions?: readonly string[];
}

function ChatComposer({
  onSend,
  disabled = false,
  sending = false,
  placeholder = 'Ask about a meal, or what you have',
  suggestions,
}: ChatComposerProps) {
  const [draft, setDraft] = useState('');
  const locked = disabled || sending;

  function send() {
    const text = draft.trim();
    if (text === '' || sending) return;
    onSend(text);
    // Cleared only once the send is handed off. A `sending` composer keeps its
    // text until the caller flips the flag back.
    if (!sending) setDraft('');
  }

  return (
    <div className="border-t border-line bg-paper px-4 pb-[max(var(--s-4),env(safe-area-inset-bottom))] pt-3">
      <Show when={suggestions !== undefined && suggestions.length > 0}>
        <ul className="mb-3 flex flex-wrap gap-2">
          <Repeat each={[...(suggestions ?? [])]}>
            {(suggestion: string) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => onSend(suggestion)}
                  className="rounded-pill border border-line-2 bg-white px-3 py-[6px] text-xs font-extrabold text-ink-2 transition-colors hover:border-sky-edge hover:bg-sky-soft hover:text-sky-on"
                >
                  {suggestion}
                </button>
              </li>
            )}
          </Repeat>
        </ul>
      </Show>

      <div className="flex items-end gap-2">
        <textarea
          rows={1}
          value={draft}
          disabled={locked}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          className="max-h-[120px] min-h-ctrl flex-1 resize-none rounded-blade border-bold border-ink bg-white px-4 py-3 text-ctrl font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink-4 focus:shadow-[0_0_0_4px_var(--sky-glow)] disabled:opacity-[0.42]"
        />
        <Button
          size="md"
          icon="send"
          loading={sending}
          disabled={locked || draft.trim() === ''}
          onClick={send}
          className="shrink-0"
        >
          Ask
        </Button>
      </div>
    </div>
  );
}

/**
 * The standing disclaimer, shown once at the top of a thread.
 *
 * Not a per-message tag — repeating it on every answer trains the eye to skip
 * it, which is the opposite of what a disclaimer is for.
 */
function ChatDisclaimer() {
  return (
    <li className="mx-auto max-w-[85%] rounded-blade-xs border border-grape-border bg-grape-soft px-3 py-2 text-center text-xs text-grape-onsoft">
      The chef answers from your kitchen and from tested recipes. Every answer says where it came
      from.
    </li>
  );
}

/** The scrolling thread. */
function ChatThread({ children }: { readonly children: ReactNode }) {
  return (
    <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">{children}</ul>
  );
}

export const Chat = {
  Thread: ChatThread,
  User: ChatUser,
  AI: ChatAi,
  AiSkeleton: ChatAiSkeleton,
  CitationSkeleton: ChatCitationSkeleton,
  Thinking: ChatThinking,
  Unknown: ChatUnknown,
  Error: ChatError,
  Citation: ChatCitation,
  Composer: ChatComposer,
  Disclaimer: ChatDisclaimer,
};
