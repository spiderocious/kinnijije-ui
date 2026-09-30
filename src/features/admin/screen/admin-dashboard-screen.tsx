import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';

import { useOverview } from '../hooks/use-admin';
import { AttentionBand } from '../parts/attention-band';
import { ConsoleShell } from '../parts/console-shell';
import {
  Chip,
  HeroKpi,
  ProportionBar,
  Section,
  StatRow,
  StatRows,
} from '../parts/dashboard-parts';

/** `2,410,000` → `2.41M`. Seven digits in a KPI is a number nobody reads. */
function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return `${Math.round(value / 1_000).toLocaleString()}k`;
  return value.toLocaleString();
}

/** Milliseconds as seconds once it is past a second, where `1.9s` beats `1904ms`. */
function duration(ms: number): string {
  return ms >= 1_000 ? `${(ms / 1_000).toFixed(1)}s` : `${String(ms)}ms`;
}

/** A share of a whole, as a whole percent. Guards the empty case. */
function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/**
 * Everything, at a glance.
 *
 * One request, every number real. A dashboard whose figures are sampled or
 * cached teaches an operator to distrust it, at which point it may as well not
 * exist.
 *
 * Laid out by WEIGHT rather than as a flat grid. The old version gave forty
 * numbers identical priority across seven equal cards, which meant the
 * important ones — empty verdicts, failed jobs — were no more visible than the
 * count of uploaded files. Now: what needs you, then four figures, then the
 * flow, then the model, then everything else in deliberately quieter cards.
 *
 * Design: backend/docs/v2/admin-dashboard.html
 */
