import { useEffect, useRef } from 'react';
import { ArrowUpRight, Bike, Clock, Star, Store } from 'lucide-react';

import { EVENTS, analytics } from '@shared/services/analytics';

import { reportClick } from '../chowdeck.api';
import { ago, deliveryWindow, naira } from '../chowdeck.format';
import type { ChowdeckOffer, ChowdeckOffers as OffersData } from '../chowdeck.types';
import { useChowdeckOffers } from '../use-chowdeck';

/**
 * "Not cooking tonight? Buy it on Chowdeck."
 *
 * Two layouts, one component:
 *   row   — cook mode. A secondary option under the recipe: a short
 *           horizontal row that does not push the cooking answer off screen.
 *   list  — order mode. THE answer: a full-width stack, first card largest.
 *
 * Fetches only while `active` — the verdict is a carousel, and asking for all
 * six meals at once would be six calls where one is needed.
 *
 * Renders nothing at all when switched off, and in cook mode when there is
 * nothing to show: an empty "buy it" box under a recipe is noise. In order
 * mode an empty answer IS the answer, so it says so and offers the next meal.
 */
interface ChowdeckOffersProps {
  readonly mealSlug: string;
  readonly mealName: string;
  readonly placeId: string | null;
  readonly placeName: string | null;
  readonly mode: 'cook' | 'order';
  readonly active: boolean;
  /** Order mode only: move on when nobody nearby sells this one. */
  readonly onNext?: (() => void) | undefined;
}

const MAX_ROW = 3;
const MAX_LIST = 5;

