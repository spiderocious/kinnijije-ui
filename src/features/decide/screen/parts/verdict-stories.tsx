import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Clock, Plus, RotateCcw, Sparkles, Users } from 'lucide-react';

import { ChowdeckOffers } from '@features/chowdeck/parts/chowdeck-offers';
import { Button } from '@ui/primitives';

import { DECIDE_COPY } from '../../content/decide.content';
import { ILLUSTRATION } from '../../content/decide.illustrations';
import type { DecideMeal, DecideMode, DecidePlace, DecideVerdict } from '../../types/decide.types';
import { useSwipe } from './use-swipe';

/**
 * The verdict, as a swipeable set.
 *
 * Card one is still THE recommendation: it is first, and it is the only one
 * carrying the model's own sentence. The rest are arguments, not peers. A
 * carousel of equals is a menu, and a menu is the problem somebody arrived
 * with.
 *
 * Swipe, arrow keys and the floating buttons all do the same thing, because a
 * gesture nobody discovers is not an affordance.
 */
interface VerdictStoriesProps {
  readonly verdict: DecideVerdict;
  readonly rejectedName: string | null;
  readonly onCook: (mealId: string) => void;
  readonly onReject: (mealId: string) => void;
  readonly onChangeAnswer: () => void;
  readonly onRestart: () => void;
  /** Spends a token: asks the server for a fresh set with the same answers. */
  readonly onRegenerate: () => void;
  readonly onSignUp: () => void;
  /**
   * `order` turns every card around: restaurants first, the recipe a small
   * link underneath. `cook` keeps the recipe and adds "buy it instead" below.
   */
  readonly mode: DecideMode;
  /** Null hides every Chowdeck section — there is nowhere to look. */
  readonly place: DecidePlace | null;
  /** False while the Chowdeck flag is off. */
  readonly showOffers: boolean;
}

function Fact({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-blade-xs border-hair border-line-2 bg-paper-2 px-2.5 py-1.5 text-xs font-bold text-ink-2">
      {icon}
      {children}
    </span>
  );
}

/** The bolded fact. Always arithmetic, never a guess. */
function hookLine(meal: DecideMeal, fastest: boolean): string {
  const { have, missing } = meal.match;
  const total = have.length + missing.length;
  if (total > 0 && missing.length === 0) return 'You have everything.';
  if (have.length > 0) return `You have ${String(have.length)} of ${String(total)}.`;
  if (missing.length <= 2) return `Only ${String(missing.length)} to buy.`;
  if (fastest) return 'Fastest of these.';
  return `${String(meal.cook_time_minutes)} minutes.`;
}

