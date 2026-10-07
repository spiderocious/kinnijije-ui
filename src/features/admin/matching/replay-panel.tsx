import { Show } from 'meemaw';

import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';

import { useReplayRule } from '../hooks/use-matching';

/**
 * Replay: what this rule would have done to yesterday's real traffic.
 *
 * The question a curator cannot answer any other way. Shadow mode measures a
 * rule going forward; replay measures it against traffic that has already
 * happened, which means an answer today rather than tomorrow.
 *
 * ONE HONEST LIMITATION, stated on screen rather than buried: weather is not
 * recorded on a decide log, so a rule with a weather clause will under-report.
 * Saying so is the difference between a number somebody can act on and one
 * that quietly misleads.
 */
export function ReplayPanel({
  ruleId,
  hasWeatherClause,
}: {
  readonly ruleId: string;
  readonly hasWeatherClause: boolean;
}) {
  const replay = useReplayRule();
  const result = replay.data;

  return (
    <InfoCard title="Replay against real traffic">
      <p className="mb-3 text-sm text-ink-2">
        Runs this rule against the last day of logged requests and reports what would have
        changed. Nothing is served and nothing is written.
      </p>

      <Button
        size="sm"
        loading={replay.isPending}
        onClick={() => {
          replay.mutate({ ruleId });
        }}
      >
        Run the replay
      </Button>

      <Show when={replay.error !== null}>
        <div className="mt-3">
          <Callout
            tone="critical"
            title="Could not replay"
            body={replay.error?.message ?? 'Something went wrong.'}
          />
        </div>
      </Show>

      <Show when={result !== undefined}>
        <div className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-blade-xs border border-line p-2">
              <p className="font-mono text-base font-extrabold text-ink">
                {result?.examined ?? 0}
              </p>
              <p className="text-xs text-ink-3">requests examined</p>
            </div>
            <div className="rounded-blade-xs border border-line p-2">
              <p className="font-mono text-base font-extrabold text-ink">{result?.matched ?? 0}</p>
              <p className="text-xs text-ink-3">this rule fitted</p>
            </div>
            <div className="rounded-blade-xs border border-ink bg-sky-100 p-2">
              <p className="font-mono text-base font-extrabold text-ink">{result?.changed ?? 0}</p>
              <p className="text-xs text-ink-3">answers changed</p>
            </div>
          </div>

          <Show when={(result?.matched ?? 0) === 0}>
            <Callout
              tone="info"
              title="This rule would not have fired at all"
              body="No logged request in the window fitted its conditions. Either the conditions are narrower than the traffic, or there was not much traffic."
            />
          </Show>

          {/* A rule that fires a lot but changes nothing is already what the
              ranker does, which is worth knowing before anybody reviews it. */}
          <Show when={(result?.matched ?? 0) > 0 && (result?.changed ?? 0) === 0}>
            <Callout
              tone="info"
              title="It would have agreed with the ranker every time"
              body="The rule fitted real requests but never changed the answer. It is not wrong, it is just not adding anything yet."
            />
          </Show>

          <Show when={(result?.alreadyCurated ?? 0) > 0}>
            <Callout
              tone="caution"
              title="Some of these were already decided by another rule"
              body={`${String(result?.alreadyCurated ?? 0)} of the matching requests were served by a rule already. Publishing this one means the two will compete, and the more specific wins.`}
            />
          </Show>

          <Show when={hasWeatherClause}>
            <Callout
              tone="caution"
              title="This rule mentions weather, so the replay under-reports"
              body="Weather is not recorded on a decide log, so a weather clause cannot match during a replay. The real reach is higher than the number above."
            />
          </Show>

          <Show when={(result?.sample.length ?? 0) > 0}>
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
                A sample of what would have changed
              </p>
              <div className="flex flex-col gap-1.5">
                {(result?.sample ?? []).slice().map((row, position) => (
                  <div
                    key={`${row.createdAt}-${String(position)}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-blade-xs border border-line px-2 py-1.5 text-xs"
                  >
                    <span className="font-mono text-ink-3">
                      {row.mood} · {row.weight} · {row.minutes}m
                      {row.branch !== null ? ` · ${row.branch}` : ''}
                    </span>
                    <span className="text-ink">
                      <Show
                        when={row.changed}
                        fallback={<span className="text-ink-3">no change</span>}
                      >
                        <span className="text-ink-3">{row.servedName ?? 'nothing'}</span>
                        <span className="mx-1 text-ink-4">to</span>
                        <span className="font-extrabold">{row.wouldServeMealId}</span>
                      </Show>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </InfoCard>
  );
}
