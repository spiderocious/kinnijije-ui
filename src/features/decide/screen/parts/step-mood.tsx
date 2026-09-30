import { Check } from 'lucide-react';

import { Button } from '@ui/primitives';

import { DECIDE_COPY } from '../../content/decide.content';
import { MOOD_ART } from '../../content/decide.illustrations';
import type { DecideOptions, Mood } from '../../types/decide.types';
import { DecideShell } from './decide-shell';
import { DecideTile } from './decide-tile';
import { StepNav } from './step-nav';

interface StepMoodProps {
  /**
   * The kitchen we filled in for them, when they are signed in.
   *
   * Stated rather than silent: an answer built from data they cannot see is
   * one they cannot correct, and they would rightly wonder what it used.
   */
  readonly usingKitchen?: { items: string[]; onChange: () => void } | undefined;
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
  readonly value: Mood | null;
  readonly onChange: (mood: Mood) => void;
  readonly onContinue: () => void;
  readonly onBack: () => void;
}

export function StepMood({
  step,
  total,
  options,
  value,
  onChange,
  onContinue,
  onBack,
  usingKitchen,
}: StepMoodProps) {
  const tiles = options?.moods ?? [];
  const captions = options?.captions.moods ?? {};

  return (
    <DecideShell
      step={step}
      total={total}
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
      {usingKitchen !== undefined && (
        <div className="flex items-center gap-2.5 rounded-blade-xs border-hair border-success-border bg-success-soft px-3 py-2.5">
          <Check size={16} strokeWidth={2.8} className="shrink-0 text-success-onsoft" />
          <span className="min-w-0 flex-1 text-[11.5px] text-success-onsoft">
            <b className="block font-extrabold">{DECIDE_COPY.usingKitchen.title}</b>
            <span className="block truncate text-ink-3">
              {DECIDE_COPY.usingKitchen.detail(
                usingKitchen.items.length,
                usingKitchen.items.slice(0, 3),
              )}
            </span>
          </span>
          <Button variant="tertiary" size="sm" onClick={usingKitchen.onChange}>
            {DECIDE_COPY.usingKitchen.change}
          </Button>
        </div>
      )}

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
