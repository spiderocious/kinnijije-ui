import { Mic } from 'lucide-react';

import { Button } from '@ui/primitives';

import { ASK_COPY } from '../../content/ask.content';
import { MAX_RECORDING_MS } from '../../hooks/use-recorder';

/**
 * Listening.
 *
 * Blocks everything on purpose. Somebody talking to their phone needs to know
 * without question that it is recording and when it will stop — a floating
 * indicator over a live screen leaves both in doubt.
 *
 * The bars are REAL amplitude from an AnalyserNode. A wave that moves while the
 * room is silent is a lie the person can hear, and it destroys the only thing
 * this screen has to say.
 */
interface RecordingModalProps {
  readonly levels: number[];
  readonly elapsedMs: number;
  readonly onDone: () => void;
}

const mmss = (ms: number): string => {
  const total = Math.floor(ms / 1000);
  return `0:${String(total).padStart(2, '0')}`;
};

export function RecordingModal({ levels, elapsedMs, onDone }: RecordingModalProps) {
  // Warn before it cuts out, rather than surprising somebody mid-sentence.
  const nearLimit = elapsedMs > MAX_RECORDING_MS - 5_000;

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-scrim p-5"
      role="dialog"
      aria-modal="true"
      aria-label={ASK_COPY.voice.listening}
    >
      <div className="w-full max-w-[340px] rounded-blade-lg border-2 border-ink bg-white p-5 text-center shadow-modal">
        <span className="relative mx-auto mb-3 grid h-12 w-12 place-items-center rounded-round border-2 border-ink bg-sky text-white">
          <Mic size={20} strokeWidth={2.6} />
          {/* Outward pulse: an inward one would read as loading. */}
          <span className="kj-mic-ring absolute inset-0 rounded-round border-2 border-sky" />
        </span>

        <h2 className="m-0 font-display text-[18px] font-extrabold text-ink">
          {ASK_COPY.voice.listening}
        </h2>

        <div className="my-4 flex h-10 items-center justify-center gap-[3px]" aria-hidden="true">
          {levels.map((level, i) => (
            <i
              key={i}
              className="block w-[3.5px] rounded-pill bg-sky transition-[height] duration-75 ease-out"
              // A floor of 3px so a silent room shows a flat line rather than
              // nothing — nothing reads as broken, flat reads as quiet.
              style={{ height: `${String(Math.max(3, level * 38))}px` }}
            />
          ))}
        </div>

        <p
          className={[
            'm-0 mb-4 font-mono text-[12px] font-semibold tnum',
            nearLimit ? 'text-caution-onsoft' : 'text-ink-3',
          ].join(' ')}
        >
          {mmss(elapsedMs)} / {mmss(MAX_RECORDING_MS)}
        </p>

        <Button fullWidth size="lg" onClick={onDone}>
          {ASK_COPY.voice.done}
        </Button>
      </div>
    </div>
  );
}
