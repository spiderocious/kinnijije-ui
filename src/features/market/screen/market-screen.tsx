import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { IngredientTypeahead } from '@features/stock/parts/ingredient-typeahead';
import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { AppShell } from '@shared/ui-shell/app-shell';
import { PanelListSkeleton, ScreenError } from '@shared/ui-shell/screen-states';
import { Callout, EmptyState } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Panel } from '@ui/structure';

import {
  useAddMarketItem,
  useClearBought,
  useMarket,
  useRemoveMarketItem,
  useSetBought,
} from '../hooks/use-market';
import type { MarketItem } from '../services/market.api';

/**
 * The market list.
 *
 * Ticking something as bought moves it into the kitchen — that is the loop
 * closing, and it is why nobody has to count anything.
 */
export default function MarketScreen() {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const { data, isLoading, error, refetch } = useMarket();
  const addItem = useAddMarketItem();
  const setBought = useSetBought();
  const removeItem = useRemoveMarketItem();
  const clearBought = useClearBought();

  const items = data?.items ?? [];
  const pending = items.filter((item) => !item.bought);
  const bought = items.filter((item) => item.bought);

  const list = (
    <Panel>
      <Panel.Header
        title={`${String(items.length)} thing${items.length === 1 ? '' : 's'}`}
        action={
          <span className="font-mono text-sm text-ink-3">
            roughly ₦{(data?.estimated_total ?? 0).toLocaleString()}
          </span>
        }
      />
      <Panel.List>
        <Repeat each={[...pending, ...bought]}>
          {(item: MarketItem) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={item.bought}
                onChange={(event) => {
                  setBought.mutate({ marketId: item.id, bought: event.target.checked });
                }}
                aria-label={`${item.name} bought`}
                className="h-5 w-5 shrink-0 accent-sky"
              />

              <KoboyoIcon name={item.icon as never} size={22} alone />

              <span className="min-w-0 flex-1">
                <span
                  className={
                    item.bought
                      ? 'block truncate text-sm text-ink-3 line-through'
                      : 'block truncate text-sm font-extrabold text-ink'
                  }
                >
                  {item.name}
                </span>
                <span className="block text-xs text-ink-3">
                  {item.quantity} {item.unit}
                  {item.reason !== null ? ` · ${item.reason}` : ''}
                </span>
              </span>

              <Show when={item.estimated_cost !== null}>
                <span className="font-mono text-xs text-ink-3">
                  ₦{(item.estimated_cost ?? 0).toLocaleString()}
                </span>
              </Show>

              {/* Straight into the kitchen without ticking it bought — for
                  something they already have and just want counted. */}
              <button
                type="button"
                onClick={() => {
                  void navigate({
                    to: ROUTES.STOCK_ADD,
                    search: {
                      step: 'confirm',
                      method: 'manual',
                      prefill: item.name,
                      unit: item.unit,
                      qty: String(item.quantity),
                      ...(item.catalogue_id !== null && { catalogue: item.catalogue_id }),
                    } as never,
                  });
                }}
                aria-label={`Add ${item.name} to my kitchen`}
                className="text-ink-3 hover:text-sky-on"
              >
                <KoboyoIcon name="basket" size={18} alone />
              </button>

              <button
                type="button"
                onClick={() => {
                  removeItem.mutate(item.id);
                }}
                aria-label={`Remove ${item.name}`}
                className="text-ink-3 hover:text-critical-onsoft"
              >
                <KoboyoIcon name="trash" size={18} alone />
              </button>
            </div>
          )}
        </Repeat>
      </Panel.List>
    </Panel>
  );

  const unblocks = (
    <Show when={(data?.unblocks.length ?? 0) > 0}>
      <Callout
        tone="info"
        title="What these unblock"
        body={data?.unblocks
          .map((u) => `${u.meal_name} — needs ${u.needs.join(', ')}`)
          .join('. ')}
      />
    </Show>
  );

  const body = (
    <div data-tour="market-list">
      <Show when={isLoading}>
        <PanelListSkeleton count={1} lines={5} />
      </Show>

      <Show when={!isLoading && error !== null}>
        <ScreenError
          error={error}
          what="your market list"
          onRetry={() => {
            void refetch();
          }}
        />
      </Show>

      <Show when={!isLoading && error === null && items.length === 0}>
        {/* An empty market list is the GOOD outcome — nothing to buy. So it
            deliberately offers no call to action. */}
        <EmptyState
          art="shoppingBasket"
          title="Nothing to buy yet"
          body="Add what you are running out of and it will be here when you shop."
          action={{
            label: 'Add something',
            onClick: () => {
              setAdding(true);
            },
          }}
        />
      </Show>

      <Show when={items.length > 0}>{list}</Show>

      <Show when={adding}>
        {/* The action lives in the SAME card as the input it finishes —
            a button floating below an unrelated card reads as belonging to
            the page rather than to the thing being filled in. */}
        <div className="mt-4 rounded-blade border border-line bg-white p-4">
          <IngredientTypeahead
            onPick={(suggestion) => {
              addItem.mutate({
                name: suggestion.name,
                catalogue_id: suggestion.catalogue_id,
                unit: suggestion.default_unit,
              });
            }}
            onCreate={(name) => {
              addItem.mutate({ name });
            }}
            recent={[]}
            onPickRecent={(name) => {
              addItem.mutate({ name });
            }}
          />

          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setAdding(false);
            }}
          >
            Done
          </Button>
        </div>
      </Show>

      <Show when={!adding && !isLoading && items.length > 0}>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setAdding(true);
            }}
          >
            Add something
          </Button>

          <Show when={bought.length > 0}>
            <Button
              variant="secondary"
              loading={clearBought.isPending}
              onClick={() => {
                clearBought.mutate();
              }}
            >
              Clear {bought.length} bought
            </Button>
          </Show>
        </div>
      </Show>
    </div>
  );

  return (
    <AppShell title="Market list" active="market">
      {unblocks}
      <div className="mt-4">{body}</div>
    </AppShell>
  );
}
