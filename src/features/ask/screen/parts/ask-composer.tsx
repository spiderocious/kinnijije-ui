import { useRef, useState, type FormEvent } from 'react';
import { Mic, Play, Send, Square, Trash2 } from 'lucide-react';

import { cn } from '@shared/utils/cn';

import { ASK_COPY } from '../../content/ask.content';

/**
 * Typing and speaking.
 *
 * VISUALLY SECONDARY, deliberately. The tiles above are the fast path and a
 * prominent composer is an invitation to take the slow one — so this is
 * smaller, quieter, and the placeholder reads "Or just tell me" with the "or"
 * doing real work.
 *
 * It is never the only way to answer. A step where the sole input is a sentence
 * would have made the product slower, which is the whole trap this flow has to
 * avoid.
 */
interface AskComposerProps {
  readonly disabled?: boolean;
  /** Overrides the default, so the same box can ask a different question. */
  readonly placeholder?: string;
  readonly textOn: boolean;
  readonly voiceOn: boolean;
  /** The finished recording, waiting to be sent or discarded. */
  readonly recording: { blob: Blob; durationMs: number } | null;
  readonly onSendText: (text: string) => void;
  readonly onSendVoice: () => void;
  readonly onStartRecording: () => void;
  readonly onDiscardRecording: () => void;
}

const mmss = (ms: number): string => `0:${String(Math.floor(ms / 1000)).padStart(2, '0')}`;

export function AskComposer({
  disabled = false,
  placeholder,
  textOn,
  voiceOn,
  recording,
  onSendText,
  onSendVoice,
  onStartRecording,
  onDiscardRecording,
}: AskComposerProps) {
  const [value, setValue] = useState('');
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Both switched off and the composer has nothing to offer — it is removed
  // rather than shown empty.
  if (!textOn && !voiceOn) return null;

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const text = value.trim();
    if (text.length === 0 || disabled) return;
    onSendText(text);
    setValue('');
  };

  /** A recording waiting to be sent replaces the text field entirely. */
  if (recording !== null) {
    return (
      <div className="kj-bubble-in mt-2 flex items-center gap-2 rounded-blade-xs border-2 border-ink bg-white px-2.5 py-2 shadow-drop-sm">
        <button
          type="button"
          onClick={() => {
            if (audioRef.current === null) {
              audioRef.current = new Audio(URL.createObjectURL(recording.blob));
              audioRef.current.onended = () => { setPlaying(false); };
            }
            if (playing) {
              audioRef.current.pause();
              setPlaying(false);
            } else {
              void audioRef.current.play();
              setPlaying(true);
            }
          }}
          aria-label={ASK_COPY.voice.play}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-round bg-sky text-white"
        >
          {playing ? <Square size={11} strokeWidth={3} /> : <Play size={12} strokeWidth={3} />}
        </button>

        {/* A static waveform: it represents a finished recording, so animating
            it would imply something is still happening. */}
        <span className="flex flex-1 items-center gap-[2px]" aria-hidden="true">
          {Array.from({ length: 22 }, (_, i) => (
            <i
              key={i}
              className="block w-[2.5px] rounded-pill bg-sky-400"
              style={{ height: `${String(6 + ((i * 7) % 16))}px` }}
            />
          ))}
        </span>

        <span className="shrink-0 font-mono text-[11px] text-ink-3 tnum">
          {mmss(recording.durationMs)}
        </span>

        <button
          type="button"
          onClick={() => {
            audioRef.current?.pause();
            audioRef.current = null;
            setPlaying(false);
            onDiscardRecording();
          }}
          aria-label={ASK_COPY.voice.delete}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-round text-ink-4 hover:bg-critical-soft hover:text-critical-onsoft"
        >
          <Trash2 size={13} strokeWidth={2.4} />
        </button>

        <button
          type="button"
          onClick={onSendVoice}
          disabled={disabled}
          aria-label={ASK_COPY.composer.send}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-blade-xs border-2 border-ink bg-sky text-white shadow-drop-sm transition-transform duration-fast active:scale-95 disabled:opacity-50"
        >
          <Send size={14} strokeWidth={2.6} />
        </button>
      </div>
    );
  }

  /**
   * Spec: docs/v2/decide-chat.html — one filled field on `paper-2` with the
   * controls INSIDE it, not a white input with buttons bolted beside it.
   *
   * The filled treatment is what makes the composer read as secondary to the
   * tiles above: a white bordered field competes with them for attention, and
   * typing is meant to be the alternative, not the invitation.
   */
  return (
    <form
      onSubmit={submit}
      className={cn(
        'flex items-center gap-2 rounded-blade-xs border-hair border-line-2 bg-paper-2 px-2.5 py-2',
        'transition-colors duration-fast focus-within:border-ink',
      )}
    >
      {textOn ? (
        <input
          value={value}
          onChange={(event) => { setValue(event.target.value); }}
          placeholder={placeholder ?? ASK_COPY.composer.placeholder}
          disabled={disabled}
          className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-4 disabled:opacity-50"
        />
      ) : (
        <span className="flex-1 text-[13px] text-ink-4">{ASK_COPY.composer.voiceOnly}</span>
      )}

      {voiceOn && (
        <button
          type="button"
          onClick={onStartRecording}
          disabled={disabled}
          aria-label={ASK_COPY.composer.micLabel}
          className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-blade-xs border-hair border-line-2 bg-white text-ink-3 transition-colors duration-fast hover:border-ink hover:text-ink disabled:opacity-50"
        >
          <Mic size={14} strokeWidth={2.4} />
        </button>
      )}

      {textOn && (
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          aria-label={ASK_COPY.composer.send}
          className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-blade-xs border-hair border-ink bg-sky text-white transition-transform duration-fast active:scale-95 disabled:opacity-40"
        >
          <Send size={14} strokeWidth={2.6} />
        </button>
      )}
    </form>
  );
}
