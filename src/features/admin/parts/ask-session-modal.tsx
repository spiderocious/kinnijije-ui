import { useEffect } from 'react';

import { Show } from 'meemaw';

import { X } from '@icons';
import { formatDate } from '@shared/utils/format-date';
import { Tag } from '@ui/status';

import { useAskSessionDetail } from '../hooks/use-admin-ask-sessions';

/**
 * One Ask conversation, turn by turn.
 *
 * THE THING WORTH READING is `rawText` — what somebody actually said, before
 * it was parsed into answers. That is where the product's real vocabulary
 * lives, and where you can see the parse give up.
 *
 * Read-only. A conversation belongs to the person who had it.
 */

const SOURCE_LABEL: Record<string, string> = {
  tap: 'tapped',
  text: 'typed',
  voice: 'spoke',
};

export function AskSessionModal({
  sessionId,
  onClose,
}: {
  readonly sessionId: string;
  readonly onClose: () => void;
}) {
  const { data, isLoading, error } = useAskSessionDetail(sessionId);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center overflow-y-auto bg-scrim p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default"
      />

      <div
        role="dialog"
        aria-label="Conversation"
        className="relative w-full max-w-[720px] rounded-blade border-2 border-ink bg-white shadow-drop"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-extrabold tracking-display text-ink">
              Conversation
            </h2>
            <Show when={data !== undefined}>
              <p className="mt-0.5 font-mono text-xs text-ink-3">
                {data?.id} · {data === undefined ? '' : formatDate(data.createdAt)}
              </p>
            </Show>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-blade-xs text-ink-3 hover:bg-paper-2 hover:text-ink"
          >
            <X size={17} strokeWidth={2.4} />
          </button>
        </div>

        <div className="px-5 py-4">
          <Show when={isLoading}>
            <div className="space-y-3">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  aria-hidden="true"
                  className="h-16 animate-shimmer rounded-blade-xs bg-skeleton"
                />
              ))}
            </div>
          </Show>

          <Show when={error !== null && data === undefined}>
            <p className="py-6 text-center text-sm text-critical-onsoft">
              Could not load that conversation.
            </p>
          </Show>

          <Show when={data !== undefined}>
            {/* ── The turns ───────────────────────────────────────── */}
            <div className="space-y-2.5">
              {data?.conversation.map((turn) => (
                <div
                  key={turn.id}
                  className="rounded-blade-xs border border-line bg-paper px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs uppercase text-ink-4">{turn.step}</span>
                    <Tag size="sm" tone={turn.source === 'voice' ? 'info' : 'neutral'}>
                      {SOURCE_LABEL[turn.source] ?? turn.source}
                    </Tag>
                    <Show when={turn.failedStage !== null}>
                      <span className="text-xs font-extrabold text-critical-onsoft">
                        failed at {turn.failedStage}
                      </span>
                    </Show>
                  </div>

                  {/* What they actually said. The reason to open this at all. */}
                  <Show when={turn.rawText !== null}>
                    <p className="mt-1.5 border-l-2 border-sky pl-2.5 text-sm italic text-ink">
                      &ldquo;{turn.rawText}&rdquo;
                    </p>
                  </Show>

                  <Show when={turn.answers !== null}>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(turn.answers?.kitchenItems ?? []).map((item) => (
                        <span
                          key={item}
                          className="rounded-pill border border-line-2 bg-white px-2 py-0.5 text-xs text-ink-2"
                        >
                          {item}
                        </span>
                      ))}
                      {[
                        turn.answers?.mood,
                        turn.answers?.weight,
                        turn.answers?.minutes === null || turn.answers?.minutes === undefined
                          ? null
                          : `${String(turn.answers.minutes)} min`,
                      ]
                        .filter((value): value is string => value !== null && value !== undefined)
                        .map((value) => (
                          <span
                            key={value}
                            className="rounded-pill border border-sky-border bg-sky-soft px-2 py-0.5 text-xs text-sky-on"
                          >
                            {value}
                          </span>
                        ))}
                    </div>
                  </Show>

                  {/*
                   * Notes are constraints no tile could express — "no pepper",
                   * "cooking for my mother". They are why the voice path exists.
                   */}
                  <Show when={turn.notes.length > 0}>
                    <p className="mt-1.5 text-xs text-caution-onsoft">
                      {turn.notes.join(' · ')}
                    </p>
                  </Show>
                </div>
              ))}
            </div>

            {/* ── What they ended up with ─────────────────────────── */}
            <div className="mt-4 rounded-blade-xs border border-line bg-paper-2 px-3 py-2.5">
              <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
                Verdict
              </p>
              <p className="mt-0.5 text-sm text-ink">
                {data?.verdictMealName ?? (data?.completed === true ? 'Unknown meal' : 'Abandoned')}
              </p>
            </div>

            {/* ── Follow-ups, where they kept talking ─────────────── */}
            <Show when={(data?.followUpDetail.length ?? 0) > 0}>
              <div className="mt-4">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
                  Follow-ups
                </p>
                <div className="space-y-2">
                  {data?.followUpDetail.map((followUp) => (
                    <div
                      key={followUp.id}
                      className="rounded-blade-xs border border-line bg-white px-3 py-2"
                    >
                      <p className="text-sm font-extrabold text-ink">{followUp.question}</p>
                      <p className="mt-0.5 text-sm text-ink-2">{followUp.answer}</p>
                      <Show when={followUp.refused}>
                        <span className="mt-1 inline-block text-xs text-caution-onsoft">
                          refused
                        </span>
                      </Show>
                    </div>
                  ))}
                </div>
              </div>
            </Show>
          </Show>
        </div>
      </div>
    </div>
  );
}
