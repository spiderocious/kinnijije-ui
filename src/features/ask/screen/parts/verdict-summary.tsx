import { Bookmark, Clock, Info, UtensilsCrossed, Users } from 'lucide-react';

import { ChowdeckOffers } from '@features/chowdeck/parts/chowdeck-offers';
import { ILLUSTRATION } from '@features/decide/content/decide.illustrations';
import type { DecideMeal, DecidePlace, DecideVerdict } from '@features/decide/types/decide.types';
import { KoboyoIcon, type KoboyoIconName } from '@ui/icons';

import { ASK_COPY } from '../../content/ask.content';

/**
 * The verdict, as a message.
 *
 * Built to docs/v2/decide-chat.html §09: a real card in the thread with its own
 * art panel, the facts as pills, what you have against what you need, and the
 * alternates as a horizontal strip rather than a full-bleed deck.
 *
 * The deck still exists behind "see all" — this is the summary, and it carries
 * enough that somebody can decide without opening anything.
 */
interface VerdictSummaryProps {
  readonly verdict: DecideVerdict;
  readonly onOpen: () => void;
  readonly onBookmark: () => void;
  readonly onPick: (mealId: string) => void;
  readonly saved: boolean;
  /** Where to look for offers. Null hides them entirely. */
  readonly place: DecidePlace | null;
  readonly showOffers: boolean;
}

/** One fact, as a bordered pill. Spec: 5px/9px, 11px, hairline border. */
function Fact({ icon, children }: { readonly icon: React.ReactNode; readonly children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[5px] rounded-blade-xs border-hair border-line-2 bg-paper-2 px-[9px] py-[5px] text-[11px] font-bold text-ink-2">
      <span className="text-ink-3">{icon}</span>
      {children}
    </span>
  );
}

/** The have / need pair. Green for what is in the kitchen, amber for what is not. */
function Box({
  tone,
  heading,
  items,
}: {
  readonly tone: 'have' | 'need';
  readonly heading: string;
  readonly items: string[];
}) {
  if (items.length === 0) return null;
  const have = tone === 'have';
  return (
    <div
      className={[
        'rounded-blade-xs border-hair p-2',
        have
          ? 'border-success-border bg-success-soft text-success-onsoft'
          : 'border-caution-border bg-caution-soft text-caution-onsoft',
      ].join(' ')}
    >
      <p className="m-0 mb-1 text-[9.5px] font-extrabold uppercase tracking-[.08em]">{heading}</p>
      <ul className="m-0 list-none p-0 text-[11.5px] font-bold leading-[1.5]">
        {/* Capped: four is enough to judge by, and a long list turns the card
            into a recipe rather than a decision. */}
        {items.slice(0, 4).map((item) => (
          <li key={item}>{item}</li>
        ))}
        {items.length > 4 && <li className="opacity-70">+{items.length - 4} more</li>}
      </ul>
    </div>
  );
}

