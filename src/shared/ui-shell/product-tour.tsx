import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';

/**
 * A coach-mark tour that POINTS at real things, and WALKS to them.
 *
 * Two properties make it a tour rather than a slideshow:
 *
 *   1. every step measures the element behind it and cuts a hole in the scrim
 *      over that element, with a spoon aimed at the gap
 *   2. a step can name a `route` — the tour navigates there before pointing,
 *      so the market list and the add-stock flow are shown where they live
 *      rather than described from the dashboard
 *
 * Anchors are `data-tour="…"` attributes on real components. A step whose
 * anchor is missing or collapsed (a sidebar on a phone, an empty section)
 * falls back to a centred card instead of pointing at nothing.
 *
 * Skippable at every step, shown once per device.
 */
const SEEN_KEY = 'kj.tour_seen';

/** Breathing room between the highlight and the element it surrounds. */
const PAD = 8;
/** Gap between the highlight and the card beside it. */
const GAP = 14;
const CARD_WIDTH = 330;
/** Rough card height, used only to decide above-or-below. */
const CARD_ESTIMATE = 210;

export interface TourStep {
  /** `data-tour` value to point at. Omit for a step with no anchor. */
  readonly anchor?: string;
  /** Navigate here before pointing. Omit to stay where we are. */
  readonly route?: string;
  /** Query params for that route. The router serialises these itself — a
   *  query string baked into `route` would be treated as part of the path. */
  readonly search?: Record<string, string>;
  readonly title: string;
  readonly body: string;
  readonly icon: KoboyoIconName;
}

const STEPS: readonly TourStep[] = [
  {
    route: ROUTES.KITCHEN,
    anchor: 'stats',
    icon: 'dashboard',
    title: 'This is your kitchen',
    body: 'What is in, what is running low, what to use soon, and what you could cook right now.',
  },
  {
    anchor: 'attention',
    icon: 'expiryLabel',
    title: 'This part asks something of you',
    body: 'Anything running low or about to turn shows up here first, with a way to act on it.',
  },
  {
    anchor: 'cook-cta',
    icon: 'cookingPot',
    title: 'Then cook',
    body: 'We match what you have against real recipes and show you the closest five.',
  },
  {
    route: ROUTES.MARKET,
    // The list itself, not the whole content region — pointing at a
    // full-height element tells nobody anything and leaves no room for a card.
    anchor: 'market-list',
    icon: 'shoppingBasket',
    title: 'The market list closes the loop',
    body: 'Add what you are running out of. Tick it bought and it lands in your kitchen — no counting.',
  },
  {
    anchor: 'nav-market',
    icon: 'badgeDot',
    title: 'It follows you around',
    body: 'The badge here counts what is still to buy, so you never reach the market and find you forgot the list.',
  },
  {
    route: ROUTES.STOCK_ADD,
    search: { step: 'method' },
    anchor: 'add-method',
    icon: 'shelf',
    title: 'Correcting your kitchen',
    body: 'You rarely need this — cooking and shopping keep it current. When you do, there are three ways in.',
  },
  {
    route: ROUTES.STOCK_ADD,
    search: { step: 'entry', method: 'manual' },
    anchor: 'add-typeahead',
    icon: 'editPencil',
    title: 'Type it and we understand it',
    body: 'Atarodo finds scotch bonnet, gari finds garri. Add a few, then confirm the lot in one go.',
  },
  {
    route: ROUTES.KITCHEN,
    anchor: 'nav-ai',
    icon: 'robotForAi',
    title: 'Or just ask',
    body: 'The assistant knows your kitchen. Ask what to cook, or tell it to add something — it does it, then tells you what it did.',
  },
];

interface Box {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

export function hasSeenTour(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    // Storage can throw outright in a private window — treat that as "seen"
    // rather than showing the tour on every single visit.
    return true;
  }
}

function markSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Nothing to do; the tour simply shows again next time.
  }
}