export default function AdminDashboardScreen() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useOverview();

  return (
    <ConsoleShell active="dashboard" title="Dashboard">
      <Show when={isLoading}>
        <div className="flex flex-col gap-4">
          <div aria-hidden="true" className="h-16 animate-shimmer rounded-blade bg-skeleton" />
          <div aria-hidden="true" className="h-28 animate-shimmer rounded-blade bg-skeleton" />
          <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-skeleton" />
        </div>
      </Show>

      <Show when={error !== null}>
        <Callout tone="critical" title="Could not load this" body={error?.message} />
      </Show>

      <Show when={data !== undefined}>
        {data !== undefined && (
          <div className="flex flex-col">
            <p className="m-0 mb-4 text-[13.5px] text-ink-3">
              Every number is live. Nothing here is sampled or cached.
            </p>

            {/* ── What needs you ──────────────────────────────────────── */}
            <AttentionBand data={data} />

            {/* ── The four figures ────────────────────────────────────── */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <HeroKpi
                lead
                label="Decisions"
                value={data.decide.decisions.toLocaleString()}
                trend={data.decide.trend}
                points={data.decide.daily}
                meta={
                  <>
                    {data.decide.today} today · {data.decide.distinct_visitors} people
                  </>
                }
              />
              <HeroKpi
                label="People"
                value={data.users.total.toLocaleString()}
                trend={data.users.trend}
                points={data.users.daily}
                meta={<>{data.users.onboarded} onboarded</>}
              />
              <HeroKpi
                label="Cooked this week"
                value={data.activity.cooked_this_week.toLocaleString()}
                trend={data.activity.cooked_trend}
                meta={<>{data.activity.cooked_all_time.toLocaleString()} all time</>}
              />
              <HeroKpi
                compact
                tone="grape"
                label="Model spend"
                value={compactNumber(data.ai.total_tokens)}
                meta={
                  <>
                    tokens · <Chip tone="ai">{data.ai.calls.toLocaleString()} calls</Chip>
                  </>
                }
              />
            </div>

            {/* ── The flow ────────────────────────────────────────────── */}
            <Section
              title="The decide flow"
              hint="the front door"
              action={
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    void navigate({ to: ROUTES.ADMIN_DECIDE });
                  }}
                >
                  Open
                </Button>
              }
            >
              <div className="grid gap-3.5 lg:grid-cols-3">
                <InfoCard
                  className="lg:col-span-2"
                  title={`What happened to ${data.decide.decisions.toLocaleString()} decisions`}
                  action={
                    data.decide.empty_today > 0 ? (
                      <Chip tone="warn">{data.decide.empty_today} empty today</Chip>
                    ) : undefined
                  }
                >
                  <ProportionBar
                    segments={[
                      {
                        label: 'written by the model',
                        value: data.decide.ai_framed,
                        colour: 'var(--grape)',
                      },
                      {
                        label: 'templated line',
                        value:
                          data.decide.decisions -
                          data.decide.ai_framed -
                          data.decide.empty_verdicts,
                        colour: 'var(--sky)',
                      },
                      {
                        label: 'nothing matched',
                        value: data.decide.empty_verdicts,
                        colour: 'var(--critical)',
                      },
                    ]}
                  />

                  <div className="mt-4">
                    <StatRows>
                      <StatRow
                        label="Reached a verdict"
                        hint="of every decision recorded"
                        value={`${String(
                          percent(
                            data.decide.decisions - data.decide.empty_verdicts,
                            data.decide.decisions,
                          ),
                        )}%`}
                      />
                      <StatRow
                        label="Distinct visitors"
                        hint="salted hashes, never an identity"
                        value={data.decide.distinct_visitors.toLocaleString()}
                      />
                      <StatRow
                        label="Saved to an account"
                        hint="decisions made while signed in"
                        value={data.decide.saved.toLocaleString()}
                      />
                      <StatRow
                        label="Refused a suggestion"
                        value={data.decide.rejected.toLocaleString()}
                      />
                    </StatRows>
                  </div>
                </InfoCard>

                <InfoCard
                  title="Nothing matched"
                  tone={data.decide.empty_today > 0 ? 'caution' : 'default'}
                >
                  <div className="font-display text-[32px] font-extrabold leading-none tracking-display text-critical-onsoft tnum">
                    {data.decide.empty_today}
                  </div>
                  <p className="m-0 mt-1.5 text-[12.5px] text-ink-3">
                    today, out of {data.decide.today}
                  </p>

                  <p className="m-0 mt-3 rounded-blade-xs bg-paper-2 px-3 py-2 text-[12px] text-ink-2">
                    The number to drive to zero. Each one is somebody who answered every
                    question and was told we had nothing.
                  </p>

                  <div className="mt-3">
                    <StatRows>
                      <StatRow
                        label="Yesterday"
                        value={data.decide.empty_yesterday.toLocaleString()}
                      />
                      <StatRow
                        label="All time"
                        value={data.decide.empty_verdicts.toLocaleString()}
                      />
                    </StatRows>
                  </div>
                </InfoCard>
              </div>
            </Section>

            {/* ── The model ───────────────────────────────────────────── */}
            <Section
              title="The model"
              hint="grape means a machine wrote it"
              action={
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    void navigate({ to: ROUTES.ADMIN_AI });
                  }}
                >
                  Open AI audit
                </Button>
              }
            >
              <div className="grid gap-3.5 lg:grid-cols-3">
                <InfoCard title="Calls" action={<Chip tone="ai">last 24h</Chip>}>
                  <div className="font-display text-[32px] font-extrabold leading-none tracking-display tnum">
                    {data.ai.calls_last_day.toLocaleString()}
                  </div>
                  <p className="m-0 mt-1.5 text-[12.5px] text-ink-3">
                    {data.ai.calls.toLocaleString()} all time
                  </p>
                  <div className="mt-3">
                    <StatRows>
                      <StatRow label="Median time" value={duration(data.ai.median_duration_ms)} />
                      <StatRow label="p95" value={duration(data.ai.p95_duration_ms)} />
                    </StatRows>
                  </div>
                </InfoCard>

                <InfoCard
                  title="Rejected replies"
                  tone={data.ai.failed > 0 ? 'caution' : 'default'}
                  action={<Chip tone={data.ai.failed > 0 ? 'warn' : 'good'}>
                    {percent(data.ai.failed, data.ai.calls)}%
                  </Chip>}
                >
                  <div className="font-display text-[32px] font-extrabold leading-none tracking-display text-caution-onsoft tnum">
                    {data.ai.failed.toLocaleString()}
                  </div>
                  <p className="m-0 mt-1.5 text-[12.5px] text-ink-3">
                    failed the envelope and were thrown away
                  </p>
                  <p className="m-0 mt-3 rounded-blade-xs bg-grape-soft px-3 py-2 text-[12px] text-grape-onsoft">
                    A rejected reply is never patched. We paid for the tokens and showed the
                    templated line instead, which is the honest fallback.
                  </p>
                </InfoCard>

                <InfoCard title="Tokens">
                  <div className="font-display text-[32px] font-extrabold leading-none tracking-display tnum">
                    {compactNumber(data.ai.total_tokens)}
                  </div>
                  <p className="m-0 mt-1.5 text-[12.5px] text-ink-3">all time, in and out</p>
                  <div className="mt-3">
                    <StatRows>
                      <StatRow label="Last 24h" value={compactNumber(data.ai.tokens_last_day)} />
                      <StatRow
                        label="Per call, median"
                        value={data.ai.median_tokens.toLocaleString()}
                      />
                    </StatRows>
                  </div>
                </InfoCard>
              </div>

              <div className="mt-3.5">
                <InfoCard
                  title="Every prompt, by volume"
                  action={<Chip>{data.ai.by_prompt.length} prompts</Chip>}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-[13px]">
                      <thead>
                        <tr className="border-b-hair border-line-2 text-left">
                          <th className="py-2 text-[10.5px] font-extrabold uppercase tracking-overline text-ink-3">
                            prompt
                          </th>
                          <th className="w-[96px] py-2 text-[10.5px] font-extrabold uppercase tracking-overline text-ink-3">
                            health
                          </th>
                          <th className="py-2 text-right text-[10.5px] font-extrabold uppercase tracking-overline text-ink-3">
                            calls
                          </th>
                          <th className="py-2 text-right text-[10.5px] font-extrabold uppercase tracking-overline text-ink-3">
                            rejected
                          </th>
                          <th className="py-2 text-right text-[10.5px] font-extrabold uppercase tracking-overline text-ink-3">
                            tokens
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <Repeat each={data.ai.by_prompt}>
                          {(row: {
                            prompt_id: string;
                            calls: number;
                            failed: number;
                            tokens: number;
                          }) => {
                            const health = 100 - percent(row.failed, row.calls);
                            return (
                              <tr key={row.prompt_id} className="border-b border-line last:border-b-0">
                                <td className="py-2.5 font-mono text-[11.5px] text-ink">
                                  {row.prompt_id}
                                </td>
                                <td className="py-2.5">
                                  {/* The rate, drawn. A column of small numbers
                                      is read one at a time; a row of bars is
                                      scanned in one pass. */}
                                  <span
                                    className="inline-block h-[5px] w-10 overflow-hidden rounded-pill bg-paper-3 align-middle"
                                    role="img"
                                    aria-label={`${String(health)}% accepted`}
                                  >
                                    <i
                                      className="block h-full"
                                      style={{
                                        width: `${String(health)}%`,
                                        background:
                                          health >= 95 ? 'var(--success)'
                                          : health >= 85 ? 'var(--caution)'
                                          : 'var(--critical)',
                                      }}
                                    />
                                  </span>
                                </td>
                                <td className="py-2.5 text-right tnum">
                                  {row.calls.toLocaleString()}
                                </td>
                                <td
                                  className={
                                    row.failed > 0
                                      ? 'py-2.5 text-right font-extrabold tnum text-critical-onsoft'
                                      : 'py-2.5 text-right tnum text-ink-4'
                                  }
                                >
                                  {row.failed}
                                </td>
                                <td className="py-2.5 text-right tnum text-ink-2">
                                  {compactNumber(row.tokens)}
                                </td>
                              </tr>
                            );
                          }}
                        </Repeat>
                      </tbody>
                    </table>
                  </div>
                </InfoCard>
              </div>
            </Section>

            {/* ── Everything else ─────────────────────────────────────── */}
            <Section title="Everything else" hint="reference, not alarms">
              <div className="grid gap-3.5 lg:grid-cols-2 xl:grid-cols-3">
                <InfoCard
                  title="People"
                  action={
                    <Chip tone="good">
                      {percent(data.users.onboarded, data.users.total)}% onboarded
                    </Chip>
                  }
                >
                  <ProportionBar
                    segments={[
                      {
                        label: 'finished setup',
                        value: data.users.onboarded,
                        colour: 'var(--success)',
                      },
                      {
                        label: 'did not',
                        value: data.users.total - data.users.onboarded,
                        colour: 'var(--line-2)',
                      },
                    ]}
                  />
                  <div className="mt-3.5">
                    <StatRows>
                      <Repeat each={Object.entries(data.users.by_status)}>
                        {([status, count]: [string, number]) => (
                          <StatRow key={status} label={status} value={count.toLocaleString()} />
                        )}
                      </Repeat>
                    </StatRows>
                  </div>
                </InfoCard>

                <InfoCard title="Recipes" action={<Chip>{data.meals.total} total</Chip>}>
                  <ProportionBar
                    segments={[
                      { label: 'published', value: data.meals.published, colour: 'var(--sky)' },
                      { label: 'draft', value: data.meals.draft, colour: 'var(--line-2)' },
                    ]}
                  />
                  <div className="mt-3.5">
                    <StatRows>
                      <StatRow label="Written by hand" value={data.meals.seed.toLocaleString()} />
                      <StatRow label="Generated" value={data.meals.ai.toLocaleString()} />
                      <StatRow label="With a photo" value={data.meals.with_photo.toLocaleString()} />
                    </StatRows>
                  </div>
                </InfoCard>

                <InfoCard title="Kitchens">
                  <StatRows>
                    <StatRow label="Stock rows" value={data.kitchen.stock_items.toLocaleString()} />
                    <StatRow
                      label="On market lists"
                      value={data.kitchen.market_unbought.toLocaleString()}
                    />
                    <StatRow label="Saved recipes" value={data.activity.favourites.toLocaleString()} />
                    <StatRow label="Uploaded files" value={data.kitchen.files.toLocaleString()} />
                  </StatRows>
                </InfoCard>

                <InfoCard
                  title="Jobs"
                  tone={data.jobs.failed_last_day > 0 ? 'caution' : 'default'}
                  action={
                    data.jobs.failed_last_day > 0 ? (
                      <Chip tone="bad">{data.jobs.failed_last_day} failed</Chip>
                    ) : undefined
                  }
                >
                  <StatRows>
                    <Repeat each={Object.entries(data.jobs.by_status)}>
                      {([status, count]: [string, number]) => (
                        <StatRow key={status} label={status} value={count.toLocaleString()} />
                      )}
                    </Repeat>
                    <StatRow
                      label="Failed, last 24h"
                      value={data.jobs.failed_last_day.toLocaleString()}
                      tone={data.jobs.failed_last_day > 0 ? 'critical' : 'default'}
                    />
                  </StatRows>
                </InfoCard>

                <InfoCard title="Chat">
                  <StatRows>
                    <StatRow
                      label="Messages"
                      value={data.activity.chat_messages.toLocaleString()}
                    />
                    <StatRow
                      label="Of those, canned"
                      hint="mock provider, never reached a model"
                      value={data.activity.chat_mocked.toLocaleString()}
                    />
                  </StatRows>
                  {/* Mock replies in the history are a testing artefact, not a
                      product signal — worth seeing so nobody reads them as real. */}
                  <Show when={data.activity.chat_mocked > 0}>
                    <p className="m-0 mt-3 rounded-blade-xs bg-paper-2 px-3 py-2 text-[12px] text-ink-2">
                      Some chat history came from the mock provider and never reached a model.
                    </p>
                  </Show>
                </InfoCard>
              </div>
            </Section>
          </div>
        )}
      </Show>
    </ConsoleShell>
  );
}