export function ChowdeckOffers({
  mealSlug,
  mealName,
  placeId,
  placeName,
  mode,
  active,
  onNext,
}: ChowdeckOffersProps) {
  const { data, isLoading, isError } = useChowdeckOffers({ meal: mealSlug, place: placeId, mode }, active);

  useViewedOnce(data, active, mode);

  if (placeId === null) return null;
  if (data?.status === 'disabled') return null;

  const ordering = mode === 'order';

  if (isLoading) return <Frame ordering={ordering}><Skeleton ordering={ordering} /></Frame>;

  const nothing =
    isError || data === undefined || data.status === 'unavailable' || data.status === 'empty';

  if (nothing) {
    if (!ordering) return null;
    return (
      <Frame ordering>
        <div className="rounded-blade border-2 border-dashed border-line-2 bg-paper-2 p-4 text-center">
          <p className="font-display text-[15px] font-extrabold text-ink">
            {data?.status === 'empty' || data?.status === 'ok'
              ? `Nobody near ${placeName ?? 'you'} has ${mealName.toLowerCase()} right now`
              : 'Could not reach Chowdeck just now'}
          </p>
          <p className="mt-1 text-[12.5px] text-ink-3">
            {data?.status === 'empty'
              ? 'Try the next one. It might be closer to what is open.'
              : 'Give it a minute, or look at the next one.'}
          </p>
          {onNext !== undefined && (
            <button
              type="button"
              onClick={onNext}
              className="mt-3 rounded-pill border-2 border-ink bg-white px-4 py-2 text-[13px] font-extrabold text-ink shadow-drop-sm"
            >
              Show me the next one
            </button>
          )}
        </div>
      </Frame>
    );
  }

  const open = data.offers.slice(0, ordering ? MAX_LIST : MAX_ROW);
  const later = data.later.slice(0, ordering ? 3 : 2);

  return (
    <Frame ordering={ordering} fetchedAt={data.fetched_at}>
      {open.length > 0 ? (
        <div
          className={
            ordering
              ? 'flex flex-col gap-2.5'
              : // Bleeds to the card edge so the row reads as scrollable.
                '-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 ml-4'
          }
        >
          {open.map((offer, i) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              href={offer.store_url}
              layout={ordering ? (i === 0 ? 'lead' : 'list') : 'row'}
              onOpen={() => { trackClick(offer, i, mode, mealSlug, placeId, false); }}
            />
          ))}
        </div>
      ) : (
        <p className="text-[12.5px] text-ink-3">Nothing open right now. These open later today:</p>
      )}

      {later.length > 0 && (
        <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
          {later.map((offer, i) => (
            <li key={offer.id}>
              <a
                href={offer.store_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { trackClick(offer, open.length + i, mode, mealSlug, placeId, true); }}
                className="flex items-center gap-2 rounded-blade-xs border-hair border-line-2 bg-white px-3 py-2 text-[12.5px] text-ink-2 hover:border-ink"
              >
                <Clock size={13} strokeWidth={2.4} className="shrink-0 text-ink-4" />
                <span className="min-w-0 flex-1 truncate">
                  <b className="font-extrabold text-ink">{offer.vendor.name}</b> · {offer.product.name}
                </span>
                <span className="shrink-0 font-bold text-caution-onsoft">Opens {offer.vendor.opens_at}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  );
}

// ── Pieces ─────────────────────────────────────────────────────────────────

function Frame({
  ordering,
  fetchedAt,
  children,
}: {
  ordering: boolean;
  fetchedAt?: string | null;
  children: React.ReactNode;
}) {
  const updated = ago(fetchedAt ?? null);

  return (
    <section className={ordering ? 'mt-3' : 'mt-3 border-t-hair border-line pt-2.5'}>
      <div className={ordering ? 'mb-2.5' : 'mb-1.5'}>
        {/* One line in cook mode. A two-line heading over a strip of small
            cards made the label bigger than the thing it labels. */}
        <h3
          className={[
            'font-display font-extrabold leading-tight text-ink',
            ordering ? 'text-[16px]' : 'text-[12.5px] text-ink-3',
          ].join(' ')}
        >
          {ordering ? 'Order it on Chowdeck' : 'Or buy it on Chowdeck'}
        </h3>
      </div>

      {children}

      {/* Where the numbers came from, and how old they are. A cached price
          must never pass itself off as live. */}
      <p className={ordering ? 'mt-2 text-[11px] text-ink-4' : 'mt-1.5 text-[10px] text-ink-4'}>
        {updated !== null && ` · updated ${updated}`}
      </p>
    </section>
  );
}

function OfferCard({
  offer,
  href,
  layout,
  onOpen,
}: {
  offer: ChowdeckOffer;
  href: string;
  layout: 'row' | 'list' | 'lead';
  onOpen: () => void;
}) {
  const { vendor, product } = offer;
  const image = product.image_url ?? vendor.cover_url;
  const eta = deliveryWindow(vendor.delivery_minutes);

  /**
   * The `row` layout is COOK mode, where this is a footnote.
   *
   * Somebody who asked what to cook is being shown what they could buy
   * instead — useful, but secondary to the recipe above it. At 228px wide with
   * a 108px image it was competing with the verdict rather than sitting under
   * it, so it is now a compact strip: a thumbnail, a name, a price.
   *
   * `lead` and `list` are ORDER mode, where offers are the whole point, and
   * they keep their size.
   */
  const shell =
    layout === 'row'
      ? 'w-[150px] shrink-0 snap-start flex-col'
      : layout === 'lead'
        ? 'w-full flex-col'
        : 'w-full flex-row items-stretch';

  const imageBox =
    layout === 'row'
      ? 'h-[66px] w-full'
      : layout === 'lead'
        ? 'h-[150px] w-full'
        : 'w-[92px] shrink-0 self-stretch';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      className={[
        'group flex overflow-hidden rounded-blade border-2 border-ink bg-white text-left no-underline shadow-drop-sm',
        'transition-transform duration-fast ease-kj-out hover:-translate-y-px',
        shell,
      ].join(' ')}
    >
      <div className={['relative bg-dish-fill', imageBox].join(' ')}>
        {image !== null ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-4">
            <Store size={26} strokeWidth={2} />
          </div>
        )}
        {layout !== 'list' && (
          <span
            className={[
              'absolute rounded-pill border-2 border-ink bg-white font-display font-extrabold text-ink shadow-drop-sm tnum',
              layout === 'row'
                ? 'bottom-1 left-1 px-1.5 py-0 text-[10.5px]'
                : 'bottom-2 left-2 px-2 py-0.5 text-[13px]',
            ].join(' ')}
          >
            {naira(product.price_naira)}
          </span>
        )}
      </div>

      <div
        className={[
          'flex min-w-0 flex-1 flex-col',
          layout === 'row' ? 'gap-1 p-2.5' : 'gap-1.5 p-3',
        ].join(' ')}
      >
        <div className="flex min-w-0 items-start justify-between gap-2">
          <b
            className={[
              'font-display font-extrabold leading-tight text-ink',
              layout === 'row' ? 'line-clamp-1 text-[12px]' : 'line-clamp-2 text-[14.5px]',
            ].join(' ')}
          >
            {product.name}
          </b>
          {layout === 'list' && (
            <span className="shrink-0 font-display text-[14px] font-extrabold text-ink tnum">
              {naira(product.price_naira)}
            </span>
          )}
        </div>

        {/* No description in the compact strip: at 150px it is one truncated
            clause that tells nobody anything. */}
        {product.description !== null && layout !== 'row' && (
          <p className="line-clamp-1 text-[12px] text-ink-3">{product.description}</p>
        )}

        {/*
          COMPACT: who sells it, and how soon. Nothing else.

          The card previously carried the vendor logo, the vendor name, a
          rating, a review count, an ETA, a delivery fee and a "Buy on
          Chowdeck" link — seven things in 150px, which is a list rather than a
          card. The two that change a decision are WHO and WHEN; the rest is
          available one tap away on Chowdeck itself, where there is room for it.
        */}
        {layout === 'row' ? (
          <>
            <span className="truncate text-[10.5px] font-bold text-ink-2">{vendor.name}</span>
            {eta !== null && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-ink-4 tnum">
                <Clock size={10} strokeWidth={2.6} />
                {eta}
              </span>
            )}
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-1.5">
              {vendor.logo_url !== null ? (
                <img
                  src={vendor.logo_url}
                  alt=""
                  loading="lazy"
                  className="h-5 w-5 shrink-0 rounded-round border-hair border-line-2 object-cover"
                />
              ) : (
                <Store size={14} strokeWidth={2.4} className="shrink-0 text-ink-4" />
              )}
              <span className="truncate text-[12.5px] font-bold text-ink-2">{vendor.name}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] font-bold text-ink-3 tnum">
              {vendor.rating !== null ? (
                <span className="inline-flex items-center gap-0.5 text-ink-2">
                  <Star size={12} strokeWidth={2.4} className="fill-current text-caution-onsoft" />
                  {vendor.rating.toFixed(1)}
                  <span className="font-semibold text-ink-4">· {vendor.rating_count}</span>
                </span>
              ) : (
                <span className="text-ink-4">New</span>
              )}
              {eta !== null && (
                <span className="inline-flex items-center gap-0.5">
                  <Clock size={12} strokeWidth={2.4} />
                  {eta}
                </span>
              )}
              {vendor.delivery_fee_naira !== null && (
                <span className="inline-flex items-center gap-0.5">
                  <Bike size={12} strokeWidth={2.4} />
                  {naira(vendor.delivery_fee_naira)}
                </span>
              )}
            </div>

            <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[12px] font-extrabold text-sky-on group-hover:underline">
              Buy on Chowdeck
              <ArrowUpRight size={13} strokeWidth={2.8} />
            </span>
          </>
        )}
      </div>
    </a>
  );
}