export function VerdictSummary({
  verdict,
  onOpen,
  onBookmark,
  onPick,
  saved,
  place,
  showOffers,
}: VerdictSummaryProps) {
  const copy = ASK_COPY.summary;
  const leader = verdict.verdict;

  /**
   * The empty sentinel, which is NOT a meal.
   *
   * The service answers "nothing matched" with a placeholder carrying
   * `meal_id: ''`, a zero cook time and the name "Nothing quite fits". Treated
   * as a verdict it produced the nonsense "Nothing quite fits leads, 0 min.
   * Everything is in your kitchen."
   */
  if (leader.meal_id === '') {
    return (
      <div
        className="kj-bubble-in flex max-w-[84%] flex-col gap-2 self-start rounded-blade-sm border-2 border-ink bg-white px-[13px] py-[11px] shadow-drop-sm"
        style={{ animationDelay: '120ms' }}
      >
        <p className="m-0 font-display text-[15px] font-extrabold leading-tight text-ink">
          {copy.empty}
        </p>
        <p className="m-0 text-[13px] leading-[1.5] text-ink-2">{copy.emptyBody}</p>
      </div>
    );
  }

  const have = leader.match.have;
  const need = leader.match.missing;
  const alternates: DecideMeal[] = verdict.pool.filter((m) => m.meal_id !== leader.meal_id);
  const matchPercent = Math.round(leader.match.score * 100);

  return (
    <div className="flex flex-col gap-2.5 self-start" style={{ maxWidth: '92%' }}>
      <article
        className="kj-bubble-in overflow-hidden rounded-blade-sm border-2 border-ink bg-white shadow-drop"
        style={{ animationDelay: '120ms' }}
      >
        {/* The art panel. Sky-soft, with the dish's own glyph when it has one. */}
        <div className="grid place-items-center border-b-2 border-ink bg-sky-100 p-[14px]">
          {leader.hero_icon !== null ? (
            <KoboyoIcon name={leader.hero_icon as KoboyoIconName} size={54} className="text-ink" />
          ) : (
            <img src={ILLUSTRATION.heroDish} alt="" width={54} height={54} className="h-auto w-[54px]" />
          )}
        </div>

        <div className="p-[13px]">
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-[.14em] text-ink-3">
            {copy.eyebrow}
          </p>
          <h4 className="m-0 mt-0.5 font-display text-[20px] font-extrabold tracking-display text-ink">
            {leader.name}
          </h4>
          <p className="m-0 mt-1.5 text-[12.5px] leading-[1.5] text-ink-2">{leader.why}</p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Fact icon={<Clock size={11} strokeWidth={2.6} />}>{leader.cook_time_minutes} min</Fact>
            <Fact icon={<UtensilsCrossed size={11} strokeWidth={2.6} />}>{leader.difficulty}</Fact>
            <Fact icon={<Users size={11} strokeWidth={2.6} />}>Serves {leader.serves}</Fact>
            {matchPercent > 0 && (
              <span className="inline-flex items-center gap-[5px] rounded-blade-xs border-hair border-success-border bg-success-soft px-[9px] py-[5px] text-[11px] font-bold text-success-onsoft">
                {matchPercent}% match
              </span>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-[7px]">
            <Box tone="have" heading={copy.youHave} items={have} />
            <Box tone="need" heading={copy.youNeed} items={need} />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onOpen}
              className="flex-1 rounded-blade-xs border-2 border-ink bg-sky py-3 font-display text-[15px] font-extrabold text-white shadow-drop-sm transition-transform duration-fast active:scale-[.98]"
            >
              {copy.view}
            </button>

            {/* Shown to EVERY user. Hiding it from guests hides the reason to
                make an account. */}
            <button
              type="button"
              onClick={onBookmark}
              aria-label={saved ? ASK_COPY.bookmark.saved : ASK_COPY.bookmark.save}
              aria-pressed={saved}
              className={[
                'grid w-11 shrink-0 place-items-center rounded-blade-xs border-2 border-ink',
                'shadow-drop-sm transition-transform duration-fast active:scale-95',
                saved ? 'bg-ink text-white' : 'bg-white text-ink',
              ].join(' ')}
            >
              <Bookmark size={16} strokeWidth={2.6} {...(saved && { fill: 'currentColor' })} />
            </button>
          </div>
        </div>
      </article>

      {/*
        Chowdeck, on the summary itself.

        This lived only inside the swipe deck, which in Ask sits behind the
        "Cook this" button — so somebody looking at the verdict saw no offers
        at all unless they opened the deck first. The card IS the verdict here,
        so what is being sold nearby belongs on it.
      */}
      {showOffers && place !== null && (
        <ChowdeckOffers
          mealSlug={leader.slug}
          mealName={leader.name}
          placeId={place.id}
          placeName={place.name}
          mode="cook"
          active
        />
      )}

      {/* Provenance, on the system rail. Grape only when a model wrote the
          sentence — claimed falsely it would be worth nothing. */}
      <p className="m-0 flex items-center gap-1.5 font-mono text-[10.5px] font-semibold text-grape-onsoft">
        <Info size={11} strokeWidth={2.6} />
        {verdict.provenance === 'ai_framed' ? copy.framed : copy.deterministic}
        {alternates.length > 0 && <span className="text-ink-4">· {copy.more(alternates.length)}</span>}
      </p>

      {/* The alternates as a strip rather than a deck: same pool, same
          promote-on-tap, one less gesture to teach. */}
      {alternates.length > 0 && (
        <div className="rounded-blade-sm border-2 border-ink bg-white p-2.5 shadow-drop-sm">
          <p className="m-0 mb-2 text-[9.5px] font-extrabold uppercase tracking-[.08em] text-ink-3">
            {copy.orOneOfThese}
          </p>
          <div className="flex gap-[7px] overflow-x-auto pb-1">
            {alternates.map((meal) => (
              <button
                key={meal.meal_id}
                type="button"
                onClick={() => { onPick(meal.meal_id); }}
                className="w-[112px] flex-none rounded-blade-xs border-hair border-line-2 bg-white p-2 text-left transition-all duration-fast ease-kj-out hover:-translate-y-0.5 hover:border-ink hover:shadow-drop-sm"
              >
                <span className="block font-display text-[12px] font-extrabold leading-[1.2] text-ink">
                  {meal.name}
                </span>
                <span className="mt-[3px] block font-mono text-[9.5px] font-semibold text-ink-4">
                  {meal.cook_time_minutes} min · {Math.round(meal.match.score * 100)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
