import { Repeat, Show } from 'meemaw';

import { InfoCard, KpiCell, KpiStrip, MetricTile } from '@ui/admin';
import { Callout } from '@ui/feedback';

import { useOverview } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';

/** A `Record<string, number>` as rows, biggest first. */
function Breakdown({ counts }: { readonly counts: Record<string, number> }) {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <Show when={rows.length > 0}>
      <ul className="flex flex-col gap-1.5">
        <Repeat each={rows}>
          {([label, count]: [string, number]) => (
            <li key={label} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-mono text-ink-2">{label}</span>
              <span className="shrink-0 font-extrabold tabular-nums text-ink">{count}</span>
            </li>
          )}
        </Repeat>
      </ul>
    </Show>
  );
}

/**
 * Everything, at a glance.
 *
 * One request, every number real. A dashboard whose figures are sampled or
 * cached teaches an operator to distrust it, at which point it may as well not
 * exist.
 */
export default function AdminDashboardScreen() {
  const { data, isLoading, error } = useOverview();

  return (
    <ConsoleShell active="dashboard" title="Dashboard">
      <Show when={isLoading}>
        <div className="flex flex-col gap-4">
          <div aria-hidden="true" className="h-24 animate-shimmer rounded-blade bg-paper-2" />
          <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-paper-2" />
        </div>
      </Show>

      <Show when={error !== null}>
        <Callout tone="critical" title="Could not load this" body={error?.message} />
      </Show>

      <Show when={data !== undefined}>
        <div className="flex flex-col gap-5">
          {/* The figures worth waking up to. */}
          <KpiStrip>
            <KpiCell label="People" value={data?.users.total ?? 0} />
            <KpiCell label="New this week" value={data?.users.new_this_week ?? 0} />
            <KpiCell label="Recipes" value={data?.meals.published ?? 0} unit="published" />
            <KpiCell label="Cooked this week" value={data?.activity.cooked_this_week ?? 0} />
            <KpiCell
              label="AI calls"
              value={data?.ai.calls ?? 0}
              unit={`${String(data?.ai.failed ?? 0)} failed`}
              emphasis
            />
            <KpiCell label="Tokens" value={(data?.ai.total_tokens ?? 0).toLocaleString()} emphasis />
          </KpiStrip>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <InfoCard title="People">
              <div className="grid grid-cols-2 gap-3">
                <MetricTile label="Total" value={data?.users.total ?? 0} icon="contact" />
                <MetricTile label="Onboarded" value={data?.users.onboarded ?? 0} icon="tick" />
              </div>
              <p className="mt-4 mb-1.5 font-mono text-xs uppercase tracking-overline text-ink-3">
                by status
              </p>
              <Breakdown counts={data?.users.by_status ?? {}} />
              <p className="mt-4 mb-1.5 font-mono text-xs uppercase tracking-overline text-ink-3">
                by role
              </p>
              <Breakdown counts={data?.users.by_role ?? {}} />
            </InfoCard>

            <InfoCard title="Recipes">
              <div className="grid grid-cols-2 gap-3">
                <MetricTile label="Published" value={data?.meals.published ?? 0} icon="cookbook" />
                <MetricTile label="Draft" value={data?.meals.draft ?? 0} icon="editPencil" />
                <MetricTile label="Written by hand" value={data?.meals.seed ?? 0} icon="chefHat" />
                <MetricTile label="Generated" value={data?.meals.ai ?? 0} icon="robotForAi" />
              </div>
            </InfoCard>

            <InfoCard title="What people are doing">
              <div className="grid grid-cols-2 gap-3">
                <MetricTile
                  label="Cooked, all time"
                  value={data?.activity.cooked_all_time ?? 0}
                  icon="cookingPot"
                />
                <MetricTile label="Saved" value={data?.activity.favourites ?? 0} icon="bookmark" />
                <MetricTile
                  label="Chat messages"
                  value={data?.activity.chat_messages ?? 0}
                  icon="speechBubble"
                />
                <MetricTile
                  label="Of those, canned"
                  value={data?.activity.chat_mocked ?? 0}
                  icon="robotForAi"
                />
              </div>
              {/* Mock replies in the history are a testing artefact, not a
                  product signal — worth seeing so nobody reads them as real. */}
              <Show when={(data?.activity.chat_mocked ?? 0) > 0}>
                <p className="mt-3 text-xs text-caution-onsoft">
                  Some chat history came from the mock provider and never reached a model.
                </p>
              </Show>
            </InfoCard>

            <InfoCard title="Kitchens">
              <div className="grid grid-cols-2 gap-3">
                <MetricTile label="Stock rows" value={data?.kitchen.stock_items ?? 0} icon="shelf" />
                <MetricTile
                  label="On market lists"
                  value={data?.kitchen.market_unbought ?? 0}
                  icon="shoppingBasket"
                />
                <MetricTile label="Files" value={data?.kitchen.files ?? 0} icon="takingPhotoCamera" />
              </div>
            </InfoCard>

            <InfoCard
              title="Jobs"
              tone={(data?.jobs.failed_last_day ?? 0) > 0 ? 'caution' : 'default'}
            >
              <div className="grid grid-cols-2 gap-3">
                <MetricTile label="All time" value={data?.jobs.total ?? 0} icon="cycle" />
                <MetricTile
                  label="Failed today"
                  value={data?.jobs.failed_last_day ?? 0}
                  icon="error"
                />
              </div>
              <p className="mt-4 mb-1.5 font-mono text-xs uppercase tracking-overline text-ink-3">
                by status
              </p>
              <Breakdown counts={data?.jobs.by_status ?? {}} />
            </InfoCard>

            <InfoCard title="The model" tone={(data?.ai.failed ?? 0) > 0 ? 'caution' : 'default'}>
              <div className="grid grid-cols-2 gap-3">
                <MetricTile label="Calls" value={data?.ai.calls ?? 0} icon="robotForAi" />
                <MetricTile label="Last 24h" value={data?.ai.calls_last_day ?? 0} icon="eventTimeClock" />
                <MetricTile label="Rejected" value={data?.ai.failed ?? 0} icon="error" />
                <MetricTile
                  label="Avg time"
                  value={data?.ai.avg_duration_ms ?? 0}
                  unit="ms"
                  icon="alarmClock"
                />
              </div>
            </InfoCard>
          </div>

          <InfoCard title="Every prompt, by volume">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="py-2 font-mono text-xs uppercase tracking-overline text-ink-3">
                      prompt
                    </th>
                    <th className="py-2 text-right font-mono text-xs uppercase tracking-overline text-ink-3">
                      calls
                    </th>
                    <th className="py-2 text-right font-mono text-xs uppercase tracking-overline text-ink-3">
                      rejected
                    </th>
                    <th className="py-2 text-right font-mono text-xs uppercase tracking-overline text-ink-3">
                      tokens
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <Repeat each={data?.ai.by_prompt ?? []}>
                    {(row: { prompt_id: string; calls: number; failed: number; tokens: number }) => (
                      <tr key={row.prompt_id} className="border-b border-line/60">
                        <td className="py-2 font-mono text-xs text-ink">{row.prompt_id}</td>
                        <td className="py-2 text-right tabular-nums">{row.calls}</td>
                        <td
                          className={
                            row.failed > 0
                              ? 'py-2 text-right font-extrabold tabular-nums text-critical-onsoft'
                              : 'py-2 text-right tabular-nums text-ink-3'
                          }
                        >
                          {row.failed}
                        </td>
                        <td className="py-2 text-right tabular-nums text-ink-2">
                          {row.tokens.toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </Repeat>
                </tbody>
              </table>
            </div>
          </InfoCard>
        </div>
      </Show>
    </ConsoleShell>
  );
}