function measure(anchor: string | undefined): Box | null {
  if (anchor === undefined) return null;
  const node = document.querySelector(`[data-tour="${anchor}"]`);
  if (node === null) return null;

  const rect = node.getBoundingClientRect();
  // Present but collapsed — a hidden sidebar, an empty section — is not
  // something to point at. `contents` elements report zeros here too.
  if (rect.width === 0 || rect.height === 0) return null;
  // Entirely off-screen after a scroll that could not reach it.
  if (rect.bottom < 0 || rect.top > window.innerHeight) return null;

  return {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
}

/**
 * Where the card goes relative to the hole, and which way the spoon points.
 *
 * Below the target when the card fits underneath, above otherwise — it must
 * never cover the thing it is describing. That is why the bottom tab bar always
 * gets a card ABOVE it, with the spoon pointing DOWN.
 */
function placeCard(box: Box | null): {
  readonly style: React.CSSProperties;
  readonly pointer: 'up' | 'down' | null;
} {
  if (box === null) {
    return { style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }, pointer: null };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Centred on the target, then pulled back inside the viewport.
  const rawLeft = box.left + box.width / 2 - CARD_WIDTH / 2;
  const left = Math.min(Math.max(rawLeft, 12), Math.max(12, vw - CARD_WIDTH - 12));

  const spaceBelow = vh - (box.top + box.height) - GAP;
  const spaceAbove = box.top - GAP;

  if (spaceBelow >= CARD_ESTIMATE) {
    return {
      style: { top: box.top + box.height + GAP, left, width: CARD_WIDTH },
      pointer: 'up',
    };
  }

  if (spaceAbove >= CARD_ESTIMATE) {
    // `bottom` rather than `top`, so the card grows upward from the target and
    // its real height never pushes it back over what it points at.
    return {
      style: { bottom: vh - box.top + GAP, left, width: CARD_WIDTH },
      pointer: 'down',
    };
  }

  // Neither side has room — the target is most of the screen (a whole content
  // region, a full-height panel). Sit INSIDE it, near the bottom, with no
  // pointer: an arrow at something this large tells nobody anything, and the
  // earlier version pushed the card clean off the top of the viewport.
  return {
    style: {
      top: Math.min(box.top + box.height, vh) - CARD_ESTIMATE - GAP,
      left,
      width: CARD_WIDTH,
    },
    pointer: null,
  };
}

/**
 * Routes the tour is allowed to begin on.
 *
 * It is root-mounted, so without this it would fire over the landing page and
 * the login form — neither of which has a kitchen to point at.
 */
const START_ROUTE = ROUTES.KITCHEN;

/**
 * `?tour=true` on the kitchen forces the tour open, ignoring "already seen".
 *
 * For demoing and for testing it without clearing localStorage by hand.
 */
const FORCE_PARAM = 'tour';

function isForced(searchStr: string): boolean {
  const value = new URLSearchParams(searchStr).get(FORCE_PARAM);
  return value === 'true' || value === '1';
}

export function ProductTour() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useRouterState({ select: (state) => state.location.searchStr });

  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  /** Set once a forced run begins, so finishing it does not immediately restart. */
  const forcedRef = useRef(false);

  const current = STEPS[step];

  const finish = useCallback((): void => {
    markSeen();
    setOpen(false);
    // Released so a LATER `?tour=true` can force it open again in this same
    // session — a latch that never reset would make the flag single-use.
    forcedRef.current = false;

    // Strip `?tour=true` on the way out. Read from the live location rather
    // than the render's copy: the tour walks between screens, so by the time
    // somebody clicks Skip we may be on a different URL entirely. Left in
    // place, returning to the kitchen would relaunch the tour every time.
    if (isForced(window.location.search)) {
      const next = new URLSearchParams(window.location.search);
      next.delete(FORCE_PARAM);
      const record: Record<string, string> = {};
      for (const [key, value] of next.entries()) record[key] = value;
      void navigate({ to: window.location.pathname, search: record as never, replace: true });
    }
  }, [navigate]);

  // Starts only on the kitchen, and only once. Once open it stays open across
  // the screens it walks to.
  //
  // `?tour=true` overrides the seen-check, and always shows the tour.
  //
  // It is LATCHED for the duration of one run rather than read live: the tour
  // navigates, so the flag falls out of the URL on the very first step, and a
  // live read would then restart the tour at step 0 forever. `finish` releases
  // the latch so the flag works again next time.
  useEffect(() => {
    if (open || forcedRef.current) return;
    if (pathname !== START_ROUTE) return;

    const forced = isForced(search);
    if (!forced && hasSeenTour()) return;

    if (forced) forcedRef.current = true;
    setStep(0);
    setOpen(true);
  }, [open, pathname, search]);

  // Walk to the step's screen. Compared against the CURRENT url so re-running
  // this effect on an unrelated render does not re-navigate.
  const wantRoute = current?.route;
  const wantSearch = current?.search;
  // Depended on by VALUE, not reference: a step's `search` is a literal in
  // STEPS, so comparing the serialised form keeps the effect from re-firing.
  const wantSearchKey = JSON.stringify(wantSearch ?? null);

  useEffect(() => {
    if (!open || wantRoute === undefined) return;

    // Already there, with the params this step needs? Then do not navigate —
    // re-navigating on every render would fight the user's own scrolling.
    const here = new URLSearchParams(search);
    const satisfied =
      pathname === wantRoute &&
      Object.entries(wantSearch ?? {}).every(([key, value]) => here.get(key) === value);
    if (satisfied) return;

    void navigate(
      wantSearch === undefined
        ? { to: wantRoute }
        : { to: wantRoute, search: wantSearch as never },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wantRoute, wantSearchKey, pathname, search, navigate]);

  const remeasure = useCallback(() => {
    setBox(measure(current?.anchor));
  }, [current?.anchor]);

  // Layout effect, not effect: measuring after paint puts the highlight in the
  // wrong place for a frame, which reads as a jump.
  useLayoutEffect(() => {
    if (!open) return undefined;

    remeasure();
    // The target may not exist yet — a route change and its data still landing.
    // Re-measuring on a short interval covers that without a mount observer.
    const timer = window.setInterval(remeasure, 250);
    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, true);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', remeasure, true);
    };
  }, [open, remeasure, pathname]);

  // Bring the target into view before pointing at it — a highlight below the
  // fold is an arrow at nothing.
  useEffect(() => {
    if (!open || current?.anchor === undefined) return;
    document
      .querySelector(`[data-tour="${current.anchor}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [open, step, current?.anchor, pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [open, finish]);

  if (!open || current === undefined) return null;

  const isLast = step === STEPS.length - 1;
  const { style, pointer } = placeCard(box);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* The scrim is FOUR panels around the target, not one sheet with a
          transparent hole — a blurred sheet blurs the very thing being pointed
          at. Four panels leave the target crisp and untouched. */}
      <Show when={box !== null}>
        <TourScrim box={box as Box} onSkip={finish} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-blade ring-2 ring-sky"
          style={{
            top: box?.top,
            left: box?.left,
            width: box?.width,
            height: box?.height,
            boxShadow: '0 0 0 4px rgb(56 182 240 / 0.25)',
          }}
        />
      </Show>

      {/* No anchor on screen: a plain centred scrim, and no spoon pointing
          nowhere. */}
      <Show when={box === null}>
        <button
          type="button"
          aria-label="Skip the tour"
          onClick={finish}
          className="absolute inset-0 h-full w-full cursor-default bg-ink/50 backdrop-blur-md"
        />
      </Show>

      <div className="absolute flex flex-col" style={style}>
        {/* Spoon ABOVE the card when the card is below its target, and below the
            card when it is above. It is a real flex child either way — the
            earlier version positioned it without a flex parent, so it always
            rendered on top pointing the wrong way. */}
        <Show when={pointer === 'up'}>
          <Pointer direction="up" />
        </Show>

        <div className="rounded-blade bg-white p-5 pb-[26px] pr-[26px] shadow-xl">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-blade-sm bg-sky-soft text-sky-on">
              <KoboyoIcon name={current.icon} size={22} alone />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-md font-extrabold leading-snug tracking-display">
                {current.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{current.body}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {/* Where you are, so the tour never feels endless. */}
            <div className="flex gap-1">
              {STEPS.map((entry, index) => (
                <span
                  key={entry.title}
                  className={cn(
                    'h-1.5 rounded-full',
                    index === step ? 'w-4 bg-sky' : 'w-1.5 bg-line',
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Skippable at every step EXCEPT the last, where "Start
                  cooking" already ends the tour — offering both is asking
                  somebody to choose between two identical outcomes. */}
              <Show when={!isLast}>
                <button
                  type="button"
                  onClick={finish}
                  className="text-sm text-ink-3 underline-offset-2 hover:underline"
                >
                  Skip
                </button>
              </Show>
              <Show when={step > 0}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStep((value) => value - 1);
                  }}
                >
                  Back
                </Button>
              </Show>
              <Button
                size="sm"
                onClick={() => {
                  if (isLast) finish();
                  else setStep((value) => value + 1);
                }}
              >
                {isLast ? 'Start cooking' : 'Next'}
              </Button>
            </div>
          </div>
        </div>

        <Show when={pointer === 'down'}>
          <Pointer direction="down" />
        </Show>
      </div>
    </div>
  );
}

function Pointer({ direction }: { readonly direction: 'up' | 'down' }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex justify-center text-sky', direction === 'up' ? 'mb-[-4px]' : 'mt-[-4px]')}
    >
      {/* The spoon's bowl is its drawn "head"; rotating 180° puts that head at
          the end nearest the target. */}
      <KoboyoIcon
        name="woodenSpoon"
        size={28}
        className={direction === 'up' ? 'rotate-180' : ''}
        alone
      />
    </div>
  );
}

/**
 * The dimmed area, as four panels surrounding the hole.
 *
 * Each is clickable to skip, which is what tapping outside a coach mark should
 * do — the target itself stays untouched and unblurred.
 */
function TourScrim({ box, onSkip }: { readonly box: Box; readonly onSkip: () => void }) {
  const panel = 'absolute bg-ink/50 backdrop-blur-md';
  const right = box.left + box.width;
  const bottom = box.top + box.height;

  return (
    <>
      <button type="button" aria-label="Skip the tour" onClick={onSkip} className={panel}
        style={{ top: 0, left: 0, right: 0, height: Math.max(0, box.top) }} />
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={onSkip} className={panel}
        style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={onSkip} className={panel}
        style={{ top: box.top, left: 0, width: Math.max(0, box.left), height: box.height }} />
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={onSkip} className={panel}
        style={{ top: box.top, left: right, right: 0, height: box.height }} />
    </>
  );
}