function StoryCard({
  meal,
  isWinner,
  aiFramed,
  fastest,
  isLast,
  onCook,
  onReject,
  mode,
  place,
  showOffers,
  active,
  onNext,
}: {
  meal: DecideMeal;
  isWinner: boolean;
  aiFramed: boolean;
  fastest: boolean;
  /** The last real suggestion, where "not feeling it" becomes worth offering. */
  isLast: boolean;
  onCook: () => void;
  onReject: () => void;
  mode: DecideMode;
  place: DecidePlace | null;
  showOffers: boolean;
  /** Only the card on screen asks Chowdeck anything. */
  active: boolean;
  onNext: (() => void) | undefined;
}) {
  const ordering = mode === 'order';
  const { have, missing, pantry } = meal.match;
  // In order mode the kitchen is set aside, so "0 of 7" would be a count of
  // nothing the person asked about.
  const total = ordering ? 0 : have.length + missing.length;

  const offers =
    showOffers && place !== null ? (
      <ChowdeckOffers
        mealSlug={meal.slug}
        mealName={meal.name}
        placeId={place.id}
        placeName={place.name}
        mode={mode}
        active={active}
        onNext={onNext}
      />
    ) : null;

  return (
    <article className="overflow-hidden rounded-blade-lg border-2 border-ink bg-white shadow-drop">
      <div className="relative grid min-h-[150px] place-items-center bg-dish-fill p-3">
        <span className="absolute left-2.5 top-2.5">
          {isWinner && aiFramed ? (
            <span className="inline-flex items-center gap-1 rounded-pill border-hair border-grape-border bg-grape-soft px-2 py-0.5 text-[10.5px] font-bold text-grape-onsoft">
              <Sparkles size={11} strokeWidth={3} />
              {DECIDE_COPY.verdict.chosen}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-pill border-hair border-line-2 bg-white px-2 py-0.5 text-[10.5px] font-bold text-ink-2">
              {isWinner ? DECIDE_COPY.verdict.nextBest : 'Also worth it'}
            </span>
          )}
        </span>

        {total > 0 && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center rounded-pill border-hair border-success-border bg-success-soft px-2 py-0.5 text-[10.5px] font-bold text-success-onsoft tnum">
            {have.length} of {total}
          </span>
        )}

        <img
          src={ILLUSTRATION.heroDish}
          alt=""
          width={150}
          height={112}
          draggable={false}
          className="mt-3 h-auto w-[150px] max-w-full select-none"
        />
      </div>

      <div className="p-4">
        <h2 className="font-display text-[22px] font-extrabold leading-[1.08] tracking-display text-ink">
          {meal.name}
        </h2>

        <p className="mt-1.5 text-[13px] font-extrabold text-success-onsoft">
          {ordering ? DECIDE_COPY.verdict.orderHook : hookLine(meal, fastest)}
        </p>
        <p className="mt-1 text-sm text-ink-2">{meal.why}</p>

        {/* Cook time and effort describe the COOK. Nobody is cooking in order
            mode, so the facts would be true and beside the point. */}
        {!ordering && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Fact icon={<Clock size={13} strokeWidth={2.4} className="text-ink-3" />}>
              {meal.cook_time_minutes} min
            </Fact>
            <Fact icon={null}>{meal.difficulty}</Fact>
            <Fact icon={<Users size={13} strokeWidth={2.4} className="text-ink-3" />}>
              Serves {meal.serves}
            </Fact>
          </div>
        )}

        {ordering && offers}

        {total > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-blade-xs border-hair border-success-border bg-success-soft p-2.5">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-label text-success-onsoft">
                <Check size={12} strokeWidth={3.4} />
                {DECIDE_COPY.verdict.have}
              </div>
              <ul className="m-0 list-none p-0 text-xs font-bold text-success-onsoft">
                {have.map((n) => <li key={n} className="py-px">{n}</li>)}
                {have.length === 0 && <li className="py-px opacity-70">nothing yet</li>}
              </ul>
            </div>

            <div className="rounded-blade-xs border-hair border-caution-border bg-caution-soft p-2.5">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-label text-caution-onsoft">
                <Plus size={12} strokeWidth={3.2} />
                {DECIDE_COPY.verdict.need}
              </div>
              <ul className="m-0 list-none p-0 text-xs font-bold text-caution-onsoft">
                {missing.map((n) => <li key={n} className="py-px">{n}</li>)}
                {missing.length === 0 && <li className="py-px opacity-70">nothing</li>}
              </ul>
            </div>
          </div>
        )}

        {!ordering && pantry.length > 0 && (
          <p className="mt-2.5 text-[11.5px] text-ink-3">
            <span className="font-bold text-ink-2">Also uses </span>
            {pantry.join(', ').toLowerCase()}
            <span className="text-ink-4"> (you probably have these)</span>
          </p>
        )}

        {/* The action belongs to THIS dish, so it sits with it rather than
            pinned to the window. On a carousel a fixed footer is ambiguous:
            it is not obvious which card it acts on. */}
        <div className="mt-4 flex flex-col gap-2">
          {/* In order mode the restaurants above ARE the action; the recipe
              stays one tap away for somebody who changes their mind. */}
          {ordering ? (
            <Button fullWidth variant="tertiary" onClick={onCook}>
              {DECIDE_COPY.verdict.cookInstead}
            </Button>
          ) : (
            <Button fullWidth size="lg" onClick={onCook}>
              {DECIDE_COPY.verdict.cook}
              <ArrowRight size={18} strokeWidth={2.6} className="ml-2" />
            </Button>
          )}

          {/* Only on the last one: while there are more to see, swiping is the
              obvious move, and offering to re-decide competes with it. */}
          {isLast && (
            <Button fullWidth variant="secondary" onClick={onReject}>
              <RotateCcw size={16} strokeWidth={2.4} className="mr-2" />
              {DECIDE_COPY.verdict.reject}
            </Button>
          )}
        </div>

        {/* Cook mode: the recipe is the answer, and buying it is the quiet
            alternative underneath — never above the button it competes with. */}
        {!ordering && offers}
      </div>
    </article>
  );
}

/**
 * The slide past the last suggestion.
 *
 * Reached by swiping on, which is a natural thing to do, and which previously
 * hit a wall. Rather than resisting, the carousel ends somewhere that explains
 * itself and offers the three things that can actually produce new results.
 */
