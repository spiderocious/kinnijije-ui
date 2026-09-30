import { useState } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDateTime } from '@shared/utils/format-date';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button, Segmented } from '@ui/primitives';
import { Tag } from '@ui/status';

import {
  CacheStatusBadge,
  ChowdeckError,
  ChowdeckShell,
  FreshnessBadge,
  InlineLink,
  naira,
  nairaFromKobo,
  Row,
} from '../chowdeck/chowdeck-parts';
import type { OfferView, StoredVendor } from '../chowdeck/chowdeck.types';
import {
  useChowdeckCacheEntry,
  useClearCache,
  useRefreshCacheEntry,
} from '../chowdeck/use-chowdeck';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'default'];

/** "1830" → "18:30". Their hours arrive as HHMM strings, Lagos time. */
const clock = (hhmm: string | null) =>
  hhmm === null || hhmm.length < 4 ? '—' : `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;

/**
 * One offer, as the cook sees it: the dish first, the restaurant second.
 *
 * Deliberately plain rather than the consumer component — this is a check of
 * the DATA the app would render, and it must show every field, including the
 * ones the real card chooses to hide.
 */
function OfferCard({ offer, dim = false }: { readonly offer: OfferView; readonly dim?: boolean }) {
  const { vendor, product } = offer;

  return (
    <div className={`flex gap-3 rounded-blade-sm border border-line bg-white p-3 ${dim ? 'opacity-70' : ''}`}>
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-blade-xs bg-paper-2">
        <Show when={product.image_url !== null}>
          <img src={product.image_url ?? ''} alt="" className="h-full w-full object-cover" loading="lazy" />
        </Show>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-extrabold text-ink">{product.name}</p>
          <p className="shrink-0 font-mono text-sm font-extrabold text-ink">{naira(product.price_naira)}</p>
        </div>
        <Show when={product.description !== null}>
          <p className="line-clamp-2 text-xs text-ink-3">{product.description}</p>
        </Show>
        <Show when={product.price_description !== null}>
          <p className="text-[11px] text-ink-3">{product.price_description}</p>
        </Show>

        <div className="mt-1 flex items-center gap-2">
          <Show when={vendor.logo_url !== null}>
            <img src={vendor.logo_url ?? ''} alt="" className="h-5 w-5 rounded-pill object-cover" loading="lazy" />
          </Show>
          <span className="min-w-0 truncate text-xs font-bold text-ink">
            {vendor.name} <span className="font-normal text-ink-3">· {vendor.area}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-2">
          <span>
            {vendor.rating === null ? 'no rating' : `★ ${vendor.rating.toFixed(1)}`} · {vendor.rating_count}
          </span>
          <span>delivery {naira(vendor.delivery_fee_naira)}</span>
          <span>
            {vendor.delivery_minutes === null
              ? '— min'
              : `${String(vendor.delivery_minutes.min)}–${String(vendor.delivery_minutes.max)} min`}
          </span>
          <Show when={vendor.distance_km !== null}>
            <span>{vendor.distance_km?.toFixed(1)} km</span>
          </Show>
          <span
            className={
              vendor.open_now ? 'font-extrabold text-success-onsoft' : 'font-extrabold text-caution-onsoft'
            }
          >
            {vendor.open_now ? 'open' : vendor.opens_at === null ? 'closed' : `opens ${vendor.opens_at}`}
          </span>
          <Show when={product.more_count > 0}>
            <span className="text-ink-3">+{product.more_count} more here</span>
          </Show>
        </div>
      </div>
    </div>
  );
}

/** A stored vendor, whole: every product, its stock, and its hours. */
function VendorBlock({ vendor }: { readonly vendor: StoredVendor }) {
  const days = DAY_ORDER.filter((day) => vendor.hours[day] !== undefined);

  return (
    <div className="rounded-blade-sm border border-line bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Show when={vendor.logoUrl !== null}>
          <img src={vendor.logoUrl ?? ''} alt="" className="h-7 w-7 rounded-pill object-cover" loading="lazy" />
        </Show>
        <p className="text-sm font-extrabold text-ink">{vendor.name}</p>
        <span className="text-xs text-ink-3">{vendor.area}</span>
        <Show when={vendor.temporarilyUnavailable}>
          <Tag size="sm">unavailable{vendor.unavailableReason === null ? '' : `: ${vendor.unavailableReason}`}</Tag>
        </Show>
        <a
          href={vendor.store_url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto font-mono text-xs text-sky-on underline-offset-2 hover:underline"
        >
          Store ↗
        </a>
      </div>

      <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[11px] text-ink-3">
        <span>id {vendor.vendorId}</span>
        <span>
          {vendor.rating === null ? 'no rating' : `★ ${vendor.rating.toFixed(1)}`} · {vendor.ratingCount}
        </span>
        <span>fee {nairaFromKobo(vendor.deliveryFeeKobo)}</span>
        <span>
          {vendor.minDeliveryMinutes ?? '—'}–{vendor.maxDeliveryMinutes ?? '—'} min
        </span>
        <span>{vendor.distanceKm === null ? '— km' : `${vendor.distanceKm.toFixed(1)} km`}</span>
        <span>open at fetch: {vendor.openAtFetch === null ? '—' : vendor.openAtFetch ? 'yes' : 'no'}</span>
      </div>

      <Show when={days.length > 0}>
        <p className="mt-1 font-mono text-[10.5px] text-ink-4">
          {days
            .map((day) => {
              const h = vendor.hours[day];
              if (h === undefined) return '';
              return `${day.slice(0, 3)} ${h.isOpen ? `${clock(h.opening)}–${clock(h.closing)}` : 'closed'}`;
            })
            .join(' · ')}
        </p>
      </Show>

      <ul className="mt-2 flex flex-col divide-y divide-line/60">
        {vendor.products.map((product) => (
          <li key={product.productId} className="flex items-center gap-2 py-1.5 text-xs">
            <span className={`min-w-0 flex-1 truncate ${product.inStock ? 'text-ink' : 'text-ink-4 line-through'}`}>
              {product.name}
            </span>
            <span className={product.inStock ? 'text-success-onsoft' : 'font-extrabold text-critical-onsoft'}>
              {product.inStock ? 'in stock' : 'out of stock'}
            </span>
            <span className="w-20 shrink-0 text-right font-mono text-ink-2">{nairaFromKobo(product.priceKobo)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * One cached search, and exactly what a cook would be shown from it right now.
 *
 * "Right now" is computed on every load — opening hours are applied at read
 * time, so the same row shows different offers at 7am and at 7pm.
 */
export default function AdminChowdeckCacheDetailScreen() {
  const navigate = useNavigate();
  const { entryId } = useParams({ strict: false }) as { entryId: string };
  const { data, isLoading, error } = useChowdeckCacheEntry(entryId);
  const refresh = useRefreshCacheEntry();
  const clear = useClearCache();
  const [view, setView] = useState<'served' | 'stored'>('served');

  const served = data?.as_served_now;
  const outcome = refresh.data?.call;

  return (
    <ChowdeckShell
      section="cache"
      title={data === undefined ? 'Cached search' : `${data.query} · ${data.place_name ?? data.place_id}`}
      actions={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void navigate({ to: ROUTES.ADMIN_CHOWDECK_CACHE });
            }}
          >
            Back
          </Button>
          <Show when={data !== undefined}>
            <Button
              variant="secondary"
              size="sm"
              loading={clear.isPending}
              onClick={() => {
                clear.mutate(
                  { scope: 'entry', id: entryId },
                  {
                    onSuccess: () => {
                      void navigate({ to: ROUTES.ADMIN_CHOWDECK_CACHE });
                    },
                  },
                );
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              loading={refresh.isPending}
              onClick={() => {
                refresh.mutate(entryId);
              }}
            >
              Refresh now
            </Button>
          </Show>
        </>
      }
    >
      <ChowdeckError error={error} title="This cached search did not load" />
      <ChowdeckError error={refresh.error} title="Could not refresh" />
      <ChowdeckError error={clear.error} title="Could not clear" />

      <Show when={outcome !== undefined}>
        <Callout
          tone={outcome?.status === 'ok' ? 'success' : outcome?.status === 'refused' ? 'caution' : 'critical'}
          title={
            refresh.data?.updated === true
              ? 'Refreshed'
              : `Not refreshed: ${outcome?.status ?? ''}${outcome?.refusal === null || outcome?.refusal === undefined ? '' : ` (${outcome.refusal})`}`
          }
          body={
            <span className="flex flex-col gap-1">
              <span>
                {outcome?.http_status ?? 'no HTTP status'} in {outcome?.duration_ms ?? 0}ms
              </span>
              <Show when={outcome?.error !== null && outcome?.error !== undefined}>
                <span>{outcome?.error}</span>
              </Show>
              <span>
                <InlineLink to={ROUTES.ADMIN_CHOWDECK_REQUEST(outcome?.call_id ?? '')}>
                  Open {outcome?.call_id}
                </InlineLink>
              </span>
            </span>
          }
          className="mb-4"
        />
      </Show>

      <Show when={isLoading}>
        <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-skeleton" />
      </Show>

      <Show when={data !== undefined}>
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <InfoCard title="The row">
            <div className="mb-3 flex flex-wrap gap-1.5">
              <CacheStatusBadge status={data?.status ?? 'ok'} />
              <FreshnessBadge freshness={data?.freshness ?? 'fresh'} />
            </div>
            <Row label="id" value={data?.id ?? null} />
            <Row label="key" value={data?.key ?? null} />
            <Row label="place" value={data?.place_name ?? null} />
            <Row label="place id" value={data?.place_id ?? null} />
            <Row label="query" value={data?.query ?? null} />
            <Row label="meal" value={data?.meal_slug ?? null} />
            <Row label="fetched" value={formatDateTime(data?.fetched_at)} />
            <Row label="hits" value={data?.hits ?? 0} />
            <Row label="last served" value={formatDateTime(data?.last_served_at)} />
            <Row label="vendors" value={`${String(data?.vendors.length ?? 0)} kept of ${String(data?.raw_vendor_count ?? 0)}`} />
            <Row label="dropped" value={data?.dropped_vendor_count ?? 0} />
            <Row label="considered" value={served?.considered ?? 0} />
            <Row
              label="from call"
              value={
                data === undefined ? null : (
                  <InlineLink to={ROUTES.ADMIN_CHOWDECK_REQUEST(data.call_id)}>{data.call_id}</InlineLink>
                )
              }
            />

            <Show when={(data?.dropped_vendor_count ?? 0) > 0}>
              <p className="mt-3 text-xs font-extrabold text-critical-onsoft">
                Some vendors did not match our schema — their shape may have moved. The raw body
                is on the call.
              </p>
            </Show>
          </InfoCard>

          <InfoCard
            title={view === 'served' ? 'As served now' : 'As stored'}
            action={
              <Segmented
                value={view}
                onValueChange={(value) => {
                  setView(value === 'stored' ? 'stored' : 'served');
                }}
                label="Which view"
              >
                <Segmented.Item value="served">Served</Segmented.Item>
                <Segmented.Item value="stored">Stored</Segmented.Item>
              </Segmented>
            }
          >
            <Show when={view === 'served'}>
              <p className="mb-2 font-mono text-xs uppercase tracking-overline text-ink-3">
                open now · {served?.open.length ?? 0}
              </p>
              <Show
                when={(served?.open.length ?? 0) > 0}
                fallback={<p className="mb-4 text-sm text-ink-3">Nothing a cook could order right now.</p>}
              >
                <div className="mb-4 grid gap-2 xl:grid-cols-2">
                  {(served?.open ?? []).map((offer) => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>
              </Show>

              <p className="mb-2 font-mono text-xs uppercase tracking-overline text-ink-3">
                later today · {served?.later.length ?? 0}
              </p>
              <Show
                when={(served?.later.length ?? 0) > 0}
                fallback={<p className="text-sm text-ink-3">Nothing opening later today.</p>}
              >
                <div className="grid gap-2 xl:grid-cols-2">
                  {(served?.later ?? []).map((offer) => (
                    <OfferCard key={offer.id} offer={offer} dim />
                  ))}
                </div>
              </Show>
            </Show>

            <Show when={view === 'stored'}>
              <Show
                when={(data?.vendors.length ?? 0) > 0}
                fallback={<p className="text-sm text-ink-3">No vendors — Chowdeck had nobody selling this here.</p>}
              >
                <div className="flex flex-col gap-2">
                  {(data?.vendors ?? []).map((vendor) => (
                    <VendorBlock key={vendor.vendorId} vendor={vendor} />
                  ))}
                </div>
              </Show>
            </Show>
          </InfoCard>
        </div>
      </Show>
    </ChowdeckShell>
  );
}
