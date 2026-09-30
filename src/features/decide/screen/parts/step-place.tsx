import { PlacePicker } from '@features/chowdeck/parts/place-picker';

import { DECIDE_COPY } from '../../content/decide.content';
import type { DecidePlace } from '../../types/decide.types';
import { DecideShell } from './decide-shell';
import { StepNav } from './step-nav';

/**
 * Order mode's last question, standing where "how long have you got" stands
 * for a cook.
 *
 * Required, unlike the cook's optional city: without a place there is
 * nowhere to look for restaurants, and a verdict that ends in "we don't know
 * where you are" is worse than asking now.
 */
interface StepPlaceProps {
  readonly step: number;
  readonly total: number;
  readonly place: DecidePlace | null;
  readonly onPlace: (place: DecidePlace | null) => void;
  readonly onDecide: () => void;
  readonly onBack: () => void;
  readonly busy: boolean;
}

export function StepPlace({ step, total, place, onPlace, onDecide, onBack, busy }: StepPlaceProps) {
  return (
    <DecideShell
      step={step}
      total={total}
      title={DECIDE_COPY.place.title}
      sub={DECIDE_COPY.place.sub}
      footer={
        <StepNav
          onBack={onBack}
          onContinue={onDecide}
          continueLabel={place === null ? DECIDE_COPY.place.ctaNeedsPlace : DECIDE_COPY.place.cta}
          continueDisabled={place === null}
          loading={busy}
        />
      }
    >
      <PlacePicker value={place} onChange={onPlace} />
    </DecideShell>
  );
}
