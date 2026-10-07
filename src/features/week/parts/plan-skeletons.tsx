import { useEffect, useState } from 'react';

import { Show } from 'meemaw';

import { KoboyoIcon } from '@icons';

import { PlanAppBar, PlanBody, PlanDock, PlanScreen } from './plan-chrome';

/**
 * Loading states for the timetable, shaped like what they are loading.
 *
 * NO TEXT-ONLY LOADERS. A screen that says "Reading your kitchen…" and then
 * swaps to a full layout moves everything under the reader's thumb, and tells
 * them nothing in the meantime. Every skeleton here matches the real screen's
 * geometry so the content lands in place rather than shoving the page around.
 *
 * SKELETONS OVER SPINNERS wherever the shape is known. A spinner is honest
 * only when we genuinely cannot say what is coming — and on these screens we
 * always can. The one exception is generating a plan, which takes long enough
 * that somebody needs to be told it is working and roughly why it is slow.
 */

/** One shimmering block. The building piece for every skeleton below. */
function Bone({ className }: { readonly className: string }) {
  return <div aria-hidden="true" className={`animate-shimmer rounded bg-skeleton ${className}`} />;
}

/**
 * A meal slot's skeleton, matching `PlanSlot` box for box.
 *
 * Same border, same 46px mark, same two lines of text and a chip row — so
 * when the real slot arrives nothing jumps.
 */
export function SlotSkeleton() {
  return (
    <div className="overflow-hidden rounded-blade-sm border-2 border-line-2 bg-white">
      <div className="flex items-center gap-[7px] border-b border-hair border-line bg-paper-2 px-[11px] py-[7px]">
        <Bone className="h-2.5 w-14" />
        <Bone className="ml-auto h-2.5 w-10" />
      </div>
      <div className="flex items-start gap-2.5 px-[11px] py-2.5">
        <Bone className="h-[46px] w-[46px] flex-none rounded-blade-xs" />
        <div className="min-w-0 flex-1">
          <Bone className="h-4 w-2/3" />
          <Bone className="mt-2 h-3 w-full" />
        </div>
      </div>
      <div className="flex gap-[5px] px-[11px] pb-2.5">
        <Bone className="h-5 w-20 rounded-pill" />
        <Bone className="h-5 w-16 rounded-pill" />
      </div>
    </div>
  );
}

/** The summary hub, mid-load. Headline, three stats, a row card, the switch. */
export function SummarySkeleton() {
  return (
    <>
      <div>
        <Bone className="h-3 w-32" />
        <Bone className="mt-2 h-6 w-full" />
        <Bone className="mt-1.5 h-6 w-3/5" />
      </div>

      <div className="grid grid-cols-3 gap-[7px]">
        {[0, 1, 2].map((slot) => (
          <div
            key={slot}
            className="rounded-blade-xs border border-hair border-line-2 bg-white px-2.5 py-2.5"
          >
            <Bone className="h-5 w-10" />
            <Bone className="mt-2 h-2.5 w-12" />
          </div>
        ))}
      </div>

      <div className="rounded-blade-xs border border-hair border-line-2 bg-white px-3 py-3">
        <div className="flex items-center gap-2.5">
          <Bone className="h-8 w-8 flex-none rounded-blade-xs" />
          <div className="flex-1">
            <Bone className="h-3.5 w-28" />
            <Bone className="mt-1.5 h-2.5 w-40" />
          </div>
        </div>
      </div>

      <div className="rounded-blade-xs border border-hair border-line-2 bg-white px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex-1">
            <Bone className="h-3.5 w-36" />
            <Bone className="mt-1.5 h-2.5 w-48" />
          </div>
          <Bone className="h-6 w-11 flex-none rounded-pill" />
        </div>
      </div>
    </>
  );
}

/** The day screen, mid-load: day heading, dots, and two slots. */
export function DaySkeleton() {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <div>
          <Bone className="h-2.5 w-16" />
          <Bone className="mt-2 h-6 w-28" />
        </div>
        <div className="ml-auto flex gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((dot) => (
            <Bone key={dot} className="h-1.5 w-1.5 rounded-pill" />
          ))}
        </div>
      </div>
      <SlotSkeleton />
      <SlotSkeleton />
    </>
  );
}

/** The kitchen screen, mid-load: the search control and a grid of tiles. */
export function KitchenSkeleton() {
  return (
    <>
      <Bone className="h-11 w-full rounded-blade-xs" />
      <div>
        <Bone className="h-2.5 w-32" />
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((tile) => (
            <Bone key={tile} className="h-[86px] rounded-blade-xs" />
          ))}
        </div>
      </div>
    </>
  );
}

/** The shopping list, mid-load. */
export function NeedsSkeleton() {
  return (
    <>
      <Bone className="h-16 w-full rounded-blade-xs" />
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="flex items-center gap-2.5 rounded-blade-xs border border-hair border-line-2 bg-white px-2.5 py-2.5"
        >
          <Bone className="h-5 w-5 flex-none rounded" />
          <div className="flex-1">
            <Bone className="h-3.5 w-32" />
            <Bone className="mt-1.5 h-2.5 w-20" />
          </div>
          <Bone className="h-3.5 w-12 flex-none" />
        </div>
      ))}
    </>
  );
}

