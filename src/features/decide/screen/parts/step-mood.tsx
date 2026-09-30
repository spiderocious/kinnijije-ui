import { DECIDE_COPY } from '../../content/decide.content';
import { MOOD_ART } from '../../content/decide.illustrations';
import type { DecideOptions, Mood } from '../../types/decide.types';
import { DecideShell } from './decide-shell';
import { DecideTile } from './decide-tile';
import { StepNav } from './step-nav';

interface StepMoodProps {
  readonly options: DecideOptions | undefined;
  readonly value: Mood | null;
  readonly onChange: (mood: Mood) => void;
  readonly onContinue: () => void;
  readonly onBack: () => void;
}

export function StepMood({ options, value, onChange, onContinue, onBack }: StepMoodProps) {
  const tiles = options?.moods ?? [];
  const captions = options?.captions.moods ?? {};

  return (
    <DecideShell
      step={2}
      total={4}
      eyebrow={DECIDE_COPY.mood.step}
      title={DECIDE_COPY.mood.title}
      sub={DECIDE_COPY.mood.sub}
      footer={
        <StepNav
          onBack={onBack}
          onContinue={onContinue}
          continueLabel={DECIDE_COPY.mood.continue}
          continueDisabled={value === null}
        />
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <DecideTile
            key={tile.id}
            big
            label={tile.label}
            caption={captions[tile.id]}
            icon={tile.icon}
            art={MOOD_ART[tile.id]}
            selected={value === tile.id}
            onToggle={() => { onChange(tile.id as Mood); }}
          />
        ))}
      </div>
    </DecideShell>
  );
}
