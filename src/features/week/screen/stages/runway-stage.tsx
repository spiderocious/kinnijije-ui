import { Show } from 'meemaw';

import { KoboyoIcon } from '@icons';

import {
  PlanAppBar,
  PlanBody,
  PlanButton,
  PlanDock,
  PlanLabel,
  PlanScreen,
} from '../../parts/plan-chrome';
import type { TimetableSummary } from '../../services/timetable.api';

/**
 * What the week needs that the kitchen does not have.
 *
 * NO PRICES AND NO QUANTITIES. Both were removed deliberately:
 *
 * The prices were estimates from our own ingredient list, and the catalogue's
 * own comment says they must never be shown as a price somebody will pay.
 * Putting a naira figure beside each line invited exactly that reading, and a
 * total at the bottom made it look like a bill we stood behind.
 *
 * The quantities were worse. "0.67 pieces of tatashe" and "27.42 ml of palm
 * oil" are arithmetic, not shopping — nobody buys two thirds of a pepper, and
 * a market list that talks like a spreadsheet is one nobody takes to a market.
 *
 * What is left is the only thing that was ever actionable: WHAT to buy.
 */

export function RunwayStage({
  summary,
  onBack,
}: {
  readonly summary: TimetableSummary;
  readonly onBack: () => void;
}) {
  const { runway } = summary;

  const toBuy = runway.market;
  const covered = runway.lines.filter((line) => line.status === 'ok');

  return (
    <PlanScreen>
      <PlanAppBar title="What you need" onBack={onBack} />

      <PlanBody>
        <Show
          when={toBuy.length > 0}
          fallback={
            /* The good case, and it deserves the whole screen rather than a
               note at the top of an empty list. */
            <div className="flex flex-col items-center px-4 pt-10 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-blade border-2 border-ink bg-success-soft shadow-drop-sm">
                <KoboyoIcon name="plateFull" size={32} alone className="text-success-onsoft" />
              </div>
              <p className="mt-3.5 font-display text-[19px] font-extrabold leading-tight tracking-display text-ink">
                Nothing to buy
              </p>
              <p className="mt-1.5 text-[13px] text-ink-3">
                Your kitchen covers the whole plan.
              </p>
            </div>
          }
        >
          {/* The headline: a count, which is the number people act on. */}
          <div>
            <div className="font-display text-[22px] font-extrabold leading-[1.15] tracking-display text-ink">
              {toBuy.length} thing{toBuy.length === 1 ? '' : 's'} to pick up
            </div>
            <p className="mt-1 text-[13px] text-ink-3">
              Everything else the week needs is already in your kitchen.
            </p>
          </div>

          <div className="overflow-scroll rounded-blade border-2 border-ink bg-white shadow-drop-sm">
            {toBuy.map((line, index) => (
              <div
                key={line.name}
                className={`flex items-center gap-2.5 px-3.5 py-3 ${
                  index === toBuy.length - 1 ? '' : 'border-b border-hair border-line'
                }`}
              >
                <span className="grid h-9 w-9 flex-none place-items-center rounded-blade-xs border border-hair border-line-2 bg-paper-2">
                  <KoboyoIcon name="basket" size={18} alone className="text-ink-3" />
                </span>
                <span className="min-w-0 flex-1 font-display text-[15px] font-extrabold leading-tight text-ink">
                  {line.name}
                </span>
              </div>
            ))}
          </div>
        </Show>

        {/* What they already have, so the list above reads as a short gap in
            a mostly-covered plan rather than a bill. */}
        <Show when={covered.length > 0}>
          <div>
            <PlanLabel>
              Already in your kitchen · {covered.length} thing
              {covered.length === 1 ? '' : 's'}
            </PlanLabel>
            <div className="flex flex-wrap gap-1.5">
              {covered.map((line) => (
                <span
                  key={line.name}
                  className="rounded-pill border border-hair border-success-border bg-success-soft px-2.5 py-1 text-[11.5px] font-bold text-success-onsoft"
                >
                  {line.name}
                </span>
              ))}
            </div>
          </div>
        </Show>
      </PlanBody>

      {/*
       * BACK, not "add to my market list".
       *
       * The market list is a separate feature with its own flow, and the
       * handoff was a toast claiming things had been added when nothing had.
       * A button that does not do what it says is worse than no button.
       */}
      <PlanDock>
        <PlanButton variant="quiet" onClick={onBack}>
          Back to your week
        </PlanButton>
      </PlanDock>
    </PlanScreen>
  );
}
