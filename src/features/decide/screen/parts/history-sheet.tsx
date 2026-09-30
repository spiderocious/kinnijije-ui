import { Clock, Shuffle, Trash2, X } from 'lucide-react';

import { Button } from '@ui/primitives';

import { DECIDE_COPY } from '../../content/decide.content';
import { useDecideHistory, useRemoveHistoryEntry } from '../../hooks/use-decide-history';
import type { DecideHistoryEntry } from '../../types/decide.types';

/**
 * A cook's past decisions.
 *
 * A bottom sheet, like the invite, for the same reason: it sits where the
 * thumb is and the screen behind stays legible. Unlike the invite it IS
 * dismissible by every route, because nothing here is being asked for.
 *
 * Signed in only. A guest has no history to show, so the icon that opens this
 * is not rendered for them at all rather than opening an empty sheet.
 */
interface HistorySheetProps {
  readonly onClose: () => void;
  /** Replays a past answer set through the flow. */
  readonly onRemix: (entry: DecideHistoryEntry) => void;
}

/** "3 things · rice, beans, oil" — the answers at a glance, never the whole list. */
function summarise(entry: DecideHistoryEntry): string {
  const { kitchen_items: items } = entry.answers;
  if (items.length === 0) return 'Nothing from your kitchen';
  const shown = items.slice(0, 3).join(', ');
  return items.length > 3 ? `${shown} +${String(items.length - 3)} more` : shown;
}

/**
 * "Today", "Yesterday", or a date.
 *
 * Relative for the two days somebody actually remembers, absolute after that.
 * "4 days ago" is harder to place than the date it happened.
 */
function whenFor(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const days = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime()) /
      86_400_000,
  );
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function HistorySheet({ onClose, onRemix }: HistorySheetProps) {
  const { entries, isLoading, isEmpty } = useDecideHistory();
  const remove = useRemoveHistoryEntry();
  const copy = DECIDE_COPY.history;

  return (
    <div
      className="fixed inset-0 z-modal flex items-end justify-center bg-scrim p-3"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[80dvh] w-full max-w-[460px] flex-col rounded-blade-lg border-2 border-ink bg-white shadow-modal">
        <div className="flex shrink-0 items-start gap-2.5 border-b-hair border-line p-4 pb-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-blade-xs border-2 border-ink bg-sky text-white">
            <Clock size={17} strokeWidth={2.6} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[17px] font-extrabold text-ink">{copy.title}</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-2">{copy.sub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-round text-ink-4 hover:bg-paper-2 hover:text-ink"
          >
            <X size={15} strokeWidth={2.6} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          {isLoading && (
            <div aria-hidden="true" className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[72px] animate-shimmer rounded-blade bg-skeleton" />
              ))}
            </div>
          )}

          {isEmpty && (
            <div className="px-4 py-10 text-center">
              <p className="m-0 text-[13.5px] font-extrabold text-ink-2">{copy.empty}</p>
              <p className="mt-1 text-[12px] text-ink-4">{copy.emptyHint}</p>
            </div>
          )}

          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-blade border-hair border-line-2 bg-paper p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate font-display text-[15px] font-extrabold text-ink">
                      {entry.verdict.name ?? copy.nothingMatched}
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-3">
                      {whenFor(entry.created_at)} · {summarise(entry)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { remove.mutate(entry.id); }}
                    aria-label={`${copy.remove}: ${entry.verdict.name ?? copy.nothingMatched}`}
                    disabled={remove.isPending}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-round text-ink-4 hover:bg-critical-soft hover:text-critical-onsoft disabled:opacity-40"
                  >
                    <Trash2 size={14} strokeWidth={2.4} />
                  </button>
                </div>

                {entry.verdict.why !== null && (
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-ink-2">
                    {entry.verdict.why}
                  </p>
                )}

                {/* Remix is the whole point of keeping the answers, so it is
                    the action on the row rather than something behind a menu. */}
                <Button
                  fullWidth
                  variant="secondary"
                  size="sm"
                  className="mt-2.5"
                  onClick={() => { onRemix(entry); }}
                >
                  <Shuffle size={14} strokeWidth={2.6} className="mr-1.5" />
                  {copy.remix}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
