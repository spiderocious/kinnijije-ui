import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { useJob } from '@features/jobs/hooks/use-job';
import { EP } from '@shared/constants/endpoints';
import { ROUTES } from '@shared/constants/routes';
import { JOB_POLL_TIMEOUT_MS } from '@shared/constants/polling';
import { useStepParam } from '@shared/hooks/use-step-param';
import { apiClient } from '@shared/services/api-client';
import { AppShell } from '@shared/ui-shell/app-shell';
import { Callout, Progress } from '@ui/feedback';
import { Field, Input } from '@ui/inputs';
import { Button } from '@ui/primitives';

import { useAddStock, useCreateUnit, useStockUnits } from '../hooks/use-stock';
import { useStockDrafts } from '../hooks/use-stock-drafts';
import { AddMethodPicker, type AddMethod } from '../parts/add-method-picker';
import { DraftList } from '../parts/draft-list';
import { IngredientTypeahead } from '../parts/ingredient-typeahead';
import { PhotoCapture, type CheckedPhoto } from '../parts/photo-capture';
import { StockConfirm } from '../parts/stock-confirm';
import type { StockDraft } from '../types/stock.types';

const STAGES = ['method', 'entry', 'confirm'] as const;
type Stage = (typeof STAGES)[number];

const METHODS: AddMethod[] = ['manual', 'photo', 'receipt'];
const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/webp,image/heic';

interface ExtractNotes {
  summary?: string;
  assumptions?: string[];
  warnings?: string[];
  errors?: string[];
}

/**
 * The shared stock-entry flow.
 *
 * **Stage lives in the URL** (`?step=entry&method=photo`), so the browser back
 * button walks back through the flow rather than leaving it, and a refresh
 * keeps your place. Guards bounce anyone who lands on a stage the data cannot
 * support — a pasted `?step=confirm` with no drafts would otherwise render an
 * empty confirm screen with nothing to confirm.
 *
 * Exactly ONE primary action is visible at a time.
 */
