import { useState } from 'react';

import { Show } from 'meemaw';

import { KoboyoIcon, Search } from '@icons';

import { PlanNote, PlanTag } from './plan-chrome';
import { dishGlyph } from './plan-slot';
import type { SwapOptions } from '../services/timetable.api';

/**
 * Frame 05 — swap a meal.
 *
 * CANDIDATES COME FROM THE MATCHER, ranked against the kitchen as it will be
 * on that day — not as it is today. That is the runway doing work inside the
 * editor, and it is why a dish whose ingredients Monday already used does not
 * appear here claiming "have it all".
 *
 * THE CONSEQUENCE IS STATED BEFORE THE SWAP, with the fix offered. This is the
 * honest version of a destructive action: swapping off the panla means it
 * spoils unused, and the sheet says so and offers to move it rather than
 * letting somebody find out later.
 *
 * REMOVE IS A REAL OPTION. Some days you are not cooking, and a plan that
 * cannot express that gets abandoned.
 */
export function SwapSheet({
  dayLabel,
  slotName,
  currentDish,
  options,
  loading,
  onPick,
  onRemove,
  onSurpriseMe,
  onClose,
}: {
  readonly dayLabel: string;
  readonly slotName: string;
  readonly currentDish: string | null;
  readonly options: SwapOptions | undefined;
  readonly loading: boolean;
  readonly onPick: (mealId: string, mealName: string) => void;
  readonly onRemove: () => void;
  readonly onSurpriseMe: () => void;
  readonly onClose: () => void;
}) {
  const [query, setQuery] = useState('');

  const all = options?.candidates ?? [];
  const spoils = options?.consequence.spoils ?? null;

  /**
   * Filtered IN PLACE rather than re-queried.
   *
   * The candidate list is already ranked against the kitchen as it will be on
   * that day — sending the query to the server would mean re-ranking, and a
   * dish that matched the text but not the kitchen would appear with a score
   * nobody asked for. Narrowing what the matcher already approved keeps the
   * percentages honest.
   */
  const needle = query.trim().toLowerCase();
  const candidates =
    needle.length === 0
      ? all
      : all.filter((candidate) => candidate.name.toLowerCase().includes(needle));

  return (
    <div
      className="fixed inset-0 z-modal flex items-end justify-center bg-scrim"
      onClick={onClose}
      role="presentation"
    >
      <div
        // 520px, matching PlanScreen and AskSheet — a sheet wider than the
        // flow it rises out of reads as a different screen.
        className="max-h-[90%] w-full max-w-[520px] overflow-y-auto rounded-t-blade border-t-bold border-ink bg-white px-3.5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-[15px]"
        onClick={(event) => {
          event.stopPropagation();
        }}
        role="dialog"
        aria-label={`Swap ${slotName}`}
      >
        <div className="mx-auto mb-[13px] h-1 w-10 rounded-pill bg-line-2" />

        <div className="mb-3">
          <div className="font-display text-base font-extrabold text-ink">
            {dayLabel} {slotName}
          </div>
          <Show when={currentDish !== null}>
            <div className="text-[11.5px] text-ink-3">Currently {currentDish}</div>
          </Show>
        </div>

        {/* `.field` — search within the candidates the matcher approved. */}
        <div className="mb-2.5 flex min-h-ctrl items-center gap-2 rounded-blade-xs border-2 border-line-2 bg-white px-3 focus-within:border-ink">
          <Search size={15} strokeWidth={2.2} className="flex-none text-ink-4" />
          <input
            type="text"
            value={query}
            aria-label="Search for a meal"
            placeholder="Search a dish"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-4"
          />
        </div>

        <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.11em] text-ink-3">
          Fits your kitchen
        </div>

        {/* Candidate-shaped rows, so the real list lands in place rather than
            replacing a centred sentence. */}
        <Show when={loading}>
          <div className="flex flex-col gap-[7px]">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                aria-hidden="true"
                className="flex items-center gap-2.5 rounded-blade-xs border border-hair border-line-2 bg-white px-2.5 py-2"
              >
                <div className="h-[34px] w-[34px] flex-none animate-shimmer rounded-blade-xs bg-skeleton" />
                <div className="min-w-0 flex-1">
                  <div className="h-3.5 w-2/3 animate-shimmer rounded bg-skeleton" />
                  <div className="mt-1.5 h-2.5 w-1/3 animate-shimmer rounded bg-skeleton" />
                </div>
                <div className="h-5 w-11 flex-none animate-shimmer rounded-pill bg-skeleton" />
              </div>
            ))}
            <p className="sr-only">Looking at that day</p>
          </div>
        </Show>

        <Show when={!loading && candidates.length === 0 && needle.length === 0}>
          <PlanNote>
            Nothing else fits that day. Your kitchen is thin by then — the runway says what to
            buy.
          </PlanNote>
        </Show>

        {/* Said separately: "nothing matched your search" and "nothing fits
            that day" are different facts, and merging them misleads. */}
        <Show when={!loading && candidates.length === 0 && needle.length > 0}>
          <PlanNote>
            No dish here matches &ldquo;{query.trim()}&rdquo;. Clear the search to see everything
            that fits that day.
          </PlanNote>
        </Show>

        <div className="flex flex-col gap-[7px]">
          {candidates.map((candidate) => (
            <button
              key={candidate.mealId}
              type="button"
              onClick={() => {
                onPick(candidate.mealId, candidate.name);
              }}
              className="flex items-center gap-2.5 rounded-blade-xs border border-hair border-line-2 bg-white px-2.5 py-2 text-left transition-all duration-fast hover:border-ink hover:shadow-drop-sm"
            >
              <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-blade-xs border border-hair border-line-2 bg-sky-soft">
                <KoboyoIcon name={dishGlyph(candidate.heroIcon)} size={20} alone />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[13.5px] font-extrabold leading-[1.15] text-ink">
                  {candidate.name}
                </span>
                <span className="mt-px block text-[11px] text-ink-3">
                  {candidate.minutes} min · {candidate.kitchenNote}
                </span>
              </span>
              {/*
               * The match percentage is the DETERMINISTIC matcher's, never
               * the model's — so it can be shown as a number.
               *
               * Toned by whether the kitchen covers it, as the design does:
               * the number and the colour say the same thing, so a glance at
               * the colour is enough.
               */}
              <span className="ml-auto flex-none">
                <PlanTag tone={candidate.missingCount === 0 ? 'ok' : 'warn'}>
                  {candidate.matchPercent}%
                </PlanTag>
              </span>
            </button>
          ))}
        </div>

        {/* The consequence, before the action, with the fix offered. */}
        <Show when={spoils !== null}>
          <div className="mt-3">
            <PlanNote tone="warn">
              <strong>Swapping this off means the {spoils?.name.toLowerCase()} goes unused.</strong>{' '}
              {spoils?.couldMoveTo === null
                ? 'There is no later day in the plan that still catches it.'
                : 'We can move it to another day in the plan if you want.'}
            </PlanNote>
          </div>
        </Show>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onRemove}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-blade-xs border-2 border-line-2 bg-white py-2.5 text-[13px] font-extrabold text-ink hover:border-critical-onsoft hover:bg-critical-soft"
          >
            <KoboyoIcon name="trash" size={14} alone />
            Remove
          </button>
          <button
            type="button"
            onClick={onSurpriseMe}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-blade-xs border-2 border-line-2 bg-white py-2.5 text-[13px] font-extrabold text-ink hover:border-ink hover:bg-paper-2"
          >
            <KoboyoIcon name="cycle" size={14} alone />
            Surprise me
          </button>
        </div>
      </div>
    </div>
  );
}
