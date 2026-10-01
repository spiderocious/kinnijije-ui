import { AlertTriangle, Clock, Mic, Undo2, X } from 'lucide-react';

import { cn } from '@shared/utils/cn';

import { ASK_COPY } from '../../content/ask.content';
import type { AskMessage } from '../../types/ask.types';

/**
 * One line in the transcript.
 *
 * THE BLADE HOLDS. Bubbles get blade radii, never pills — that single detail is
 * what keeps this looking like KinniJije rather than like every other chat UI
 * ever shipped. A pill-shaped bubble with a grey background would throw away
 * the whole visual identity for the sake of looking familiar.
 *
 * A cook's own message is tappable when it belongs to a step: tapping reopens
 * that question, which is the affordance the wizard structurally cannot have.
 */
interface AskBubbleProps {
  readonly message: AskMessage;
  /** Position, which sets the arrival delay so a pair reads as a thought. */
  readonly index?: number;
  readonly onRevisit?: ((step: NonNullable<AskMessage['step']>) => void) | undefined;
  readonly onDismissNote?: ((note: string) => void) | undefined;
  readonly onRetry?: (() => void) | undefined;
}

export function AskBubble({
  message,
  index = 0,
  onRevisit,
  onDismissNote,
  onRetry,
}: AskBubbleProps) {
  if (message.role === 'system') {
    return (
      <p className="kj-bubble-in m-0 self-center font-mono text-[10.5px] font-semibold text-ink-4">
        {message.text}
      </p>
    );
  }

  const isCook = message.role === 'cook';
  const canRevisit = isCook && message.step !== undefined && onRevisit !== undefined;

  return (
    <div
      className={cn(
        // 84% per the spec, not 86%.
        'kj-bubble-in flex max-w-[84%] flex-col gap-1.5',
        isCook && 'items-end self-end',
      )}
      // 90ms apart: simultaneous arrival reads as a dump, a short delay reads
      // as somebody thinking before they answer.
      style={{ animationDelay: `${String(Math.min(index, 3) * 90)}ms` }}
    >
      <div
        className={cn(
          // Spec: docs/v2/decide-chat.html — 11px/13px padding, 13.5px text,
          // 1.5 line-height, and a drop shadow on BOTH sides. The earlier
          // values here were all a notch tight, which read as cramped.
          'relative border-2 border-ink px-[13px] py-[11px] text-[13.5px] leading-[1.5] shadow-drop-sm',
          // The blade, mirrored per side so each bubble points at its speaker.
          isCook
            ? 'rounded-[5px_16px_5px_16px] bg-sky font-bold text-white'
            : 'rounded-blade-sm bg-white text-ink-2',
          message.failed === true && 'border-critical bg-critical-soft text-critical-onsoft',
          // Clearance for the undo icon tucked into the corner.
          canRevisit && 'pb-4',
        )}
      >
        {canRevisit && (
          <button
            type="button"
            onClick={() => { onRevisit(message.step as NonNullable<AskMessage['step']>); }}
            aria-label={ASK_COPY.revert.label}
            title={ASK_COPY.revert.label}
            className={cn(
              'absolute -bottom-0 right-0 text-white/60',
              'transition-[color,transform] duration-fast hover:scale-110 hover:text-white active:scale-95',
            )}
          >
            <Undo2 size={14} strokeWidth={2.6} />
          </button>
        )}
        {message.source === 'voice' && (
          <Mic size={11} strokeWidth={2.8} className="mr-1 inline-block align-[-1px] opacity-70" />
        )}
        {message.text}

        {/* A clock rather than a spinner: the message IS sent, it is the answer
            that is still coming. A spinner would imply the send failed. */}
        {message.pending === true && (
          <Clock size={11} strokeWidth={2.6} className="ml-1.5 inline-block align-[-1px] opacity-70" />
        )}

      </div>

      {/* Constraints that are not answers. The reason speaking beats tapping. */}
      {message.notes !== undefined && message.notes.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-grape-onsoft">
            {ASK_COPY.turn.alsoNoted}
          </span>
          {message.notes.map((note) => (
            <span
              key={note}
              className="inline-flex items-center gap-1 rounded-pill border-hair border-grape-border bg-grape-soft px-2 py-0.5 text-[11px] font-bold text-grape-onsoft"
            >
              {note}
              {onDismissNote !== undefined && (
                <button
                  type="button"
                  onClick={() => { onDismissNote(note); }}
                  aria-label={`Remove ${note}`}
                  className="opacity-60 hover:opacity-100"
                >
                  <X size={9} strokeWidth={3} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* A failed message is never removed — a bubble that vanishes reads as
          data loss. It stays, marked, with a way forward. */}
      {message.failed === true && onRetry !== undefined && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 text-[11.5px] font-extrabold text-critical-onsoft underline underline-offset-2"
        >
          <AlertTriangle size={11} strokeWidth={2.8} />
          {ASK_COPY.turn.retry}
        </button>
      )}
    </div>
  );
}

/** The pot, thinking. Only ever rendered while a request is genuinely in flight. */
export function AskTyping() {
  return (
    <div className="kj-bubble-in flex items-center gap-1.5 self-start rounded-blade-sm border-2 border-ink bg-white px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="kj-dot block h-1.5 w-1.5 rounded-round bg-ink-3"
          style={{ animationDelay: `${String(i * 160)}ms` }}
        />
      ))}
    </div>
  );
}