export default function AddStockScreen() {
  const navigate = useNavigate();
  const { stage, params, go } = useStepParam<Stage>({ key: 'step', stages: STAGES });

  const rawMethod = params.get('method');
  const method: AddMethod = METHODS.includes(rawMethod as AddMethod)
    ? (rawMethod as AddMethod)
    : 'manual';

  const drafts = useStockDrafts();
  const addStock = useAddStock();
  const createUnit = useCreateUnit();
  const { data: customUnits = [] } = useStockUnits();

  const [photos, setPhotos] = useState<CheckedPhoto[]>([]);
  const [notes, setNotes] = useState<ExtractNotes>({});
  const [readJobId, setReadJobId] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [newUnit, setNewUnit] = useState({ label: '', abbr: '' });

  /**
   * The guards.
   *
   * Deep-linking to a stage whose data does not exist sends you back to where
   * that data is created, rather than showing an empty screen.
   */
  useEffect(() => {
    if (stage === 'confirm' && drafts.drafts.length === 0) {
      go('entry', { method });
      return;
    }
    if (stage === 'entry' && rawMethod === null) {
      go('method');
    }
  }, [stage, drafts.drafts.length, rawMethod, method, go]);

  const usablePhotos = photos.filter((photo) => photo.state === 'usable');
  const stillWorking = photos.some(
    (photo) => photo.state === 'uploading' || photo.state === 'checking',
  );

  /**
   * Watches the read to completion.
   *
   * The polling cadence lives in `useJob` — one backoff schedule shared with
   * every other watcher — rather than in a hand-rolled loop here, which is what
   * this screen used to do at a fixed 900ms.
   */
  const readJob = useJob(readJobId);
  const reading = readJobId !== null && readJob.data?.is_terminal !== true;
  const readProgress = readJob.data?.progress ?? 0;
  const readLabel = readJob.data?.progress_label ?? 'Reading…';

  // A finished read, handled once. Guarded on `readJobId` being cleared so a
  // re-render after `go()` cannot run the same result through twice.
  useEffect(() => {
    const job = readJob.data;
    if (readJobId === null || job === undefined || !job.is_terminal) return;

    setReadJobId(null);

    if (job.status !== 'succeeded') {
      setReadError(job.error ?? 'That read did not finish. You can type what you have instead.');
      return;
    }

    const result = job.result as { items?: unknown[]; notes?: ExtractNotes } | null;
    const items = (result?.items ?? []) as {
      catalogue_id: string | null;
      name: string;
      quantity: number;
      unit: string;
      confidence: number;
      recognised: boolean;
    }[];

    drafts.replaceAll(
      items.map((item, index) => ({
        key: `read-${String(index)}`,
        catalogue_id: item.catalogue_id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        units: [item.unit, 'kg', 'g', 'piece', 'congo', 'derica', 'bottle', 'bunch'].filter(
          (unit, i, all) => all.indexOf(unit) === i,
        ),
        icon: 'basket',
        confidence: item.confidence,
        recognised: item.recognised,
      })) as StockDraft[],
    );
    // A read that finds NOTHING must not advance. The confirm stage's own
    // guard would bounce straight back to entry, and on the way the photos
    // would look as though they had simply vanished — which is exactly what
    // it felt like. Stay put, keep the uploads, say what happened.
    if (items.length === 0) {
      const reason = result?.notes?.errors?.[0];
      setReadError(
        reason ??
          'We could not read anything in those. Try a clearer photo, or type what you have.',
      );
      return;
    }

    setNotes(result?.notes ?? {});
    go('confirm', { method });
    // `drafts` and `go` are stable enough for this to fire once per finished
    // job; adding them re-runs it on every draft edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readJob.data, readJobId, method]);

  // The read took too long. Owned by a plain timer rather than inferred from
  // React Query's fetch state — `useJob` stops polling at the timeout, and
  // reading "it stopped" out of `fetchStatus` would also match a browser that
  // simply paused a background tab.
  useEffect(() => {
    if (readJobId === null) return undefined;

    const timer = window.setTimeout(() => {
      setReadJobId(null);
      setReadError('That read did not finish. You can type what you have instead.');
    }, JOB_POLL_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [readJobId]);

  const startRead = async (): Promise<void> => {
    const fileIds = usablePhotos.flatMap((photo) => (photo.fileId === null ? [] : [photo.fileId]));
    if (fileIds.length === 0) return;

    setReadError(null);

    try {
      const endpoint = method === 'receipt' ? EP.EXTRACTION.RECEIPT : EP.EXTRACTION.PHOTOS;
      const job = await apiClient.post<{ id: string }>(endpoint, { file_ids: fileIds });
      setReadJobId(job.id);
    } catch (error) {
      setReadJobId(null);
      setReadError(error instanceof Error ? error.message : 'Could not start reading those.');
    }
  };

  const save = (): void => {
    addStock.mutate(
      {
        items: drafts.drafts.map((draft) => ({
          ...(draft.catalogue_id !== null && { catalogue_id: draft.catalogue_id }),
          name: draft.name,
          quantity: draft.quantity,
          unit: draft.unit,
        })),
        source: method === 'manual' ? 'manual' : method,
      },
      {
        onSuccess: () => {
          void navigate({ to: ROUTES.STOCK });
        },
      },
    );
  };

  const onPhotosChange = useCallback((next: CheckedPhoto[]) => {
    setPhotos(next);
  }, []);

  const recent = drafts.drafts.slice(-3).map((draft) => draft.name).reverse();

  /** Exactly one primary action, chosen by stage. */
  const dock = (() => {
    if (stage === 'method') return undefined;

    if (stage === 'entry' && method === 'manual') {
      return (
        <Button
          size="lg"
          fullWidth
          disabled={drafts.drafts.length === 0}
          onClick={() => {
            go('confirm', { method });
          }}
        >
          Done — check {drafts.drafts.length} thing{drafts.drafts.length === 1 ? '' : 's'}
        </Button>
      );
    }

    if (stage === 'entry') {
      // Nothing to proceed with until a photo exists — on phone this also keeps
      // the pinned dock from covering the empty picker.
      if (photos.length === 0) return undefined;

      return (
        <Button
          size="lg"
          fullWidth
          loading={reading}
          // Held until every photo has finished checking, so nobody reads a
          // batch that still has unknowns in it.
          disabled={usablePhotos.length === 0 || stillWorking}
          onClick={() => {
            void startRead();
          }}
        >
          {stillWorking
            ? 'Checking your photos…'
            : `Proceed (${String(usablePhotos.length)})`}
        </Button>
      );
    }

    return (
      <Button
        size="lg"
        fullWidth
        loading={addStock.isPending}
        disabled={drafts.drafts.length === 0}
        onClick={save}
      >
        Add to my kitchen
      </Button>
    );
  })();

  return (
    <AppShell
      title={stage === 'confirm' ? 'Check these' : 'Add to your kitchen'}
      active="stock"
      maxWidth="max-w-[640px]"
      inner
      {...(dock !== undefined && { dock })}
      onBack={() => {
        // Real history, so this and the browser back button agree.
        if (stage === 'method') void navigate({ to: ROUTES.STOCK });
        else window.history.back();
      }}
      backLabel={stage === 'method' ? 'Stock' : 'Back'}
    >
      <Show when={stage === 'method'}>
        <>
          <div data-tour="add-method">
            <AddMethodPicker
              onPick={(picked) => {
                go('entry', { method: picked });
              }}
            />
          </div>
        </>
      </Show>

      <Show when={stage === 'entry' && method === 'manual'}>
        <>
          <div data-tour="add-typeahead">
            <IngredientTypeahead
              onPick={drafts.addFromSuggestion}
              onCreate={drafts.addCustom}
              recent={recent}
              onPickRecent={drafts.addCustom}
            />
          </div>

          <Show when={drafts.drafts.length === 0}>
            <div className="mt-8 rounded-blade border border-dashed border-line py-12 text-center">
              <p className="font-display text-lg font-extrabold text-ink">Start typing</p>
              <p className="mt-1 text-sm text-ink-2">
                Suggestions appear as you go. Tap one to add it.
              </p>
            </div>
          </Show>

          {/* Real rows, not a count. */}
          <div data-tour="add-drafts">
            <DraftList drafts={drafts.drafts} onRemove={drafts.remove} />
          </div>

          {/* The dock is phone-only, so on desktop the action lives here —
              UNDER the list it acts on. A primary button above its own content
              reads as belonging to the page, and is pressed before the list is
              even read. */}
          <Show when={drafts.drafts.length > 0}>
            <div className="mt-5 hidden lg:block">{dock}</div>
          </Show>
        </>
      </Show>

      <Show when={stage === 'entry' && method !== 'manual'}>
        <>
          <p className="mb-4 text-sm text-ink-2">
            {method === 'receipt'
              ? 'Photograph your receipt. Each one is checked as it uploads.'
              : 'Photograph your shelf or fridge. Each photo is checked as it uploads.'}
          </p>

          <PhotoCapture
            max={5}
            accept={ACCEPTED_IMAGES}
            label={method === 'receipt' ? 'Add receipt' : 'Add photo'}
            kind={method === 'receipt' ? 'receipt' : 'shelf'}
            onChange={onPhotosChange}
          />

          {/* Below the photos, not above them: it acts on what is in the grid,
              and there is nothing to proceed with until something is there.
              Phone keeps it in the pinned dock. */}
          <Show when={photos.length > 0}>
            <div className="mt-5 hidden lg:block">{dock}</div>
          </Show>

          <Show when={reading}>
            <div className="mt-5">
              <Progress value={readProgress * 100} label={readLabel} />
            </div>
          </Show>

          <Show when={readError !== null}>
            <Callout tone="critical" title="That did not work" body={readError ?? ''} className="mt-5" />
          </Show>

          <Show when={photos.length > 0 && usablePhotos.length === 0 && !stillWorking}>
            <Callout
              tone="caution"
              title="None of those can be read"
              body="Try a clearer photo of a shelf or fridge — or add what you have by typing."
              className="mt-5"
            />
          </Show>
        </>
      </Show>

      <Show when={stage === 'confirm'}>
        <>
          <StockConfirm
            drafts={drafts.drafts}
            onChange={drafts.update}
            onRemove={drafts.remove}
            onAddUnit={() => {
              setUnitDialogOpen(true);
            }}
            customUnits={customUnits}
            notes={notes}
          />

          <Show when={unitDialogOpen}>
            <div className="mt-5 rounded-blade border border-line bg-white p-4">
              <p className="mb-3 text-sm font-extrabold">Add a unit of your own</p>
              <div className="flex flex-col gap-3">
                <Field label="What is it called?">
                  {({ id }) => (
                    <Input
                      id={id}
                      placeholder="mudu"
                      value={newUnit.label}
                      onChange={(event) => {
                        setNewUnit((unit) => ({ ...unit, label: event.target.value }));
                      }}
                    />
                  )}
                </Field>
                <Field label="Short form">
                  {({ id }) => (
                    <Input
                      id={id}
                      placeholder="mudu"
                      value={newUnit.abbr}
                      onChange={(event) => {
                        setNewUnit((unit) => ({ ...unit, abbr: event.target.value }));
                      }}
                    />
                  )}
                </Field>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    loading={createUnit.isPending}
                    disabled={newUnit.label.trim().length === 0}
                    onClick={() => {
                      createUnit.mutate(
                        {
                          label: newUnit.label.trim(),
                          abbr: newUnit.abbr.trim() || newUnit.label.trim(),
                        },
                        {
                          onSuccess: () => {
                            setNewUnit({ label: '', abbr: '' });
                            setUnitDialogOpen(false);
                          },
                        },
                      );
                    }}
                  >
                    Save unit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setUnitDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <Show when={createUnit.error !== null}>
                  <p className="text-sm text-critical-onsoft">{createUnit.error?.message}</p>
                </Show>
              </div>
            </div>
          </Show>

          {/* "Add to my kitchen" goes UNDER what it is confirming. */}
          <div className="mt-5 hidden lg:block">{dock}</div>
        </>
      </Show>
    </AppShell>
  );
}
