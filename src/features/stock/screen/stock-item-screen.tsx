import { useState } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { useSuggestions } from '@features/meals/hooks/use-meals';
import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { AppShell } from '@shared/ui-shell/app-shell';
import { PanelListSkeleton, ScreenState } from '@shared/ui-shell/screen-states';
import { Callout } from '@ui/feedback';
import { Select } from '@ui/inputs';
import { Button, IconButton } from '@ui/primitives';
import { Panel } from '@ui/structure';

import { useRemoveStock, useStock, useStockUnits, useUpdateStock } from '../hooks/use-stock';

const STORAGE_OPTIONS = [
  { value: 'fridge', label: 'Fridge' },
  { value: 'shelf', label: 'Shelf' },
  { value: 'freezer', label: 'Freezer' },
];

/**
 * One thing in the kitchen, in full.
 *
 * Also answers the question the list cannot: what can I actually make with
 * this? That is the difference between an inventory and a cooking app.
 */
export default function StockItemScreen() {
  const navigate = useNavigate();
  const { stockId } = useParams({ strict: false }) as { stockId: string };
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const stock = useStock();
  const suggestions = useSuggestions();
  const { data: customUnits = [] } = useStockUnits();
  const update = useUpdateStock();
  const remove = useRemoveStock();

  const item = stock.data?.find((entry) => entry.id === stockId);

  // Meals this ingredient appears in, so the page answers "what is this for?".
  const usedIn = (suggestions.data ?? []).filter((suggestion) =>
    suggestion.ingredients.some(
      (ingredient) => ingredient.name.toLowerCase() === (item?.name ?? '').toLowerCase(),
    ),
  );

  return (
    <AppShell
      inner
      title={item?.name ?? 'Loading'}
      active="stock"
      maxWidth="max-w-[640px]"
      onBack={() => {
        void navigate({ to: ROUTES.STOCK });
      }}
      backLabel="Stock"
    >
      <ScreenState
        isLoading={stock.isLoading}
        error={stock.error ?? null}
        onRetry={() => {
          void stock.refetch();
        }}
        what="this item"
        skeleton={<PanelListSkeleton count={2} lines={4} />}
      >
        <Show when={item === undefined}>
          <Callout
            tone="caution"
            title="That is not in your kitchen"
            body="It may have been used up or removed."
          />
        </Show>

        <Show when={item !== undefined}>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <KoboyoIcon name={(item?.icon ?? 'basket') as never} size={48} className="text-sky" alone />
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-display">{item?.name}</h2>
                <p className="font-mono text-xs text-ink-3">
                  added {item?.added_at.slice(0, 10)} · {item?.group}
                </p>
              </div>
            </div>

            <Show when={item?.freshness === 'soon'}>
              <Callout
                tone="caution"
                title={`About ${String(item?.days_left)} day${item?.days_left === 1 ? '' : 's'} left`}
                body="Worth cooking with this one soon."
              />
            </Show>
            <Show when={item?.freshness === 'past'}>
              <Callout
                tone="critical"
                title="Likely past its best"
                body="Based on when it was added and how long this usually keeps. Your eyes beat our maths — check it."
              />
            </Show>

            <Panel>
              <Panel.Header title="How much you have" />
              <Panel.Body>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-overline text-ink-3">
                      Amount
                    </label>
                    <div className="flex items-center gap-2">
                      <IconButton
                        icon="minus"
                        label="Less"
                        onClick={() => {
                          update.mutate({
                            stockId,
                            changes: { quantity: Math.max(0, (item?.quantity ?? 1) - 1) },
                          });
                        }}
                      />
                      <span className="w-16 text-center font-mono text-lg font-extrabold">
                        {item?.quantity}
                      </span>
                      <IconButton
                        icon="plus"
                        label="More"
                        onClick={() => {
                          update.mutate({ stockId, changes: { quantity: (item?.quantity ?? 0) + 1 } });
                        }}
                      />
                      <span className="ml-2 text-sm text-ink-2">{item?.unit}</span>
                    </div>
                  </div>

                  <Select
                    label="Measured in"
                    value={item?.unit}
                    onValueChange={(unit) => {
                      update.mutate({ stockId, changes: { unit } });
                    }}
                    options={[
                      ...['piece', 'kg', 'g', 'congo', 'derica', 'tin', 'bottle', 'bunch', 'l', 'ml'].map(
                        (unit) => ({ value: unit, label: unit }),
                      ),
                      ...customUnits.map((unit) => ({
                        value: unit.label,
                        label: `${unit.label} (yours)`,
                      })),
                    ]}
                  />

                  <Select
                    label="Kept in"
                    value={item?.storage}
                    onValueChange={(storage) => {
                      update.mutate({ stockId, changes: { storage } });
                    }}
                    options={STORAGE_OPTIONS}
                  />
                </div>
              </Panel.Body>
            </Panel>

            <Panel>
              <Panel.Header title="What you could make with it" />
              <Panel.Body>
                <Show when={usedIn.length === 0}>
                  <p className="text-sm text-ink-2">
                    Nothing in your suggestions uses this right now. Add a few more things and that
                    changes fast.
                  </p>
                </Show>

                <div className="flex flex-col gap-2">
                  <Repeat each={usedIn.slice(0, 5)}>
                    {(suggestion: NonNullable<typeof suggestions.data>[number]) => (
                      <button
                        key={suggestion.meal.id}
                        type="button"
                        onClick={() => {
                          void navigate({ to: ROUTES.MEAL(suggestion.meal.id) });
                        }}
                        className="flex items-center gap-3 rounded-blade-sm border border-line px-3 py-2 text-left hover:border-sky"
                      >
                        <KoboyoIcon
                          name={(suggestion.meal.hero_icon ?? 'plateFull') as never}
                          size={20}
                          alone
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold">
                            {suggestion.meal.name}
                          </span>
                          <span className="block text-xs text-ink-3">{suggestion.match_line}</span>
                        </span>
                      </button>
                    )}
                  </Repeat>
                </div>
              </Panel.Body>
            </Panel>

            <Panel>
              <Panel.Header title="Take it out of your kitchen" />
              <Panel.Body>
                <Show when={!confirmingDelete}>
                  <Button
                    variant="secondary"
                    destructive
                    onClick={() => {
                      setConfirmingDelete(true);
                    }}
                  >
                    Remove {item?.name}
                  </Button>
                </Show>

                <Show when={confirmingDelete}>
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-ink-2">
                      This removes it from your kitchen. It stays in your history.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        destructive
                        loading={remove.isPending}
                        onClick={() => {
                          remove.mutate(stockId, {
                            onSuccess: () => {
                              void navigate({ to: ROUTES.STOCK });
                            },
                          });
                        }}
                      >
                        Remove it
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setConfirmingDelete(false);
                        }}
                      >
                        Keep it
                      </Button>
                    </div>
                  </div>
                </Show>
              </Panel.Body>
            </Panel>
          </div>
        </Show>
      </ScreenState>
    </AppShell>
  );
}
