import { useCallback, useState } from 'react';

import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDate } from '@shared/utils/format-date';
import { InfoCard } from '@ui/admin';
import { Input, Switch } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import {
  CallStatusBadge,
  ChowdeckError,
  ChowdeckShell,
  InlineLink,
  JobFollower,
} from '../chowdeck/chowdeck-parts';
import type { PlaceRow, Prediction } from '../chowdeck/chowdeck.types';
import {
  useChowdeckPlaces,
  useDebounced,
  useDeletePlace,
  useImportPlaces,
  useInvalidateChowdeck,
  usePlaceAutocomplete,
  usePurgePlaces,
  useSavePlace,
  useUpdatePlace,
} from '../chowdeck/use-chowdeck';
import { DataTable, type Column } from '../parts/data-table';

/** "Lagos, Nigeria" → "Lagos". A guess to edit, never a rule. */
const guessCity = (secondary: string | null): string => secondary?.split(',')[0]?.trim() ?? '';

/** One autocomplete answer, with its own city box so several can be saved in turn. */
function PredictionRow({ prediction, searchedWith }: { readonly prediction: Prediction; readonly searchedWith: string }) {
  const save = useSavePlace();
  const [city, setCity] = useState(guessCity(prediction.secondary_text));
  const saved = prediction.saved || save.isSuccess;

  return (
    <li className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-ink">
          {prediction.main_text}
          <span className="font-normal text-ink-3"> {prediction.secondary_text ?? ''}</span>
        </p>
        <p className="truncate font-mono text-[10.5px] text-ink-4">
          {prediction.place_id} · {prediction.types.join(', ') || 'no types'}
        </p>
        <ChowdeckError error={save.error} title="Not saved" className="mt-1" />
      </div>

      <Show
        when={!saved}
        fallback={<Tag size="sm" tone="info">saved</Tag>}
      >
        <div className="flex shrink-0 items-center gap-2">
          <Input
            placeholder="City"
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
            }}
            className="w-[120px]"
          />
          <Button
            size="sm"
            loading={save.isPending}
            onClick={() => {
              save.mutate({
                place_id: prediction.place_id,
                description: prediction.description,
                main_text: prediction.main_text,
                secondary_text: prediction.secondary_text,
                types: prediction.types,
                city: city.trim().length > 0 ? city.trim() : null,
                searched_with: searchedWith,
              });
            }}
          >
            Save
          </Button>
        </div>
      </Show>
    </li>
  );
}

/**
 * Finding a new place on Chowdeck's side.
 *
 * Every lookup here is a real call against the daily allowance, so it waits
 * for the typing to stop, and never asks for anything shorter than two letters.
 */
function PlaceSearch() {
  const [input, setInput] = useState('');
  const settled = useDebounced(input, 500);
  const { data, isFetching, error } = usePlaceAutocomplete(settled);

  return (
    <InfoCard title="Add a place">
      <Input
        placeholder="Search Chowdeck for an area… (a live call)"
        value={input}
        loading={isFetching}
        onChange={(event) => {
          setInput(event.target.value);
        }}
      />

      <ChowdeckError error={error} title="The search failed" className="mt-3" />

      <Show when={data !== undefined && settled.trim().length >= 2}>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <CallStatusBadge status={data?.call.status ?? 'ok'} />
          <span>
            {data?.call.duration_ms ?? 0}ms
            {data?.call.refusal === null || data?.call.refusal === undefined ? '' : ` · refused: ${data.call.refusal}`}
          </span>
          <InlineLink to={ROUTES.ADMIN_CHOWDECK_REQUEST(data?.call.call_id ?? '')}>{data?.call.call_id}</InlineLink>
        </div>

        <Show
          when={(data?.predictions.length ?? 0) > 0}
          fallback={<p className="mt-2 text-sm text-ink-3">Nothing came back for that.</p>}
        >
          <ul className="mt-2 flex flex-col divide-y divide-line/60">
            {(data?.predictions ?? []).map((prediction) => (
              <PredictionRow key={prediction.place_id} prediction={prediction} searchedWith={settled.trim()} />
            ))}
          </ul>
        </Show>
      </Show>
    </InfoCard>
  );
}

/**
 * The places a cook can pick from.
 *
 * Kept on our side so a cook's location search never reaches Chowdeck. A
 * hidden place keeps its cache but is not offered.
 */