function EndSlide({
  count,
  onChangeAnswer,
  onRestart,
  onRegenerate,
  onSignUp,
}: {
  count: number;
  onChangeAnswer: () => void;
  onRestart: () => void;
  onRegenerate: () => void;
  onSignUp: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-4 py-6">
      <div className="rounded-blade-lg border-2 border-ink bg-white p-5 text-center shadow-drop">
        <img
          src={ILLUSTRATION.thinkingPot}
          alt=""
          width={84}
          height={84}
          draggable={false}
          className="mx-auto h-auto w-[84px] select-none"
        />
        <h2 className="mt-3 font-display text-[21px] font-extrabold tracking-display text-ink">
          {DECIDE_COPY.endSlide.title}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[13.5px] text-ink-2">
          {DECIDE_COPY.endSlide.body(count)}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <Button fullWidth onClick={onChangeAnswer}>
            {DECIDE_COPY.endSlide.change}
          </Button>
          <Button fullWidth variant="secondary" onClick={onRegenerate}>
            <RotateCcw size={15} strokeWidth={2.4} className="mr-2" />
            {DECIDE_COPY.endSlide.regenerate}
          </Button>
          <Button fullWidth variant="tertiary" onClick={onRestart}>
            {DECIDE_COPY.endSlide.restart}
          </Button>
        </div>
      </div>

      <div className="rounded-blade border-2 border-ink bg-sky-soft p-4 shadow-drop-sm">
        <h3 className="font-display text-[16px] font-extrabold text-sky-900">
          {DECIDE_COPY.verdict.keepTitle}
        </h3>
        <p className="mb-3 mt-1 text-[12.5px] text-sky-800">{DECIDE_COPY.verdict.keepBody}</p>
        <Button fullWidth onClick={onSignUp}>
          {DECIDE_COPY.verdict.keepCta}
        </Button>
      </div>
    </div>
  );
}

