import { useNavigate } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { AppShell } from '@shared/ui-shell/app-shell';
import { PanelListSkeleton, ScreenError, StatsSkeleton } from '@shared/ui-shell/screen-states';
import { cn } from '@shared/utils/cn';
import { EmptyState } from '@ui/feedback';
import { Stat } from '@ui/display';
import { Button } from '@ui/primitives';
import { Card, SectionHeader } from '@ui/structure';

import { useRefreshReading, useWeek } from '../hooks/use-week';

const TONE_STYLES: Record<string, string> = {
  positive: 'border-success-border bg-success-soft',
  watch: 'border-caution-border bg-caution-soft',
  neutral: 'border-line bg-white',
};

/**
 * Your week.
 *
 * Every number here is computed in code. The AI reading sits underneath as an
 * interpretation — never as the source of a figure.
 */
export default function WeekScreen() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useWeek();
  const refresh = useRefreshReading();

  if (!isLoading && (error !== null || data === undefined)) {
    return (
      <AppShell title="Your week" active="week">
        <ScreenError
          error={error}
          what="your week"
          onRetry={() => {
            void refetch();
          }}
        />
      </AppShell>
    );
  }

  if (isLoading || data === undefined) {
    return (
      <AppShell title="Your week" active="week">
        <StatsSkeleton />
        <div className="mt-6 grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} aria-hidden="true" className="h-16 animate-shimmer rounded-blade-sm bg-skeleton" />
          ))}
        </div>
        <div className="mt-6">
          <PanelListSkeleton count={2} lines={3} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Your week" active="week">
        {/* Under four meals we say nothing rather than stretch three into a
            pattern. */}
        <Show when={data.too_early}>
          <EmptyState
            art="calendarCircledDate"
            title="Too early to say anything useful"
            body={`You have logged ${String(data.total_meals)} meal${data.total_meals === 1 ? '' : 's'} this week. Cook a few more and there will be something worth noticing.`}
            action={{
              label: 'What should I cook?',
              onClick: () => {
                void navigate({ to: ROUTES.SUGGESTIONS });
              },
            }}
          />
        </Show>

        <Show when={!data.too_early}>
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Meals cooked" value={data.total_meals} weight="compact" />
              <Stat label="Different meals" value={data.distinct_meals} weight="compact" />
              <Stat label="Repeated" value={data.repeats.length} weight="compact" />
              <Stat label="Roughly spent" value={`₦${data.estimated_spend.toLocaleString()}`} weight="compact" />
            </div>

            <section className="mt-6">
              <SectionHeader title="Seven days" className="mb-3" />
              <div className="grid grid-cols-7 gap-2">
                <Repeat each={data.days}>
                  {(day: (typeof data.days)[number]) => (
                    <div
                      key={day.date}
                      className={cn(
                        'rounded-blade-sm border p-2 text-center',
                        day.meals.length > 0 ? 'border-sky bg-sky-soft' : 'border-line bg-white',
                      )}
                    >
                      <p className="font-mono text-[11px] text-ink-3">{day.label}</p>
                      <p className="mt-1 text-lg font-extrabold text-ink">{day.meals.length}</p>
                    </div>
                  )}
                </Repeat>
              </div>
            </section>

            <Show when={data.repeats.length > 0}>
              <section className="mt-6">
                <SectionHeader title="What you cooked most" className="mb-3" />
                <div className="flex flex-col gap-2">
                  <Repeat each={data.repeats}>
                    {(repeat: (typeof data.repeats)[number]) => (
                      <div
                        key={repeat.name}
                        className="flex items-center justify-between rounded-blade-sm border border-line bg-white px-3 py-2"
                      >
                        <span className="text-sm text-ink">{repeat.name}</span>
                        <span className="font-mono text-xs text-ink-3">{repeat.times}×</span>
                      </div>
                    )}
                  </Repeat>
                </div>
              </section>
            </Show>

            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <SectionHeader title="What we noticed" />
                <Button
                  variant="tertiary"
                  size="sm"
                  loading={refresh.isPending}
                  onClick={() => {
                    refresh.mutate();
                  }}
                >
                  Refresh
                </Button>
              </div>

              <Show when={data.reading === null}>
                <p className="text-sm text-ink-3">
                  Nothing read yet. Tap refresh and it will appear here shortly.
                </p>
              </Show>

              <Show when={data.reading !== null}>
                <>
                  <Show when={data.reading?.headline !== undefined}>
                    <p className="mb-3 font-display text-lg font-extrabold tracking-display">
                      {data.reading?.headline}
                    </p>
                  </Show>

                  <div className="flex flex-col gap-3">
                    <Repeat each={data.reading?.observations ?? []}>
                      {(observation: { kind: string; statement: string; evidence: string[]; tone: string }) => (
                        <Card
                          key={observation.statement}
                          variant="quiet"
                          className={cn('border', TONE_STYLES[observation.tone] ?? TONE_STYLES['neutral'])}
                        >
                          <p className="text-sm font-extrabold text-ink">{observation.statement}</p>
                          {/* An observation with no evidence is a guess. */}
                          <ul className="mt-2 flex flex-col gap-1">
                            <Repeat each={observation.evidence}>
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

                  <Show when={(data.reading?.suggestion ?? null) !== null}>
                    <Card variant="quiet" className="mt-3">
                      <p className="text-sm text-ink-2">{data.reading?.suggestion}</p>
                    </Card>
                  </Show>
                </>
              </Show>
            </section>
          </>
        </Show>

        {/* Only when there IS a week to read — when empty the call to action
            lives inside the empty state itself. */}
        <Show when={!data.too_early}>
          <Button
            variant="secondary"
            fullWidth
            className="mt-6"
            onClick={() => {
              void navigate({ to: ROUTES.SUGGESTIONS });
            }}
          >
            What should I cook?
          </Button>
        </Show>
    </AppShell>
  );
}
