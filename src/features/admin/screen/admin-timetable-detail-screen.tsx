import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDate } from '@shared/utils/format-date';
import { InfoCard, MetricTile } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useTimetableDetail } from '../hooks/use-admin-timetables';
import { ConsoleShell } from '../parts/console-shell';

/**
 * One timetable, for support and debugging.
 *
 * Shows the plan, the kitchen it was built against, and the runway recomputed
 * from both — so "why did it tell them that" is answerable. Recomputed rather
 * than stored, so the console sees today's simulation applied to their inputs.
 *
 * Read-only. Opening this is audited.
 */

const STATUS_LABEL: Record<string, string> = {
  ok: 'enough',
  runs_out: 'runs out',
  missing: 'not in kitchen',
  unknown: 'could not work out',
};

export default function AdminTimetableDetailScreen() {
  const navigate = useNavigate();
  const { planId } = useParams({ strict: false }) as { planId?: string };
  const id = planId ?? '';

  const { data: plan, isLoading, error } = useTimetableDetail(id);

  return (
    <ConsoleShell
      active="timetables"
      title={plan === undefined ? 'Timetable' : `Week of ${plan.weekOf}`}
      actions={
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_TIMETABLES });
          }}
        >
          Back
        </Button>
      }
    >
      <Show when={isLoading}>
        <p className="text-sm text-ink-3">Loading…</p>
      </Show>

      <Show when={error !== null && !isLoading}>
        <Callout
          tone="critical"
          title="Could not load this plan"
          body={error?.message ?? 'Something went wrong.'}
        />
      </Show>

      <Show when={plan !== undefined}>
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricTile label="Days" value={plan?.days ?? 0} />
          <MetricTile label="Meals" value={plan?.meals ?? 0} />
          <MetricTile label="Cooking for" value={plan?.household ?? 0} />
          <MetricTile label="Kitchen items" value={plan?.kitchenSize ?? 0} />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Tag size="sm" tone={plan?.isGuest === true ? 'neutral' : 'info'}>
            {plan?.isGuest === true ? 'guest plan' : 'signed in'}
          </Tag>
          <span className="text-xs text-ink-3">
            Created {formatDate(plan?.createdAt ?? '')} · last changed{' '}
            {formatDate(plan?.updatedAt ?? '')}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-4">
            <InfoCard title="The plan">
              <div className="flex flex-col gap-2">
                {(plan?.plan ?? []).map((day) => (
                  <div
                    key={day.date}
                    className="rounded-blade-xs border border-line px-3 py-2"
                  >
                    <p className="font-mono text-xs text-ink-3">{day.date}</p>
                    <div className="mt-1 flex flex-col gap-0.5">
                      {day.meals.map((meal) => (
                        <p key={`${meal.slot}-${meal.mealId}`} className="text-sm text-ink">
                          <span className="font-mono text-xs uppercase text-ink-4">
                            {meal.slot}
                          </span>{' '}
                          {meal.mealName}
                        </p>
                      ))}
                      <Show when={day.meals.length === 0}>
                        <p className="text-sm text-ink-3">Nothing planned</p>
                      </Show>
                    </div>
                  </div>
                ))}
              </div>
            </InfoCard>

            <Show when={plan?.runway !== null && plan?.runway !== undefined}>
              <InfoCard title="What the runway said">
                {/* Two up on a phone: four 80px tiles at 390px wide leaves
                    no room for the numbers they exist to show. */}
                <div className="mb-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                  <div className="rounded-blade-xs border border-line p-2">
                    <p className="font-mono text-sm font-extrabold text-ink">
                      {plan?.runway?.summary.linesChecked ?? 0}
                    </p>
                    <p className="text-xs text-ink-3">checked</p>
                  </div>
                  <div className="rounded-blade-xs border border-success-border bg-success-soft p-2">
                    <p className="font-mono text-sm font-extrabold text-ink">
                      {plan?.runway?.summary.ok ?? 0}
                    </p>
                    <p className="text-xs text-ink-3">enough</p>
                  </div>
                  <div className="rounded-blade-xs border border-caution-border bg-caution-soft p-2">
                    <p className="font-mono text-sm font-extrabold text-ink">
                      {plan?.runway?.summary.short ?? 0}
                    </p>
                    <p className="text-xs text-ink-3">short</p>
                  </div>
                  <div className="rounded-blade-xs border border-line bg-paper-2 p-2">
                    <p className="font-mono text-sm font-extrabold text-ink">
                      {plan?.runway?.summary.unknown ?? 0}
                    </p>
                    <p className="text-xs text-ink-3">unknown</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {(plan?.runway?.lines ?? [])
                    .filter((line) => line.status !== 'ok')
                    .map((line) => (
                      <div
                        key={line.name}
                        className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 py-1.5 text-sm last:border-b-0"
                      >
                        <span className="text-ink">{line.name}</span>
                        <span className="text-xs text-ink-3">
                          {STATUS_LABEL[line.status] ?? line.status}
                          {line.runsOutOn !== null ? ` · ${line.runsOutOn}` : ''}
                          {/* The reason, verbatim — this is the field that
                              explains an unknown rather than leaving support
                              to guess. */}
                          {line.unknownReason !== null ? ` · ${line.unknownReason}` : ''}
                        </span>
                      </div>
                    ))}
                </div>
              </InfoCard>
            </Show>
          </div>

          <div className="flex flex-col gap-4">
            <InfoCard title="What they asked for">
              <Show
                when={plan?.options !== null && plan?.options !== undefined}
                fallback={
                  <p className="text-sm text-ink-3">
                    No options recorded — this plan predates the configure screen, or was saved
                    directly.
                  </p>
                }
              >
                <div className="flex flex-col gap-1 text-sm">
                  <Row label="Days" value={String(plan?.options?.days ?? '')} />
                  <Row label="Starting" value={plan?.options?.startDate ?? ''} />
                  <Row label="Meals" value={(plan?.options?.slots ?? []).join(', ')} />
                  <Row
                    label="Budget"
                    value={
                      plan?.options?.budgetNgn === null || plan?.options?.budgetNgn === undefined
                        ? 'none set'
                        : `₦${plan.options.budgetNgn.toLocaleString('en-NG')}`
                    }
                  />
                  <Row
                    label="Effort"
                    value={
                      plan?.options?.effortMinutes === null ||
                      plan?.options?.effortMinutes === undefined
                        ? 'anything'
                        : `under ${String(plan.options.effortMinutes)} min`
                    }
                  />
                  <Row label="Repeats" value={plan?.options?.repeats ?? ''} />
                </div>
              </Show>
            </InfoCard>

            <InfoCard title="The kitchen it planned against">
              <div className="flex flex-col gap-1">
                {(plan?.kitchen ?? []).map((line) => (
                  <div
                    key={line.name}
                    className="flex items-baseline justify-between gap-2 border-b border-line/60 py-1 text-sm last:border-b-0"
                  >
                    <span className="text-ink">{line.name}</span>
                    <span className="font-mono text-xs text-ink-3">
                      {/* A null quantity is the guest case: they said they
                          have it, not how much. The runway reports those as
                          unknown rather than assuming. */}
                      {line.quantity === null
                        ? 'amount not set'
                        : `${String(line.quantity)} ${line.unit ?? ''}`}
                    </span>
                  </div>
                ))}
                <Show when={(plan?.kitchen.length ?? 0) === 0}>
                  <p className="text-sm text-ink-3">
                    Planned with no kitchen, so everything lands on the market list.
                  </p>
                </Show>
              </div>
            </InfoCard>

            <Show when={(plan?.runway?.market.length ?? 0) > 0}>
              <InfoCard title="Their market list">
                <div className="flex flex-col gap-1">
                  {(plan?.runway?.market ?? []).map((line) => (
                    <div
                      key={line.name}
                      className="flex items-baseline justify-between gap-2 border-b border-line/60 py-1 text-sm last:border-b-0"
                    >
                      <span className="text-ink">
                        {line.name}{' '}
                        <span className="text-xs text-ink-3">
                          {line.quantity} {line.unit}
                        </span>
                      </span>
                      <span className="font-mono text-xs text-ink-3">
                        {line.estimatedNgn === null
                          ? 'no estimate'
                          : `₦${line.estimatedNgn.toLocaleString('en-NG')}`}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-3">
                  Estimated total:{' '}
                  {plan?.runway?.estimatedTotalNgn === null
                    ? 'could not price'
                    : `₦${(plan?.runway?.estimatedTotalNgn ?? 0).toLocaleString('en-NG')}`}
                </p>
              </InfoCard>
            </Show>
          </div>
        </div>
      </Show>
    </ConsoleShell>
  );
}

function Row({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1 last:border-b-0">
      <span className="font-mono text-xs uppercase tracking-overline text-ink-3">{label}</span>
      <span className="text-right text-ink">{value}</span>
    </div>
  );
}
