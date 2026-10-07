import { useEffect } from 'react';

import { Show } from 'meemaw';

import { X } from '@icons';
import { formatDate } from '@shared/utils/format-date';
import { Tag } from '@ui/status';

import { useTimetableDetail } from '../hooks/use-admin-timetables';

/**
 * Everything about one plan, without leaving the list.
 *
 * A MODAL RATHER THAN A PAGE because this is an inspection, not a
 * destination: somebody scanning the table for a bad plan wants to look and
 * come back, and a full navigation loses their filter, their scroll position
 * and their place in the list.
 *
 * Read-only throughout. A plan belongs to the cook who made it.
 */

const SLOT_ORDER: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2 };

export function TimetableDetailModal({
  planId,
  onClose,
}: {
  readonly planId: string;
  readonly onClose: () => void;
}) {
  const { data, isLoading, error } = useTimetableDetail(planId);

  /** Escape closes, and the page behind does not scroll. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center overflow-y-auto bg-scrim p-4 sm:p-8">
      {/* The scrim closes it, which is the gesture people reach for first. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default"
      />

      <div
        role="dialog"
        aria-label="Plan detail"
        className="relative w-full max-w-[820px] rounded-blade border-2 border-ink bg-white shadow-drop"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-extrabold tracking-display text-ink">
              {data === undefined ? 'Plan' : `Week of ${data.weekOf}`}
            </h2>
            <Show when={data !== undefined}>
              <p className="mt-0.5 font-mono text-xs text-ink-3">
                {data?.id} · {data === undefined ? '' : formatDate(data.createdAt)}
              </p>
            </Show>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-blade-xs text-ink-3 hover:bg-paper-2 hover:text-ink"
          >
            <X size={17} strokeWidth={2.4} />
          </button>
        </div>

        <div className="px-5 py-4">
          <Show when={isLoading}>
            <div className="space-y-3">
              {[0, 1, 2, 3].map((row) => (
                <div
                  key={row}
                  aria-hidden="true"
                  className="h-14 animate-shimmer rounded-blade-xs bg-skeleton"
                />
              ))}
            </div>
          </Show>

          <Show when={error !== null && data === undefined}>
            <p className="py-6 text-center text-sm text-critical-onsoft">
              Could not load that plan.
            </p>
          </Show>

          <Show when={data !== undefined}>
            {/* ── How it was built ────────────────────────────────── */}
            <Section title="How it was built">
              <div className="flex flex-wrap items-center gap-2">
                <Tag size="sm" tone={data?.strategy === 'deterministic' ? 'neutral' : 'info'}>
                  {data?.strategy ?? 'unknown'}
                </Tag>
                {/*
                 * The requested strategy, shown only when it DIFFERS — that
                 * is the whole signal. Showing it always would make every row
                 * look like a fallback.
                 */}
                <Show
                  when={
                    data?.requestedStrategy !== null &&
                    data?.requestedStrategy !== undefined &&
                    data.requestedStrategy !== data.strategy
                  }
                >
                  <span className="text-xs text-caution-onsoft">
                    fell back from {data?.requestedStrategy}
                  </span>
                </Show>
                <Show when={data?.matching !== null && data?.matching !== undefined}>
                  <span className="font-mono text-xs text-ink-3">
                    {data?.matching?.exact} exact · {data?.matching?.close} close ·{' '}
                    {data?.matching?.none} new
                  </span>
                </Show>
              </div>
            </Section>

            {/* ── What they asked for ─────────────────────────────── */}
            <Section title="What they asked for">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
                <Field label="Days" value={String(data?.options?.days ?? data?.days ?? '—')} />
                <Field label="Cooking for" value={String(data?.household ?? '—')} />
                <Field
                  label="Meals a day"
                  value={data?.options?.slots.join(', ') ?? '—'}
                />
                <Field
                  label="Budget"
                  value={
                    data?.options?.budgetNgn === null || data?.options?.budgetNgn === undefined
                      ? 'none'
                      : `₦${data.options.budgetNgn.toLocaleString('en-NG')}`
                  }
                />
                <Field
                  label="Effort"
                  value={
                    data?.options?.effortMinutes === null ||
                    data?.options?.effortMinutes === undefined
                      ? 'any'
                      : `under ${String(data.options.effortMinutes)} min`
                  }
                />
                <Field label="Repeats" value={data?.options?.repeats ?? '—'} />
              </dl>
            </Section>

            {/* ── The kitchen they confirmed ──────────────────────── */}
            <Section title={`Their kitchen · ${String(data?.kitchen.length ?? 0)}`}>
              <Show
                when={(data?.kitchen.length ?? 0) > 0}
                fallback={<p className="text-sm text-ink-3">They planned with nothing.</p>}
              >
                <div className="flex flex-wrap gap-1.5">
                  {data?.kitchen.map((line) => (
                    <span
                      key={line.name}
                      className="rounded-pill border border-line-2 bg-paper-2 px-2.5 py-1 text-xs text-ink-2"
                    >
                      {line.name}
                    </span>
                  ))}
                </div>
              </Show>
            </Section>

            {/* ── The plan itself ─────────────────────────────────── */}
            <Section title="The week">
              <div className="space-y-2">
                {data?.plan.map((day) => (
                  <div
                    key={day.date}
                    className="rounded-blade-xs border border-line bg-paper px-3 py-2"
                  >
                    <p className="font-mono text-xs text-ink-4">{day.date}</p>
                    <div className="mt-1 space-y-0.5">
                      {[...day.meals]
                        .sort(
                          (a, b) => (SLOT_ORDER[a.slot] ?? 9) - (SLOT_ORDER[b.slot] ?? 9),
                        )
                        .map((meal) => (
                          <p key={`${meal.slot}-${meal.mealId}`} className="text-sm text-ink">
                            <span className="font-mono text-xs uppercase text-ink-4">
                              {meal.slot}
                            </span>{' '}
                            {meal.mealName}
                            {/* A proposed dish has no recipe behind it, and
                                that is worth seeing at a glance. */}
                            <Show when={meal.mealId.startsWith('proposed:')}>
                              <span className="ml-1.5 text-xs text-caution-onsoft">
                                (invented)
                              </span>
                            </Show>
                          </p>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── What they were told to buy ──────────────────────── */}
            {/*
             * `runway` is null on a plan that is still being built, which the
             * compiler caught and is worth honouring: an empty market list
             * and no market list at all are different facts.
             */}
            <Section title={`What they needed · ${String(data?.runway?.market.length ?? 0)}`}>
              <Show
                when={(data?.runway?.market.length ?? 0) > 0}
                fallback={
                  <p className="text-sm text-success-onsoft">
                    {data?.runway === null
                      ? 'Still being built.'
                      : 'Nothing. Their kitchen covered the whole plan.'}
                  </p>
                }
              >
                <div className="flex flex-wrap gap-1.5">
                  {data?.runway?.market.map((line) => (
                    <span
                      key={line.name}
                      className="rounded-pill border border-caution-border bg-caution-soft px-2.5 py-1 text-xs text-caution-onsoft"
                    >
                      {line.name}
                    </span>
                  ))}
                </div>
              </Show>
            </Section>
          </Show>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <h3 className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-4">{label}</dt>
      <dd className="font-extrabold text-ink">{value}</dd>
    </div>
  );
}