function Skeleton({ ordering }: { ordering: boolean }) {
  return (
    <div className={ordering ? 'flex flex-col gap-2.5' : 'flex gap-2 overflow-hidden'} aria-hidden="true">
      {Array.from({ length: ordering ? 3 : 2 }, (_, i) => (
        <div
          key={i}
          className={[
            'animate-pulse rounded-blade border-2 border-line-2 bg-skeleton',
            ordering ? (i === 0 ? 'h-[250px] w-full' : 'h-[96px] w-full') : 'h-[132px] w-[150px] shrink-0',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ── Analytics ──────────────────────────────────────────────────────────────

/**
 * Two records of one tap, on purpose.
 *
 * `reportClick` goes to OUR server — the count shown in the console and the
 * one that goes in front of Chowdeck, which an ad blocker cannot stop. The
 * analytics event carries what only the page knows, for the product funnel.
 * Neither delays the link: both are fire-and-forget beside the navigation.
 */
function trackClick(
  offer: ChowdeckOffer,
  position: number,
  mode: 'cook' | 'order',
  mealSlug: string,
  placeId: string,
  opensLater: boolean,
): void {
  reportClick({
    vendorId: offer.vendor.id,
    productId: offer.product.id,
    meal: mealSlug,
    place: placeId,
    position,
    mode,
  });

  analytics.track(EVENTS.CHOWDECK_OFFER_CLICKED, {
    meal_slug: mealSlug,
    place_id: placeId,
    vendor_id: offer.vendor.id,
    product_id: offer.product.id,
    price_naira: offer.product.price_naira,
    position,
    mode,
    opens_later: opensLater,
  });
}

/**
 * One "seen" per meal, place and mode, and only once the answer is on screen.
 *
 * The server already counts what it SERVED; this is what a person actually
 * looked at, which is the denominator the click rate needs.
 */
function useViewedOnce(data: OffersData | undefined, active: boolean, mode: 'cook' | 'order'): void {
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (!active || data === undefined || data.status === 'disabled' || data.meal === null) return;
    const key = `${data.meal.slug}:${data.place?.id ?? ''}:${mode}`;
    if (sent.current === key) return;
    sent.current = key;

    analytics.track(EVENTS.CHOWDECK_OFFERS_VIEWED, {
      meal_slug: data.meal.slug,
      place_id: data.place?.id ?? null,
      mode,
      status: data.status,
      served_from: data.served_from,
      open_count: data.offers.length,
      later_count: data.later.length,
    });
  }, [data, active, mode]);
}