export default function AdminChowdeckPlacesScreen() {
  const { data, isLoading, error } = useChowdeckPlaces();
  const update = useUpdatePlace();
  const remove = useDeletePlace();
  const importPlaces = useImportPlaces();
  const invalidate = useInvalidateChowdeck();

  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCity, setDraftCity] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ name: string; cleared: number } | null>(null);
  const [confirmImport, setConfirmImport] = useState(false);
  const [importJob, setImportJob] = useState<string | null>(null);
  const purge = usePurgePlaces();
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [purgeWord, setPurgeWord] = useState('');
  const [purged, setPurged] = useState<{ places: number; cleared: number } | null>(null);

  const onImportDone = useCallback(() => {
    void invalidate();
  }, [invalidate]);

  const startEdit = (row: PlaceRow) => {
    setEditing(row.id);
    setDraftName(row.name);
    setDraftCity(row.city ?? '');
  };

  const columns: Column<PlaceRow>[] = [
    {
      key: 'name',
      header: 'Place',
      render: (row) => (
        <Show
          when={editing === row.id}
          fallback={
            <span className="flex flex-col">
              <span className="text-xs font-extrabold text-ink">{row.name}</span>
              <span className="max-w-[260px] truncate text-[11px] text-ink-3">{row.description}</span>
            </span>
          }
        >
          <Input
            value={draftName}
            aria-label="Name"
            onChange={(event) => {
              setDraftName(event.target.value);
            }}
            className="w-[160px]"
          />
        </Show>
      ),
    },
    {
      key: 'state',
      header: 'State',
      render: (row) => <span className="text-xs text-ink-2">{row.state ?? '—'}</span>,
    },
    {
      key: 'city',
      header: 'City',
      render: (row) => (
        <Show when={editing === row.id} fallback={<span className="text-xs text-ink-2">{row.city ?? '—'}</span>}>
          <Input
            value={draftCity}
            aria-label="City"
            onChange={(event) => {
              setDraftCity(event.target.value);
            }}
            className="w-[110px]"
          />
        </Show>
      ),
    },
    {
      key: 'active',
      header: 'Offered',
      render: (row) => (
        <Switch
          checked={row.active}
          hideLabel
          label={`Offer ${row.name} to cooks`}
          disabled={update.isPending}
          onCheckedChange={(active) => {
            update.mutate({ placeId: row.id, input: { active } });
          }}
        />
      ),
    },
    {
      key: 'cached',
      header: 'Cached',
      numeric: true,
      render: (row) => (
        <span className="font-mono text-xs">
          {row.cached_with_results}/{row.cached_searches}
        </span>
      ),
    },
    {
      key: 'searched',
      header: 'Found with',
      render: (row) => <span className="text-xs text-ink-3">{row.searched_with ?? '—'}</span>,
    },
    {
      key: 'added',
      header: 'Added',
      render: (row) => <span className="font-mono text-xs text-ink-3">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <span className="flex justify-end gap-1">
          <Show when={editing === row.id}>
            <Button
              size="sm"
              loading={update.isPending}
              disabled={draftName.trim().length === 0}
              onClick={() => {
                update.mutate(
                  {
                    placeId: row.id,
                    input: { name: draftName.trim(), city: draftCity.trim().length > 0 ? draftCity.trim() : null },
                  },
                  {
                    onSuccess: () => {
                      setEditing(null);
                    },
                  },
                );
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              onClick={() => {
                setEditing(null);
              }}
            >
              Cancel
            </Button>
          </Show>

          <Show when={editing !== row.id && deleting !== row.id}>
            <Button
              size="sm"
              variant="tertiary"
              onClick={() => {
                startEdit(row);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              destructive
              onClick={() => {
                setDeleting(row.id);
              }}
            >
              Delete
            </Button>
          </Show>

          {/* Two steps: its cached searches go with it. */}
          <Show when={deleting === row.id}>
            <span className="self-center text-xs font-extrabold text-caution-onsoft">
              Delete, with its {row.cached_searches} cached?
            </span>
            <Button
              size="sm"
              destructive
              loading={remove.isPending}
              onClick={() => {
                remove.mutate(row.id, {
                  onSuccess: (result) => {
                    setLastDeleted({ name: row.name, cleared: result.cleared });
                  },
                  onSettled: () => {
                    setDeleting(null);
                  },
                });
              }}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              onClick={() => {
                setDeleting(null);
              }}
            >
              No
            </Button>
          </Show>
        </span>
      ),
    },
  ];

  return (
    <ChowdeckShell
      section="places"
      title="Chowdeck · Places"
      actions={
        <span className="flex gap-2">
          <Show when={!confirmImport}>
            <Button
              size="sm"
              variant="secondary"
              disabled={data === undefined}
              onClick={() => {
                setConfirmImport(true);
              }}
            >
              Import default places
            </Button>
          </Show>
          <Show when={!confirmPurge}>
            <Button
              size="sm"
              variant="tertiary"
              destructive
              disabled={(data?.total ?? 0) === 0}
              onClick={() => {
                setPurged(null);
                setPurgeWord('');
                setConfirmPurge(true);
              }}
            >
              Delete all places
            </Button>
          </Show>
        </span>
      }
    >
      <ChowdeckError error={error} title="Places did not load" />
      <ChowdeckError error={update.error} title="That change did not save" />
      <ChowdeckError error={remove.error} title="Not deleted" />
      <ChowdeckError error={importPlaces.error} title="The import did not start" />
      <ChowdeckError error={purge.error} title="Nothing was deleted" />

      {/* Typed, not clicked: this empties the list every cook picks from, and
          the whole cache with it. A stray double-click must not do that. */}
      <Show when={confirmPurge}>
        <InfoCard title="Delete every place?" tone="caution" className="mb-4">
          <p className="text-sm">
            Deletes all {data?.total ?? 0} places and every cached search. Until places are imported
            again, cooks get the plain city field — no area picker, no &ldquo;I&rsquo;ll order&rdquo;.
            Type <b>delete</b> to confirm.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input
              value={purgeWord}
              aria-label="Type delete to confirm"
              placeholder="delete"
              onChange={(event) => {
                setPurgeWord(event.target.value);
              }}
              className="w-[140px]"
            />
            <Button
              size="sm"
              destructive
              loading={purge.isPending}
              disabled={purgeWord.trim().toLowerCase() !== 'delete'}
              onClick={() => {
                purge.mutate(undefined, {
                  onSuccess: (result) => {
                    setPurged(result);
                  },
                  onSettled: () => {
                    setConfirmPurge(false);
                    setPurgeWord('');
                  },
                });
              }}
            >
              Delete everything
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setConfirmPurge(false);
              }}
            >
              Keep them
            </Button>
          </div>
        </InfoCard>
      </Show>

      <Show when={purged !== null}>
        <p className="mb-4 text-xs font-extrabold text-success-onsoft">
          Deleted {purged?.places ?? 0} places and {purged?.cleared ?? 0} cached searches. Import the
          defaults to start again.
        </p>
      </Show>

      <Show when={confirmImport}>
        <InfoCard title="Import the default places?" tone="caution" className="mb-4">
          <p className="text-sm">
            Looks up {data?.seed_list_size ?? 0} towns on Chowdeck — one live call each, against
            today&rsquo;s allowance, at most 20 a minute. Places already saved are left as they are,
            and a town that comes back as one already saved is skipped.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              loading={importPlaces.isPending}
              onClick={() => {
                importPlaces.mutate(undefined, {
                  onSuccess: (result) => {
                    setImportJob(result.job_id);
                  },
                  onSettled: () => {
                    setConfirmImport(false);
                  },
                });
              }}
            >
              Yes, import
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setConfirmImport(false);
              }}
            >
              Wait
            </Button>
          </div>
        </InfoCard>
      </Show>

      <Show when={importJob !== null}>
        <div className="mb-4">
          <JobFollower jobId={importJob ?? ''} onDone={onImportDone} />
        </div>
      </Show>

      <Show when={lastDeleted !== null}>
        <p className="mb-4 text-xs font-extrabold text-success-onsoft">
          Deleted {lastDeleted?.name} — cleared {lastDeleted?.cleared ?? 0} cached search
          {lastDeleted?.cleared === 1 ? '' : 'es'}.
        </p>
      </Show>

      <div className="mb-5">
        <PlaceSearch />
      </div>

      <div className="mb-2 flex items-center">
        <Show when={data !== undefined}>
          <span className="ml-auto font-mono text-xs text-ink-3">
            {data?.items.filter((p) => p.active).length ?? 0} offered of {data?.total ?? 0}
          </span>
        </Show>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={columns}
        isLoading={isLoading}
        empty="No places yet. Search above, or import the defaults."
        rowKey={(row) => row.id}
      />
    </ChowdeckShell>
  );
}
