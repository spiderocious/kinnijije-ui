import { useEffect, useState } from 'react';

import { Show } from 'meemaw';

import { INGREDIENT_ART } from '@features/decide/content/decide.illustrations';
import { useDecideOptions } from '@features/decide/hooks/use-decide';
import { AskTile } from '@features/ask/screen/parts/ask-tile';
import { KitchenPanel } from '@features/ask/screen/parts/kitchen-panel';
import { KoboyoIcon, Plus, Search } from '@icons';

import {
  PlanAppBar,
  PlanBody,
  PlanButton,
  PlanDock,
  PlanLabel,
  PlanNote,
  PlanScreen,
} from '../../parts/plan-chrome';
import type { KitchenLine } from '../../services/timetable.api';

/**
 * Stage one: confirm the kitchen.
 *
 * REUSES THE ASK FLOW'S PICKER rather than a second one of its own. That
 * picker is the product's busiest input — tiles with illustrations, a search
 * that reads aliases so "atarodo" finds scotch bonnet, grouped browsing, and
 * a bottom sheet that rises to 86% of the viewport. Rebuilding a plainer
 * version here would mean the same job done two ways, and the worse one would
 * be the one in the newer flow.
 *
 * WHY THIS SCREEN EXISTS: the plan's differentiator is that it works from the
 * kitchen somebody already has. That only holds if the kitchen is right, so
 * this is an explicit confirmation rather than an assumption.
 *
 * SIGNED IN: their stock is pre-filled and they confirm or trim it — a chance
 * to say "plan with THESE, not everything I own", which is why the plan stores
 * the confirmed list rather than re-reading stock later.
 *
 * GUEST: they add from scratch. No sign-up wall, because planning a week is
 * the most engaged thing somebody can do here.
 */

