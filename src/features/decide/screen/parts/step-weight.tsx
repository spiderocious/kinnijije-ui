import { DECIDE_COPY } from '../../content/decide.content';
import { WEIGHT_ART } from '../../content/decide.illustrations';
import type { DecideOptions, Weight } from '../../types/decide.types';
import { DecideShell } from './decide-shell';
import { DecideTile } from './decide-tile';
import { StepNav } from './step-nav';

interface StepWeightProps {
  readonly options: DecideOptions | undefined;
  readonly value: Weight | null;
  readonly onChange: (weight: Weight) => void;
  readonly onContinue: () => void;
  readonly onBack: () => void;
}

export function StepWeight({ options, value, onChange, onContinue, onBack }: StepWeightProps) {
  const tiles = options?.weights ?? [];
  const captions = options?.captions.weights ?? {};

  return (
    <DecideShell
      step={3}
      total={4}
      eyebrow={DECIDE_COPY.weight.step}
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