/**
 * The lines shown while a plan is being built.
 *
 * Rotating, because generating takes long enough that one static sentence
 * starts to look frozen. Each one says something TRUE about what is happening
 * rather than filling time — somebody reading "Checking what your kitchen
 * already covers" learns how the feature works.
 *
 * Deliberately not jokes. Waiting for something you asked for is a bad moment
 * to be entertained at.
 */
const BUILDING_LINES = [
  'Reading what is in your kitchen.',
  'Checking which dishes it already covers.',
  'Spreading the week so you are not eating rice every night.',
  'Working out the shortest shopping list.',
  'Putting the days in order.',
] as const;

/**
 * The full-screen state while a plan is generated.
 *
 * A SKELETON OF THE SUMMARY, not a spinner on a blank page, because that is
 * what is coming — the screen fills in rather than replacing itself. The mark
 * and the rotating line sit above it so there is something to read while a
 * call that can take ten seconds runs.
 *
 * Owned by the plan screen rather than the configure screen: configure
 * navigates away immediately, and this screen does the submission. That way
 * the back button cannot drop somebody into a half-submitted form, and a
 * failure can send them back with a toast rather than stranding them.
 */
export function GeneratingScreen({ onBack }: { readonly onBack: () => void }) {
  const [line, setLine] = useState(0);

  useEffect(() => {
    // 2.6s: long enough to read, short enough that the screen never looks
    // stuck on one sentence.
    const timer = window.setInterval(() => {
      setLine((current) => (current + 1) % BUILDING_LINES.length);
    }, 2600);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <PlanScreen>
      <PlanAppBar title="Building your week" onBack={onBack} />
      <PlanBody>
        <div className="flex flex-col items-center px-4 pb-1 pt-5 text-center">
          {/* The mark turns, so the screen is visibly alive even when the
              sentence has not changed yet. */}
          <div className="grid h-16 w-16 place-items-center rounded-blade border-2 border-ink bg-sky-soft shadow-drop-sm">
            {/* `animate-steam` rather than a spinner: a pot that is steaming
                says "cooking" where a spinner says "waiting". */}
            <KoboyoIcon name="cookingPot" size={34} alone className="animate-steam text-sky-deep" />
          </div>

          <p className="mt-3.5 font-display text-[19px] font-extrabold leading-tight tracking-display text-ink">
            Building your week
          </p>

          {/* `key` restarts the fade on every change, so the swap reads as a
              deliberate step rather than a flicker. */}
          <p
            key={line}
            className="mt-1.5 min-h-[34px] animate-fade text-[13px] text-ink-3"
            aria-live="polite"
          >
            {BUILDING_LINES[line]}
          </p>
        </div>

        {/* What is coming, so the layout is already settled when it lands. */}
        <SummarySkeleton />
      </PlanBody>

      <PlanDock>
        <div className="flex h-9 items-center justify-center rounded-blade-xs border-2 border-line-2 bg-paper-2 text-[12.5px] font-extrabold text-ink-3">
          This takes a few seconds
        </div>
      </PlanDock>
    </PlanScreen>
  );
}

/**
 * A screen that failed to load.
 *
 * Says what broke and offers the one action worth offering. Not a toast: a
 * toast vanishes and leaves an empty screen behind, and somebody who looked
 * away has no way to find out what happened.
 */
export function PlanError({
  title,
  message,
  onRetry,
  onBack,
}: {
  readonly title: string;
  readonly message: string;
  readonly onRetry?: (() => void) | undefined;
  readonly onBack: () => void;
}) {
  return (
    <PlanScreen>
      <PlanAppBar title={title} onBack={onBack} />
      <PlanBody>
        <div className="flex flex-col items-center px-4 pt-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-blade border-2 border-ink bg-critical-soft shadow-drop-sm">
            <KoboyoIcon name="solidWarning" size={32} alone className="text-critical-onsoft" />
          </div>
          <p className="mt-3.5 font-display text-[19px] font-extrabold leading-tight tracking-display text-ink">
            That did not load
          </p>
          <p className="mt-1.5 text-[13px] text-ink-3">{message}</p>
        </div>
      </PlanBody>

      <PlanDock>
        <Show when={onRetry !== undefined}>
          <button
            type="button"
            onClick={onRetry}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-blade-xs border-2 border-ink bg-sky text-[14.5px] font-extrabold text-white shadow-drop-sm"
          >
            <KoboyoIcon name="cycle" size={15} alone />
            Try again
          </button>
        </Show>
        <button
          type="button"
          onClick={onBack}
          className="h-11 w-full rounded-blade-xs border-2 border-line-2 bg-white text-[14.5px] font-extrabold text-ink hover:border-ink"
        >
          Go back
        </button>
      </PlanDock>
    </PlanScreen>
  );
}