export function KitchenConfirmStage({
  stock,
  selected,
  seedFromStock,
  signedIn,
  loading,
  onChange,
  onBack,
  onConfirm,
}: {
  /** Their stock rows, used to pre-fill on the first visit and for quantities. */
  readonly stock: readonly KitchenLine[];
  /**
   * The chosen labels, owned by the ROUTE and persisted in the draft.
   *
   * Controlled rather than local state: this screen is a route now, so it
   * unmounts whenever somebody navigates. Holding the selection here meant
   * pressing back to change one ingredient showed an empty screen.
   */
  readonly selected: readonly string[];
  /** False once they have been through here, so stock does not re-seed. */
  readonly seedFromStock: boolean;
  readonly signedIn: boolean;
  readonly loading: boolean;
  readonly onChange: (labels: string[]) => void;
  readonly onBack: () => void;
  /**
   * LABELS, not resolved lines.
   *
   * The catalogue id is resolved at the point of sending, by the route that
   * generates — a label survives a catalogue merge that retires an id, and
   * the ranker resolves names anyway.
   */
  readonly onConfirm: (kitchen: string[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  /** Tracks that the first seed has happened, so it happens exactly once. */
  const [seeded, setSeeded] = useState(!seedFromStock);

  const options = useDecideOptions();

  /**
   * The picker works in LABELS, because that is what the decide catalogue and
   * the matcher both speak — `rankCandidates` resolves its kitchen by name.
   * The catalogue id is looked back up on confirm, for the lines we can.
   */
  const labels = [...selected];

  /**
   * Seed from their stock ONCE, on the first visit only.
   *
   * Guarded on `seedFromStock` as well as the local flag: a signed-in cook who
   * took three things out and pressed back must not have them pushed back in
   * by this effect. The draft is the authority after the first pass.
   */
  useEffect(() => {
    if (seeded || loading) return;
    setSeeded(true);
    if (stock.length === 0) return;
    onChange(stock.map((line) => line.name));
    // `onChange` is stable (a `useCallback` patcher); stock is what we react to.
  }, [stock, loading, seeded, onChange]);

  /**
   * Label → catalogue id, from the decide options already in memory.
   *
   * A label we cannot place keeps a null id: it stays on the list and the note
   * below says it will not be matched to recipes, rather than being dropped
   * silently.
   */
  const idFor = (label: string): string | null => {
    for (const group of options.data?.kitchen ?? []) {
      const hit = group.items.find((item) => item.label === label);
      if (hit !== undefined) return hit.id;
    }
    return null;
  };

  const iconFor = (label: string): string | undefined => {
    for (const group of options.data?.kitchen ?? []) {
      const hit = group.items.find((item) => item.label === label);
      if (hit !== undefined) return hit.icon;
    }
    return undefined;
  };

  const unmatched = labels.filter((label) => idFor(label) === null);

  return (
    <PlanScreen>
      <PlanAppBar title="What are we cooking with?" onBack={onBack} />

      <PlanBody>
        <Show
          when={signedIn}
          fallback={
            <PlanNote>
              <strong>Add what you have.</strong> We will build a week around it and tell you
              what you need to buy.
            </PlanNote>
          }
        >
          <PlanNote tone="ok">
            <strong>This is your kitchen.</strong> Take anything out you would rather not plan
            with, and add what is missing.
          </PlanNote>
        </Show>

        {/*
         * The search field is the control that opens the sheet, not a field
         * that filters in place — the same gesture as the ask flow, where
         * tapping search grows the picker up from the dock.
         */}
        <button
          type="button"
          onClick={() => {
            setPickerOpen(true);
          }}
          className="flex min-h-ctrl w-full items-center gap-2 rounded-blade-xs border-2 border-line-2 bg-white px-3 text-left hover:border-ink"
        >
          <Search size={16} strokeWidth={2.4} className="shrink-0 text-ink-4" />
          <span className="min-w-0 flex-1 text-[14px] text-ink-4">
            {options.data === undefined
              ? 'Search ingredients'
              : `Search ${String(options.data.total_items)} ingredients`}
          </span>
          <Plus size={15} strokeWidth={2.8} className="shrink-0 text-sky-deep" />
        </button>

        {/* A grid of tiles, not the words "Reading your kitchen…" — the real
            content is a grid of tiles and it should land in place. */}
        <Show when={loading && !seeded}>
          <div>
            <div aria-hidden="true" className="h-2.5 w-32 animate-shimmer rounded bg-skeleton" />
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map((tile) => (
                <div
                  key={tile}
                  aria-hidden="true"
                  className="h-[86px] animate-shimmer rounded-blade-xs bg-skeleton"
                />
              ))}
            </div>
            <p className="sr-only">Reading your kitchen</p>
          </div>
        </Show>

        <Show when={labels.length > 0}>
          <div>
            <PlanLabel>
              {labels.length} thing{labels.length === 1 ? '' : 's'} to plan with
            </PlanLabel>
            {/*
             * Tiles rather than rows, matching the picker they came from — the
             * illustration is what makes a long list scannable, and switching
             * to text rows here would make the confirmation look like a
             * different product from the step before it.
             */}
            <div className="grid grid-cols-3 gap-2">
              {labels.map((label, position) => {
                const id = idFor(label);

                return (
                  <AskTile
                    key={label}
                    index={position}
                    label={label}
                    icon={iconFor(label)}
                    art={id === null ? undefined : INGREDIENT_ART[id]}
                    // Selected, because everything here IS chosen — tapping
                    // one takes it out, which is the same gesture as in the
                    // picker it came from.
                    selected
                    onToggle={() => {
                      onChange(labels.filter((entry) => entry !== label));
                    }}
                  />
                );
              })}
            </div>
            <p className="mt-2 text-[11.5px] text-ink-3">Tap one to take it out.</p>
          </div>
        </Show>

        <Show when={seeded && labels.length === 0}>
          <div className="rounded-blade border border-dashed border-line-2 bg-paper-2 px-5 py-8 text-center">
            <KoboyoIcon name="emptyBox" size={48} alone />
            <p className="mt-2 font-display text-base font-extrabold text-ink">
              Nothing in here yet
            </p>
            <p className="mt-1 text-sm text-ink-2">
              Add a few things and we will plan around them. You can also skip and plan from the
              whole catalogue.
            </p>
          </div>
        </Show>

        {/* Said plainly rather than left to be discovered. */}
        <Show when={unmatched.length > 0}>
          <PlanNote tone="warn">
            {unmatched.length} of these are not in our ingredient list, so they will not be
            matched to recipes. They stay on your list.
          </PlanNote>
        </Show>
      </PlanBody>

      <PlanDock>
        <PlanButton
          onClick={() => {
            onConfirm(labels);
          }}
        >
          {labels.length === 0 ? 'Plan without a kitchen' : 'Use these'}
        </PlanButton>
        <Show when={labels.length === 0 && !signedIn}>
          <p className="text-center text-[11.5px] text-ink-3">
            Without a kitchen we plan from the whole catalogue, and everything lands on your
            market list.
          </p>
        </Show>
      </PlanDock>

      {/* The ask flow's own picker: tiles, alias search, grouped browsing. */}
      <Show when={pickerOpen}>
        <KitchenPanel
          options={options.data}
          selected={labels}
          onChange={onChange}
          onClose={() => {
            setPickerOpen(false);
          }}
        />
      </Show>
    </PlanScreen>
  );
}
