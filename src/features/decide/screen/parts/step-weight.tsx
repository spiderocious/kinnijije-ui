import { DECIDE_COPY } from '../../content/decide.content';
import { WEIGHT_ART } from '../../content/decide.illustrations';
import type { DecideOptions, Weight } from '../../types/decide.types';
import { DecideShell } from './decide-shell';
import { DecideTile } from './decide-tile';
import { StepNav } from './step-nav';

interface StepWeightProps {
  /**
   * Position in the flow, passed in rather than hardcoded.
   *
   * A signed-in cook skips the kitchen step, so this is 1-of-3 for them and
   * 2-of-4 for a guest. A hardcoded number would tell one of them the wrong
   * thing about how much is left.
   */
  readonly step: number;
  readonly total: number;
  readonly options: DecideOptions | undefined;
  readonly value: Weight | null;
  readonly onChange: (weight: Weight) => void;
  readonly onContinue: () => void;
  readonly onBack: () => void;
}

export function StepWeight({ step, total, options, value, onChange, onContinue, onBack }: StepWeightProps) {
  const tiles = options?.weights ?? [];
  const captions = options?.captions.weights ?? {};

  return (
    <DecideShell
      step={step}
      total={total}
      title={DECIDE_COPY.weight.title}
      sub={DECIDE_COPY.weight.sub}
      footer={
        <StepNav
          onBack={onBack}
          onContinue={onContinue}
          continueLabel={DECIDE_COPY.weight.continue}
          continueDisabled={value === null}
        />
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((tile) => (
          <DecideTile
            key={tile.id}
            wide
            label={tile.label}
            caption={captions[tile.id]}
            icon={tile.icon}
            art={WEIGHT_ART[tile.id]}
            selected={value === tile.id}
            onToggle={() => { onChange(tile.id as Weight); }}
          />
        ))}
      </div>
    </DecideShell>
  );
}
