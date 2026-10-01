import { Search } from 'lucide-react';

import { MOOD_ART, WEIGHT_ART } from '@features/decide/content/decide.illustrations';
import type { DecideOptions, DecidePlace } from '@features/decide/types/decide.types';

import { ASK_COPY } from '../../content/ask.content';
import type { AskQuestionStep } from '../../types/ask.types';
import { AskTile } from './ask-tile';

/**
 * The answer surface.
 *
 * Its OWN components, not the tap flow's. Those wrap themselves in a full-height
 * shell with their own header, progress rail and footer — forcing one into a
 * dock would have produced a compromise that served neither surface. Rebuilding
 * costs four small files and buys total isolation: nothing under
 * `features/decide/screen/` is imported here.
 *
 * Height is FIXED per stage and never animates except on a deliberate panel
 * expand. A dock that resizes as the keyboard opens is the classic mobile chat
 * bug — the thread jumps and the person loses their place.
 */
interface AskDockProps {
  readonly step: AskQuestionStep;
  readonly options: DecideOptions | undefined;
  readonly kitchen: string[];
  readonly onOpenPanel: () => void;
  readonly onKitchenToggle: (label: string) => void;
  readonly onNothing: () => void;
  readonly onAnswer: (step: AskQuestionStep, value: string | number) => void;
  /** The area they are in, for Chowdeck offers. */
  readonly place: DecidePlace | null;
  readonly onOpenPlaces: () => void;
  readonly onSkipPlace: () => void;
  readonly busy?: boolean;
}

/** The six most-tapped items, so the common case needs no panel at all. */
const QUICK_PICKS = 6;

export function AskDock({
  step,
  options,
  kitchen,
  onOpenPanel,
  onKitchenToggle,
  onNothing,
  onAnswer,
  place,
  onOpenPlaces,
  onSkipPlace,
  busy = false,
}: AskDockProps) {
  if (step === 'kitchen') {
    const popular = options?.kitchen[0]?.items.slice(0, QUICK_PICKS) ?? [];
    const copy = ASK_COPY.questions.kitchen;

    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onOpenPanel}
          className="flex min-h-[38px] items-center gap-2 rounded-blade-xs border-2 border-line-2 bg-white px-3 text-left text-[13px] text-ink-4 transition-colors duration-fast hover:border-ink-4"
        >
          <Search size={15} strokeWidth={2.4} className="shrink-0" />
          {options === undefined
            ? copy.search
            : `Search ${String(options.total_items)} ingredients`}
        </button>

        <div className="grid grid-cols-3 gap-2">
          {popular.map((item, i) => (
            <AskTile
              key={item.id}
              index={i}
              label={item.label}
              icon={item.icon}
              selected={kitchen.includes(item.label)}
              onToggle={() => { onKitchenToggle(item.label); }}
            />
          ))}
        </div>

        {/* "Nothing" belongs in a conversation even though it was cut from the
            tap flow: a conversation that cannot accept "nothing" is a bad one. */}
        <button
          type="button"
          onClick={onNothing}
          disabled={busy}
          className="rounded-blade-xs border-2 border-line-2 bg-white py-2 text-[12px] font-extrabold text-ink-2 transition-colors duration-fast hover:border-ink disabled:opacity-50"
        >
          {copy.nothing}
        </button>
      </div>
    );
  }

  if (step === 'mood') {
    const tiles = options?.moods ?? [];
    const captions = options?.captions.moods ?? {};
    return (
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((tile, i) => (
          <AskTile
            key={tile.id}
            big
            index={i}
            label={tile.label}
            caption={captions[tile.id]}
            icon={tile.icon}
            art={MOOD_ART[tile.id]}
            onToggle={() => { onAnswer('mood', tile.id); }}
          />
        ))}
      </div>
    );
  }

  if (step === 'weight') {
    const tiles = options?.weights ?? [];
    const captions = options?.captions.weights ?? {};
    return (
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((tile, i) => (
          <AskTile
            key={tile.id}
            index={i}
            label={tile.label}
            caption={captions[tile.id]}
            icon={tile.icon}
            art={WEIGHT_ART[tile.id]}
            onToggle={() => { onAnswer('weight', tile.id); }}
          />
        ))}
      </div>
    );
  }

  if (step === 'place') {
    /**
     * The one step with a real control rather than tiles.
     *
     * `PlacePicker` is the tap flow's own component, mounted whole — 174 areas
     * grouped by state with a search is not something worth building twice, and
     * two pickers would drift.
     */
    return (
      <div className="flex flex-col gap-2">
        {/*
          Opens the sheet rather than embedding the picker.

          A search over 174 areas inside a 220px box puts the list behind the
          keyboard the moment somebody types — the exact problem the ingredient
          panel rises to solve, so it gets the same treatment.
        */}
        <button
          type="button"
          onClick={onOpenPlaces}
          className="flex min-h-[38px] items-center gap-2 rounded-blade-xs border-2 border-line-2 bg-white px-3 text-left text-[13px] text-ink-4 transition-colors duration-fast hover:border-ink-4"
        >
          <Search size={15} strokeWidth={2.4} className="shrink-0" />
          {place?.name ?? ASK_COPY.questions.place.open}
        </button>
        {/* Skippable, because somebody who only ever cooks should not be stuck
            behind a question about delivery. */}
        <button
          type="button"
          onClick={onSkipPlace}
          disabled={busy}
          className="rounded-blade-xs border-2 border-line-2 bg-white py-2 text-[12px] font-extrabold text-ink-2 transition-colors duration-fast hover:border-ink disabled:opacity-50"
        >
          {ASK_COPY.questions.place.skip}
        </button>
      </div>
    );
  }

  // time
  const minutes = options?.minutes ?? [];
  return (
    <div className="grid grid-cols-3 gap-2">
      {minutes.map((option, i) => (
        <AskTile
          key={option.value}
          index={i}
          label={option.label}
          icon="alarmClock"
          onToggle={() => { onAnswer('time', option.value); }}
        />
      ))}
    </div>
  );
}
