import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { useMarket } from '@features/market/hooks/use-market';
import { useSuggestions } from '@features/meals/hooks/use-meals';
import { useStock, useStockDashboard } from '@features/stock/hooks/use-stock';
import { useWeek } from '@features/week/hooks/use-week';
import { useAddMarketItem } from '@features/market/hooks/use-market';
import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { AppShell } from '@shared/ui-shell/app-shell';
import { DashboardSkeleton, ScreenState } from '@shared/ui-shell/screen-states';
import { Stat } from '@ui/display';
import { Button } from '@ui/primitives';
import { Card, Panel } from '@ui/structure';

import { KitchenEmpty } from '../parts/kitchen-empty';
import { DashboardSection } from '../parts/dashboard-section';

/**
 * The kitchen dashboard — home for a signed-in cook.
 *
 * Every section is honest when it is empty rather than hidden: a person with a
 * bare kitchen should still see the shape of the app, and be told what would
 * fill each part of it.
 */
export default function KitchenScreen() {
  const navigate = useNavigate();

  const dashboard = useStockDashboard();
  const stock = useStock();
  const market = useMarket();
  const week = useWeek();
  const suggestions = useSuggestions();
  const addToMarket = useAddMarketItem();

  const counts = dashboard.data?.counts;
  const isEmpty = !dashboard.isLoading && (counts?.things_in ?? 0) === 0;

  if (isEmpty) return <KitchenEmpty />;

  const cookCta = (
    <Button
      data-tour="cook-cta"
      onClick={() => {
        void navigate({ to: ROUTES.SUGGESTIONS });
      }}
    >
      What should I cook?
    </Button>
  );

  return (
    <AppShell title="Your kitchen" active="kitchen" actions={cookCta}>
      <ScreenState
        isLoading={dashboard.isLoading}
        error={dashboard.error ?? null}
        onRetry={() => {
          void dashboard.refetch();
        }}
        what="your kitchen"
        skeleton={<DashboardSkeleton />}
      >
        <div className="flex flex-col gap-7">
          <div data-tour="stats">
            <p className="mb-3 font-mono text-xs text-ink-3">as it stands today</p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Things in" value={counts?.things_in ?? 0} weight="compact" />
              <Stat label="Running low" value={counts?.running_low ?? 0} weight="compact" />
              <Stat label="Use soon" value={counts?.use_soon ?? 0} weight="compact" />
              <Stat label="Could make" value={counts?.could_make ?? 0} weight="compact" />
            </div>
          </div>

          <div className="grid gap-7 lg:grid-cols-[1fr_340px]">
            <div className="flex flex-col gap-7">
              {/* Worth acting on, first — it is the only part of a dashboard
                  that asks anything of the person. */}
              <DashboardSection
                data-tour="attention"
                title="Worth doing something about"
                emptyIcon="tick"
                emptyTitle="Nothing running low"
                emptyBody="Your kitchen has what it needs."
                isEmpty={(dashboard.data?.running_low.length ?? 0) === 0}
              >
                <div className="flex flex-col gap-3">
                  <Repeat each={dashboard.data?.running_low ?? []}>
                    {(item: { name: string; reason: string; catalogue_id: string | null }) => (
                      <Card key={item.name} variant="quiet">
                        <div className="flex items-center gap-3">
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-extrabold text-ink">{item.name}</span>
                            <span className="block text-xs text-ink-2">{item.reason}</span>
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              addToMarket.mutate({
                                name: item.name,
                                ...(item.catalogue_id !== null && { catalogue_id: item.catalogue_id }),
                              });
                            }}
                          >
                            Add to list
                          </Button>
                        </div>
                      </Card>
                    )}
                  </Repeat>
                </div>
              </DashboardSection>

              <DashboardSection
                title="Use these first"
                emptyIcon="tick"
                emptyTitle="Nothing turning yet"
                emptyBody="Nothing in your kitchen is near its end."
                isEmpty={(dashboard.data?.use_first.length ?? 0) === 0}
              >
                <Panel>
                  <Panel.List>
                    <Repeat each={dashboard.data?.use_first ?? []}>
                      {(item: NonNullable<typeof dashboard.data>['use_first'][number]) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            void navigate({ to: ROUTES.STOCK_ITEM(item.id) });
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sky-soft"
                        >
                          <KoboyoIcon name={item.icon as never} size={22} alone />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-extrabold text-ink">
                              {item.name}
                            </span>
                            <span className="block text-xs text-caution-onsoft">
                              {item.days_left !== null && item.days_left >= 0
                                ? `about ${String(item.days_left)} day${item.days_left === 1 ? '' : 's'} left`
                                : 'likely past its best'}
                            </span>
                          </span>
                          <span className="font-mono text-xs text-ink-3">
                            {item.quantity} {item.unit}
                          </span>
                        </button>
                      )}
                    </Repeat>
                  </Panel.List>
                </Panel>
              </DashboardSection>

              <DashboardSection
                title="In your kitchen"
                action={
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => {
                      void navigate({ to: ROUTES.STOCK });
                    }}
                  >
                    View all
                  </Button>
                }
                emptyIcon="emptyBox"
                emptyTitle="Nothing added yet"
                emptyBody="Add a few things and suggestions get much better."
                emptyAction={{
                  label: 'Add to my kitchen',
                  onClick: () => {
                    void navigate({ to: ROUTES.STOCK_ADD });
                  },
                }}
                isEmpty={(stock.data?.length ?? 0) === 0}
              >
                <Panel>
                  <Panel.List>
                    <Repeat each={(stock.data ?? []).slice(0, 5)}>
                      {(item: NonNullable<typeof stock.data>[number]) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            void navigate({ to: ROUTES.STOCK_ITEM(item.id) });
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sky-soft"
                        >
                          <KoboyoIcon name={item.icon as never} size={22} alone />
                          <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-ink">
                            {item.name}
                          </span>
                          <span className="font-mono text-xs text-ink-3">
                            {item.quantity} {item.unit}
                          </span>
                        </button>
                      )}
                    </Repeat>
                  </Panel.List>
                </Panel>
              </DashboardSection>

              <DashboardSection
                title="Cooked this week"
                emptyIcon="cookingPot"
                emptyTitle="Nothing cooked yet"
                emptyBody="Cook something and it will show up here."
                emptyAction={{
                  label: 'Find something to cook',
                  onClick: () => {
                    void navigate({ to: ROUTES.SUGGESTIONS });
                  },
                }}
                isEmpty={(week.data?.total_meals ?? 0) === 0}
              >
                <div className="grid grid-cols-7 gap-2">
                  <Repeat each={week.data?.days ?? []}>
                    {(day: NonNullable<typeof week.data>['days'][number]) => (
                      <div
                        key={day.date}
                        className={
                          day.meals.length > 0
                            ? 'rounded-blade-sm border border-sky bg-sky-soft p-2 text-center'
                            : 'rounded-blade-sm border border-line bg-white p-2 text-center'
                        }
                        title={day.meals.join(', ')}
                      >
                        <p className="font-mono text-[11px] text-ink-3">{day.label}</p>
                        <p className="mt-1 text-lg font-extrabold text-ink">{day.meals.length}</p>
                      </div>
                    )}
                  </Repeat>
                </div>
              </DashboardSection>
            </div>

            <aside className="flex flex-col gap-7">
              <DashboardSection
                title="On your market list"
                action={
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => {
                      void navigate({ to: ROUTES.MARKET });
                    }}
                  >
                    Open
                  </Button>
                }
                emptyIcon="shoppingBasket"
                emptyTitle="Nothing to buy"
                emptyBody="Add what you are out of and it will be here."
                emptyAction={{
                  label: 'Start a list',
                  onClick: () => {
                    void navigate({ to: ROUTES.MARKET });
                  },
                }}
                isEmpty={(market.data?.items.length ?? 0) === 0}
              >
                <Card variant="quiet">
                  <ul className="flex flex-col gap-1.5">
                    <Repeat each={(market.data?.items ?? []).slice(0, 5)}>
                      {(item: NonNullable<typeof market.data>['items'][number]) => (
                        <li key={item.id} className="flex items-center gap-2 text-sm">
                          <KoboyoIcon name={item.icon as never} size={16} alone />
                          <span className={item.bought ? 'flex-1 truncate text-ink-3 line-through' : 'flex-1 truncate text-ink'}>
                            {item.name}
                          </span>
                        </li>
                      )}
                    </Repeat>
                  </ul>
                  <p className="mt-3 font-mono text-xs text-ink-3">
                    roughly ₦{(market.data?.estimated_total ?? 0).toLocaleString()}
                  </p>
                </Card>
              </DashboardSection>

              <DashboardSection
                title="Roughly spent"
                emptyIcon="purse"
                emptyTitle="Nothing tracked yet"
                emptyBody="Once you shop and cook, spending shows here."
                isEmpty={(week.data?.estimated_spend ?? 0) === 0}
              >
                <Card variant="quiet">
                  <p className="font-display text-2xl font-extrabold tracking-display">
                    ₦{(week.data?.estimated_spend ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-ink-3">
                    this week · an estimate from catalogue prices, not a bill
                  </p>
                </Card>
              </DashboardSection>

              <DashboardSection
                title="Noticed"
                emptyIcon="lightbulb"
                emptyTitle="Nothing to say yet"
                emptyBody="After about four meals there will be something worth noticing."
                isEmpty={(week.data?.reading?.observations?.length ?? 0) === 0}
              >
                <div className="flex flex-col gap-3">
                  <Repeat each={(week.data?.reading?.observations ?? []).slice(0, 2)}>
                    {(observation: { statement: string; evidence: string[] }) => (
                      <Card key={observation.statement} variant="quiet">
                        <p className="text-sm font-extrabold text-ink">{observation.statement}</p>
                        {/* An observation with no evidence is a guess. */}
                        <ul className="mt-2 flex flex-col gap-1">
                          <Repeat each={observation.evidence.slice(0, 3)}>
                            {(line: string) => (
                              <li key={line} className="font-mono text-[11px] text-ink-3">
                                {line}
                              </li>
                            )}
                          </Repeat>
                        </ul>
                      </Card>
                    )}
                  </Repeat>
                </div>
              </DashboardSection>

              <Show when={(suggestions.data?.length ?? 0) > 0}>
                <DashboardSection title="Closest to ready" isEmpty={false}>
                  <div className="flex flex-col gap-2">
                    <Repeat each={(suggestions.data ?? []).slice(0, 3)}>
                      {(suggestion: NonNullable<typeof suggestions.data>[number]) => (
                        <button
                          key={suggestion.meal.id}
                          type="button"
                          onClick={() => {
                            void navigate({ to: ROUTES.MEAL(suggestion.meal.id) });
                          }}
                          className="flex items-center gap-3 rounded-blade border border-line bg-white px-3 py-2.5 text-left hover:border-sky"
                        >
                          <KoboyoIcon
                            name={(suggestion.meal.hero_icon ?? 'plateFull') as never}
                            size={22}
                            alone
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-extrabold text-ink">
                              {suggestion.meal.name}
                            </span>
                            <span className="block text-xs text-ink-3">{suggestion.match_line}</span>
                          </span>
                        </button>
                      )}
                    </Repeat>
                  </div>
                </DashboardSection>
              </Show>
            </aside>
          </div>
        </div>
      </ScreenState>
    </AppShell>
  );
}
