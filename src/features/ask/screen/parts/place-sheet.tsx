import { PlacePicker } from '@features/chowdeck/parts/place-picker';
import type { DecidePlace } from '@features/decide/types/decide.types';
import { Button } from '@ui/primitives';

import { ASK_COPY } from '../../content/ask.content';
import { AskSheet } from './ask-sheet';

/**
 * Picking an area, in the same sheet the ingredients use.
 *
 * It rises rather than sitting in the dock because the picker is a search over
 * 174 areas grouped by state — typing into a 200px box with the list scrolling
 * behind the keyboard is the thing that made the ingredient panel need this
 * treatment, and the same reasoning applies here.
 */
interface PlaceSheetProps {
  readonly value: DecidePlace | null;
  readonly onChange: (place: DecidePlace | null) => void;
  readonly onClose: () => void;
  readonly onSkip: () => void;
}

export function PlaceSheet({ value, onChange, onClose, onSkip }: PlaceSheetProps) {
  const copy = ASK_COPY.questions.place;

  return (
    <AskSheet
      label={copy.ask}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onSkip} className="flex-1">
            {copy.skip}
          </Button>
          <Button
            fullWidth
            size="lg"
            disabled={value === null}
            onClick={onClose}
            className="flex-[2]"
          >
            {value === null ? copy.pick : copy.confirm}
          </Button>
        </div>
      }
    >
      <div className="px-4 pb-2">
        <h2 className="m-0 font-display text-[17px] font-extrabold text-ink">{copy.ask}</h2>
        <p className="m-0 mt-0.5 text-[12.5px] text-ink-2">{copy.hint}</p>
      </div>

      {/* The picker owns its own search and grouping; the sheet only gives it
          room and a way out. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <PlacePicker value={value} onChange={onChange} />
      </div>
    </AskSheet>
  );
}
