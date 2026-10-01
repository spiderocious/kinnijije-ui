import { useState } from 'react';
import { Undo2 } from 'lucide-react';

import { Button } from '@ui/primitives';

import { ASK_COPY } from '../../content/ask.content';

/**
 * "Go back to this answer?"
 *
 * Asked because reverting DESTROYS everything said after that point — the
 * answers and the thread below it. That is the right behaviour (a transcript
 * holding a superseded answer above a corrected one makes somebody work out
 * which counts) but it is not guessable from an undo arrow, so the first one
 * is confirmed.
 *
 * The "don't ask again" box is the whole point of asking at all: a confirm
 * that cannot be switched off becomes a thing people click through without
 * reading, which is worse than never having asked.
 */
interface RevertConfirmProps {
  /** What they would be going back to, so the dialog is concrete. */
  readonly answer: string;
  readonly onConfirm: (dontAskAgain: boolean) => void;
  readonly onCancel: () => void;
}

export function RevertConfirm({ answer, onConfirm, onCancel }: RevertConfirmProps) {
  const [dontAsk, setDontAsk] = useState(false);
  const copy = ASK_COPY.revert;

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-scrim p-5"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="kj-bubble-in w-full max-w-[340px] rounded-blade-lg border-2 border-ink bg-white p-5 shadow-modal">
        <span className="mb-3 grid h-10 w-10 place-items-center rounded-blade-xs border-2 border-ink bg-caution text-white">
          <Undo2 size={18} strokeWidth={2.6} />
        </span>

        <h2 className="m-0 font-display text-[17px] font-extrabold text-ink">{copy.title}</h2>
        <p className="m-0 mt-1 text-[13px] leading-snug text-ink-2">{copy.body}</p>

        <p className="m-0 mt-2.5 truncate rounded-blade-xs bg-paper-2 px-2.5 py-1.5 text-[12.5px] font-bold text-ink">
          {answer}
        </p>

        <label className="mt-3.5 flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-2">
          <input
            type="checkbox"
            checked={dontAsk}
            onChange={(event) => { setDontAsk(event.target.checked); }}
            className="h-4 w-4 shrink-0 accent-sky"
          />
          {copy.dontAsk}
        </label>

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            {copy.cancel}
          </Button>
          <Button onClick={() => { onConfirm(dontAsk); }} className="flex-1">
            {copy.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
