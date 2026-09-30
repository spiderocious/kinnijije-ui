import { useCallback, useMemo, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { cn } from '@shared/utils/cn';
import { formatDateTime } from '@shared/utils/format-date';
import { InfoCard } from '@ui/admin';
import { Checkbox } from '@ui/inputs';
import { Button } from '@ui/primitives';

import { ChowdeckError, ChowdeckShell, JobFollower } from '../chowdeck/chowdeck-parts';
import type { Coverage, CoverageCell, FetchAheadResult } from '../chowdeck/chowdeck.types';
import { useChowdeckCoverage, useFetchAhead, useInvalidateChowdeck } from '../chowdeck/use-chowdeck';

/**
 * A cell's colour says what a cook would get; its border says how old that is.
 *
 *   blank  never asked
 *   grey   asked, nobody sells it there
 *   amber  sold there, but nobody is open right now
 *   green  somebody is open and selling it now
 */
function cellClass(cell: CoverageCell): string {
  const state =
    cell.vendors === 0
      ? 'bg-paper-2 text-ink-3'
      : cell.open_now === 0
        ? 'bg-caution-soft text-caution-onsoft'
        : 'bg-success-soft text-success-onsoft';
  const age =
    cell.freshness === 'fresh'
      ? 'border-line-2'
      : cell.freshness === 'stale'
        ? 'border-dashed border-caution-border'
        : 'border-dashed border-ink-4 opacity-60';
  return cn(state, age);
}

/** A multi-pick where "nothing chosen" means "all of them", as the server reads it. */
function PickList({
  title,
  options,
  chosen,
  onChange,
}: {
  readonly title: string;
  readonly options: { value: string; label: string }[];
  readonly chosen: string[];
  readonly onChange: (next: string[]) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-overline text-ink-3">
          {title} · {chosen.length === 0 ? 'all' : `${String(chosen.length)} chosen`}
        </p>
        <Show when={chosen.length > 0}>
          <Button
            size="sm"
            variant="tertiary"
            onClick={() => {
              onChange([]);
            }}
          >
            All
          </Button>
        </Show>
      </div>
      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-blade-xs border border-line bg-white p-2">
        {options.map((option) => (
          <Checkbox
            key={option.value}
            checked={chosen.includes(option.value)}
            onCheckedChange={(checked) => {
              onChange(
                checked ? [...chosen, option.value] : chosen.filter((value) => value !== option.value),
              );
            }}
          >
            {option.label}
          </Checkbox>
        ))}
      </div>
    </div>
  );
}

/**
 * Filling the cache before anybody asks.
 *
 * Runs as a job, through the same guards as everything else — it cannot spend
 * more than the daily allowance, however much is selected.
 */
function FetchAheadPanel({ coverage }: { readonly coverage: Coverage | undefined }) {
  const fetchAhead = useFetchAhead();
  const invalidate = useInvalidateChowdeck();
  const [meals, setMeals] = useState<string[]>([]);
  const [places, setPlaces] = useState<string[]>([]);
  const [force, setForce] = useState(false);
  const [started, setStarted] = useState<FetchAheadResult | null>(null);

  const onDone = useCallback(() => {
    void invalidate();
  }, [invalidate]);

  const mealCount = meals.length === 0 ? (coverage?.meals.length ?? 0) : meals.length;
  const placeCount = places.length === 0 ? (coverage?.places.length ?? 0) : places.length;

  return (
    <InfoCard title="Fetch ahead">
      <ChowdeckError error={fetchAhead.error} title="The fetch did not start" className="mb-3" />

      <div className="flex flex-col gap-3 lg:flex-row">
        <PickList
          title="Meals"
          options={(coverage?.meals ?? []).map((m) => ({ value: m.slug, label: m.name }))}
          chosen={meals}
          onChange={setMeals}
        />
        <PickList
          title="Places"
          options={(coverage?.places ?? []).map((p) => ({
            value: p.id,
            label: p.city === null ? p.name : `${p.name} · ${p.city}`,
          }))}
          chosen={places}
          onChange={setPlaces}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Checkbox
          checked={force}
          onCheckedChange={(checked) => {
            setForce(checked);
          }}
        >
          Refetch even what is still fresh
        </Checkbox>
        <span className="text-xs text-ink-3">
          Up to {mealCount * placeCount} pairs
          {force ? '' : ' — fresh ones are skipped'}.
        </span>
        <Button
          size="sm"
          className="ml-auto"
          loading={fetchAhead.isPending}
          disabled={mealCount * placeCount === 0}
          onClick={() => {
            fetchAhead.mutate(
              { meal_slugs: meals, place_ids: places, force },
              {
                onSuccess: (result) => {
                  setStarted(result);
                },
              },
            );
          }}
        >
          Fetch ahead
        </Button>
      </div>

      <Show when={started !== null}>
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-ink-2">
            Queued {started?.pairs ?? 0} pairs.
            <Show when={started?.capped === true}>
              <span className="font-extrabold text-caution-onsoft">
                {' '}
                Capped — more matched than one run will fetch. Run it again once this finishes.
              </span>
            </Show>
          </p>
          <JobFollower jobId={started?.job_id ?? ''} onDone={onDone} />
        </div>
      </Show>
    </InfoCard>
  );
}

/**
 * Meals × places, from the cache alone. Nothing here calls Chowdeck.
 */
export default function AdminChowdeckCoverageScreen() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useChowdeckCoverage();

  const cells = useMemo(() => {
    const map = new Map<string, CoverageCell>();
    for (const cell of data?.cells ?? []) map.set(`${cell.meal_slug}|${cell.place_id}`, cell);
    return map;
  }, [data]);

  const asked = data?.cells.length ?? 0;
  const withOffers = (data?.cells ?? []).filter((c) => c.vendors > 0).length;
  const total = (data?.meals.length ?? 0) * (data?.places.length ?? 0);

  return (
    <ChowdeckShell section="coverage" title="Chowdeck · Coverage">
      <ChowdeckError error={error} title="Coverage did not load" />

      <div className="mb-5">
        <FetchAheadPanel coverage={data} />
      </div>

      <Show when={isLoading}>
        <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-skeleton" />
      </Show>

      <Show when={data !== undefined}>
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-ink-3">
          <span className="font-mono">
            {asked} of {total} asked · {withOffers} with offers
          </span>
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <span className="rounded-blade-xs border border-line-2 bg-white px-1.5">never asked</span>
            <span className="rounded-blade-xs border border-line-2 bg-paper-2 px-1.5">empty</span>
            <span className="rounded-blade-xs border border-line-2 bg-caution-soft px-1.5 text-caution-onsoft">
              none open now
            </span>
            <span className="rounded-blade-xs border border-line-2 bg-success-soft px-1.5 text-success-onsoft">
              open now
            </span>
            <span className="rounded-blade-xs border border-dashed border-caution-border px-1.5">stale</span>
            <span className="rounded-blade-xs border border-dashed border-ink-4 px-1.5 opacity-60">expired</span>
          </span>
        </div>

        <Show
          when={(data?.meals.length ?? 0) > 0 && (data?.places.length ?? 0) > 0}
          fallback={
            <p className="text-sm text-ink-3">
              Coverage needs at least one published meal and one active place.
            </p>
          }
        >
          <div className="overflow-auto rounded-blade border border-line bg-white">
            <table className="text-xs">
              <thead>
                <tr className="border-b border-line">
                  <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-mono uppercase tracking-overline text-ink-3">
                    Meal
                  </th>
                  {(data?.places ?? []).map((place) => (
                    <th key={place.id} className="px-1 py-2 align-bottom font-normal text-ink-2">
                      <span className="block max-w-[88px] truncate font-bold" title={place.name}>
                        {place.name}
                      </span>
                      <span className="block max-w-[88px] truncate text-[10px] text-ink-4">{place.city ?? ''}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.meals ?? []).map((meal) => (
                  <tr key={meal.slug} className="border-b border-line/60">
                    <td className="sticky left-0 z-10 max-w-[200px] truncate bg-white px-3 py-1.5 font-bold text-ink">
                      {meal.name}
                    </td>
                    {(data?.places ?? []).map((place) => {
                      const cell = cells.get(`${meal.slug}|${place.id}`);
                      return (
                        <td key={place.id} className="p-1 text-center">
                          {cell === undefined ? (
                            <span className="block h-7 min-w-[56px] rounded-blade-xs border border-line-2" />
                          ) : (
                            <button
                              type="button"
                              title={`${meal.name} · ${place.name}\n${String(cell.open_now)} open now, ${String(cell.later)} later, ${String(cell.vendors)} vendors\n${cell.freshness}, fetched ${formatDateTime(cell.fetched_at)}`}
                              onClick={() => {
                                void navigate({ to: ROUTES.ADMIN_CHOWDECK_CACHE_ENTRY(cell.id) });
                              }}
                              className={cn(
                                'block h-7 w-full min-w-[56px] rounded-blade-xs border font-mono tabular-nums transition hover:ring-2 hover:ring-sky',
                                cellClass(cell),
                              )}
                            >
                              {cell.vendors === 0 ? '0' : `${String(cell.open_now)}/${String(cell.vendors)}`}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Show>
      </Show>
    </ChowdeckShell>
  );
}
