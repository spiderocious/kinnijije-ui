import { Repeat, Show } from 'meemaw';

import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';

import { useAskOverview } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import {
  Chip,
  HeroKpi,
  ProportionBar,
  Section,
  StatRow,
  StatRows,
} from '../parts/dashboard-parts';

/** `1904` → `1.9s`. A latency nobody reads in milliseconds. */
function duration(ms: number | null): string {
  if (ms === null) return '—';
  return ms >= 1_000 ? `${(ms / 1_000).toFixed(1)}s` : `${String(ms)}ms`;
}

function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/**
 * Ask KinniJije, in the console.
 *
 * Two numbers here decide the feature's fate: **parse accuracy** and **voice
 * reliability**. Both are computed server-side from `ask_sessions` rather than
 * from browser events, because an ad blocker must not be able to hide a
 * regression — client analytics answer what people are doing, this answers
 * whether it works.
 *
 * Design: backend/docs/v2/ask-kinnijije-plan.html §12
 */
export default function AdminAskScreen() {
  const { data, isLoading, error } = useAskOverview();

  return (
    <ConsoleShell active="ask" title="Ask KinniJije">
      <Show when={isLoading}>
        <div className="flex flex-col gap-4">
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
              Every number is live, and computed on the server rather than from browser events.
            </p>

            {/* The parse accuracy alert. Below 85% the correction tax exceeds
                the taps saved — the criterion agreed before the build. */}
            <Show when={data.turns.parsed > 10 && percent(data.turns.parsed, data.turns.total) < 85}>
              <Callout
                tone="critical"
                title="Parse accuracy is below the agreed floor"
                body="Fewer than 85% of typed or spoken turns produced usable answers. Switch off ask_free_text until the prompt improves."
                className="mb-4"
              />
            </Show>

            <Show when={data.voice.attempted > 10 && percent(data.voice.failed, data.voice.attempted) > 20}>
              <Callout
                tone="caution"
                title="Transcription is failing often"
                body="More than a fifth of voice notes never produced text. Check the provider before investing further in voice."
                className="mb-4"
              />
            </Show>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <HeroKpi
                lead
                label="Conversations"
                value={data.sessions.total.toLocaleString()}
                trend={data.sessions.trend}
                points={data.sessions.daily}
                meta={<>{data.sessions.today} today</>}
              />
              <HeroKpi
                label="Reached a verdict"
                value={`${String(percent(data.sessions.completed, data.sessions.total))}%`}
                meta={<>{data.sessions.completed.toLocaleString()} of {data.sessions.total.toLocaleString()}</>}
              />
              <HeroKpi
                label="Parsed cleanly"
                value={`${String(percent(data.turns.parsed, data.turns.total))}%`}
                meta={<>{data.turns.failed} failed turns</>}
              />
              <HeroKpi
                compact
                tone="grape"
                label="Median confidence"
                value={data.turns.median_confidence === null ? '—' : `${String(data.turns.median_confidence)}%`}
                meta={<Chip tone="ai">{data.turns.total.toLocaleString()} turns</Chip>}
              />
            </div>

            <Section title="How people answer" hint="the reason voice and typing exist">
              <div className="grid gap-3.5 lg:grid-cols-3">
                <InfoCard className="lg:col-span-2" title="Input method">
                  <ProportionBar
                    segments={[
                      { label: 'tapped', value: data.input.tap, colour: 'var(--sky)' },
                      { label: 'typed', value: data.input.text, colour: 'var(--grape)' },
                      { label: 'spoke', value: data.input.voice, colour: 'var(--success)' },
                    ]}
                  />
                  <div className="mt-4">
                    <StatRows>
                      <StatRow
                        label="Tapped"
                        hint="always the fastest path"
                        value={data.input.tap.toLocaleString()}
                      />
                      <StatRow label="Typed" value={data.input.text.toLocaleString()} />
                      <StatRow label="Spoke" value={data.input.voice.toLocaleString()} />
                      <StatRow
                        label="Failed turns"
                        value={data.turns.failed.toLocaleString()}
                        tone={data.turns.failed > 0 ? 'critical' : 'default'}
                      />
                    </StatRows>
                  </div>
                </InfoCard>

                <InfoCard title="Voice" tone={data.voice.failed > 0 ? 'caution' : 'default'}>
                  <div className="font-display text-[32px] font-extrabold leading-none tracking-display tnum">
                    {data.voice.transcribed.toLocaleString()}
                  </div>
                  <p className="m-0 mt-1.5 text-[12.5px] text-ink-3">
                    transcribed of {data.voice.attempted.toLocaleString()} attempts
                  </p>
                  <div className="mt-3">
                    <StatRows>
                      <StatRow label="Median time" value={duration(data.voice.median_ms)} />
                      <StatRow label="p95" value={duration(data.voice.p95_ms)} />
                      <StatRow
                        label="Failed"
                        value={data.voice.failed.toLocaleString()}
                        tone={data.voice.failed > 0 ? 'critical' : 'default'}
                      />
                    </StatRows>
                  </div>
                </InfoCard>
              </div>
            </Section>

            <Section title="What people said" hint="constraints no tile can express">
              <div className="grid gap-3.5 lg:grid-cols-2">
                <InfoCard title="Notes carried">
                  <StatRows>
                    <StatRow
                      label="Conversations with notes"
                      hint="somebody said more than four answers' worth"
                      value={data.notes.sessions_with_notes.toLocaleString()}
                    />
                    <StatRow label="Notes in total" value={data.notes.total_notes.toLocaleString()} />
                  </StatRows>
                  <p className="m-0 mt-3 rounded-blade-xs bg-grape-soft px-3 py-2 text-[12px] text-grape-onsoft">
                    A note is something that is not an answer: "no pepper", "cooking for two". If
                    this stays near zero, speaking is buying nothing over tapping.
                  </p>
                </InfoCard>

                <InfoCard title="Most common notes">
                  <Show
                    when={data.notes.top.length > 0}
                    fallback={<p className="m-0 text-[13px] text-ink-3">Nothing recorded yet.</p>}
                  >
                    <StatRows>
                      <Repeat each={data.notes.top}>
                        {(row: { note: string; count: number }) => (
                          <StatRow key={row.note} label={row.note} value={String(row.count)} />
                        )}
                      </Repeat>
                    </StatRows>
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