export function VerdictStories({
  verdict,
  rejectedName,
  onCook,
  onReject,
  onChangeAnswer,
  onRestart,
  onRegenerate,
  onSignUp,
  mode,
  place,
  showOffers,
}: VerdictStoriesProps) {
  /**
   * The winner, then the rest, de-duplicated.
   *
   * `promote` and `rejectAndPromote` rebuild `pool` from every meal including
   * the new winner, so a naive concat shows the same dish twice: once as the
   * hero and again a slide later.
   */
  const meals = [verdict.verdict, ...verdict.pool].filter(
    (m, i, all) => all.findIndex((other) => other.meal_id === m.meal_id) === i,
  );
  /** The suggestions, plus one closing slide that explains the end. */
  const slideCount = meals.length + 1;
  const [index, setIndex] = useState(0);
  const region = useRef<HTMLDivElement>(null);

  // A rejection shortens the list, so an index past the end would render
  // nothing at all.
  const safeIndex = Math.min(index, slideCount - 1);
  const meal = meals[safeIndex];
  const onEndSlide = safeIndex === meals.length;

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, slideCount - 1));
  }, [slideCount]);

  const previous = useCallback(() => { setIndex((i) => Math.max(0, i - 1)); }, []);

  const canGoNext = safeIndex < slideCount - 1;
  const canGoPrevious = safeIndex > 0;

  const swipe = useSwipe({ onNext: next, onPrevious: previous, canGoNext, canGoPrevious });

  /**
   * Arrow keys, when the carousel has focus.
   *
   * A swipe is invisible to anybody on a keyboard, and the buttons below are
   * the other half of the same affordance.
   */
  useEffect(() => {
    const node = region.current;
    if (node === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); previous(); }
    };

    node.addEventListener('keydown', onKey);
    return () => { node.removeEventListener('keydown', onKey); };
  }, [next, previous]);

  const fastestTime = Math.min(...meals.map((m) => m.cook_time_minutes));

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col bg-paper">
      <header className="flex shrink-0 flex-col gap-2 px-4 pb-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-overline text-ink-3">
            {mode === 'order' ? DECIDE_COPY.verdict.orderEyebrow : DECIDE_COPY.verdict.eyebrow}
          </span>
          <span className="flex items-center gap-1">
            <Button variant="tertiary" size="sm" onClick={onChangeAnswer}>
              {DECIDE_COPY.verdict.change}
            </Button>
            <Button variant="tertiary" size="sm" onClick={onRestart}>
              {DECIDE_COPY.verdict.restart}
            </Button>
          </span>
        </div>

        {/* Story ticks. Paired with a readout, because progress must never be
            carried by width alone. */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {Array.from({ length: slideCount }, (_, i) => (
              <i
                key={i}
                className={[
                  'h-1 flex-1 rounded-pill transition-colors',
                  i === safeIndex ? 'bg-sky' : i < safeIndex ? 'bg-sky-edge' : 'bg-skeleton',
                ].join(' ')}
              />
            ))}
          </div>
          <span className="shrink-0 font-mono text-[10.5px] font-semibold text-ink-4 tnum">
            {onEndSlide ? 'end' : `${String(safeIndex + 1)} / ${String(meals.length)}`}
          </span>
        </div>
      </header>

      {rejectedName !== null && safeIndex === 0 && (
        <div className="mx-4 mb-2 flex shrink-0 gap-2.5 rounded-blade-xs border-hair border-success-border bg-success-soft px-3 py-2 text-[12.5px] text-success-onsoft">
          <Check size={16} strokeWidth={2.8} className="mt-0.5 shrink-0" />
          <span>
            <b className="block font-extrabold">{DECIDE_COPY.verdict.rejected(rejectedName)}</b>
            <span className="text-ink-3">{DECIDE_COPY.verdict.rejectedSub}</span>
          </span>
        </div>
      )}

      {/* ── The track ──────────────────────────────────────────────────
          Every slide is laid out side by side in one row that is N times the
          viewport wide, and the ROW moves. That is what makes the next card
          visibly come in from the edge as the current one leaves, instead of
          one being swapped for another with nothing in between.

          A sliver of the neighbour is always visible (the slide is slightly
          narrower than the viewport), which is what tells somebody there IS
          something to swipe to before they try. */}
      <div
        ref={region}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={
          onEndSlide
            ? "End of suggestions"
            : `Suggestion ${String(safeIndex + 1)} of ${String(meals.length)}: ${meal?.name ?? ""}`
        }
        className="min-h-0 flex-1 touch-pan-y overflow-hidden outline-none"
        {...swipe.bind}
      >
        <div
          className="flex h-full"
          style={{
            width: `${String(slideCount * 100)}%`,
            /**
             * The track sits at minus-one-slide per index, plus however far the
             * finger has dragged. Both in ONE transform, so there is no jump
             * between the drag ending and the snap starting.
             *
             * The step is `100 / slideCount` because a percentage translate
             * resolves against THIS element's width, and this element is
             * `slideCount` viewports wide. Using `meals.length` here (one fewer,
             * since the end slide is not a meal) moved the track by slightly
             * less than one slide each time, so cards drifted further
             * off-centre with every swipe and never snapped back.
             */
            transform: `translateX(calc(${String(-safeIndex * (100 / slideCount))}% + ${String(swipe.offset)}px))`,
            transition: swipe.dragging ? 'none' : 'transform 340ms var(--ease)',
          }}
        >
          {meals.map((m, i) => (
            <div
              key={m.meal_id}
              className="h-full touch-pan-y overflow-y-auto overscroll-contain px-4 pb-4"
              style={{ width: `${String(100 / slideCount)}%` }}
              aria-hidden={i !== safeIndex}
              // An off-screen slide must not be reachable by Tab, or focus
              // wanders into a card nobody can see.
              inert={i !== safeIndex}
            >
              <StoryCard
                meal={m}
                isWinner={i === 0}
                aiFramed={verdict.provenance === 'ai_framed'}
                fastest={m.cook_time_minutes === fastestTime}
                isLast={i === meals.length - 1}
                onCook={() => { onCook(m.meal_id); }}
                onReject={() => { onReject(m.meal_id); }}
                mode={mode}
                place={place}
                showOffers={showOffers}
                active={i === safeIndex}
                // The next card, or the closing slide after the last one.
                onNext={canGoNext ? next : undefined}
              />
            </div>
          ))}

          <div
            className="h-full touch-pan-y overflow-y-auto overscroll-contain px-4 pb-4"
            style={{ width: `${String(100 / slideCount)}%` }}
            aria-hidden={!onEndSlide}
            inert={!onEndSlide}
          >
            <EndSlide
              count={meals.length}
              onChangeAnswer={onChangeAnswer}
              onRestart={onRestart}
              onRegenerate={onRegenerate}
              onSignUp={onSignUp}
            />
          </div>
        </div>
      </div>

      {/* Only the navigation is pinned. The actions moved into the cards,
          because on a carousel a fixed button is ambiguous about which slide
          it acts on. */}
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t-hair border-line bg-paper px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={previous}
          disabled={!canGoPrevious}
          aria-label="Previous suggestion"
          className="grid h-11 w-11 place-items-center rounded-round border-2 border-ink bg-white text-ink shadow-drop-sm transition-opacity disabled:opacity-25"
        >
          <ChevronLeft size={20} strokeWidth={2.6} />
        </button>

        <span className="text-[11.5px] font-bold text-ink-3">
          {onEndSlide ? 'End of suggestions' : 'Swipe for more'}
        </span>

        <button
          type="button"
          onClick={next}
          disabled={!canGoNext}
          aria-label="Next suggestion"
          className="grid h-11 w-11 place-items-center rounded-round border-2 border-ink bg-white text-ink shadow-drop-sm transition-opacity disabled:opacity-25"
        >
          <ChevronRight size={20} strokeWidth={2.6} />
        </button>
      </footer>
    </div>
  );
}
