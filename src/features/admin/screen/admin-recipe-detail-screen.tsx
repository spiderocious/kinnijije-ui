import { useNavigate, useParams } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useAdminRecipe, useDeleteRecipe, useSetRecipeStatus } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';

function Row({ label, value }: { readonly label: string; readonly value: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 text-sm">
      <span className="font-mono text-xs uppercase tracking-overline text-ink-3">{label}</span>
      <span className="min-w-0 break-all text-right text-ink">{value ?? '—'}</span>
    </div>
  );
}

export default function AdminRecipeDetailScreen() {
  const navigate = useNavigate();
  const { mealId } = useParams({ strict: false }) as { mealId: string };

  const { data, isLoading } = useAdminRecipe(mealId);
  const setStatus = useSetRecipeStatus();
  const remove = useDeleteRecipe();

  const unmatched = (data?.ingredients ?? []).filter((i) => !i.matched);

  return (
    <ConsoleShell
      active="recipes"
      title={data?.name ?? 'Recipe'}
      actions={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void navigate({ to: ROUTES.ADMIN_RECIPES });
            }}
          >
            Back
          </Button>

          <Show when={data !== undefined}>
            <Button
              variant="secondary"
              size="sm"
              loading={setStatus.isPending}
              onClick={() => {
                setStatus.mutate({
                  mealId,
                  status: data?.status === 'published' ? 'draft' : 'published',
                });
              }}
            >
              {data?.status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              loading={remove.isPending}
              onClick={() => {
                remove.mutate(mealId, {
                  onSuccess: () => {
                    void navigate({ to: ROUTES.ADMIN_RECIPES });
                  },
                });
              }}
            >
              Delete
            </Button>
          </Show>
        </>
      }
    >
      <Show when={isLoading}>
        <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-skeleton" />
      </Show>

      <Show when={data !== undefined}>
        <div className="flex flex-col gap-4">
          {/* An unmatched ingredient is invisible to the matcher, which means
              this recipe can never be suggested for it. Worth saying loudly. */}
          <Show when={unmatched.length > 0}>
            <Callout
              tone="caution"
              title={`${String(unmatched.length)} ingredient${unmatched.length === 1 ? '' : 's'} we cannot match`}
              body={`These are stored but invisible to suggestions: ${unmatched.map((i) => i.name).join(', ')}`}
            />
          </Show>

          <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
            <InfoCard title="About">
              <div className="mb-3 flex flex-wrap gap-1.5">
                <Tag tone={data?.source === 'ai' ? 'info' : 'neutral'} size="sm">
                  {data?.source === 'ai' ? 'generated' : 'written'}
                </Tag>
                <Tag size="sm">{data?.status}</Tag>
                <Tag size="sm">{data?.difficulty}</Tag>
              </div>
              <Row label="id" value={data?.id ?? null} />
              <Row label="slug" value={data?.slug ?? null} />
              <Row label="minutes" value={data?.cook_time_minutes ?? null} />
              <Row label="serves" value={data?.serves ?? null} />
              <Row label="cuisines" value={(data?.cuisines ?? []).join(', ')} />
              <Row label="matchable" value={(data?.ingredient_keys ?? []).length} />
              <Row label="created" value={data?.created_at ?? null} />

              <p className="mt-4 text-sm text-ink-2">{data?.what_makes_it_good}</p>
            </InfoCard>

            <div className="flex min-w-0 flex-col gap-4">
              <InfoCard title={`Ingredients (${String(data?.ingredients.length ?? 0)})`}>
                <ul className="flex flex-col gap-1.5">
                  <Repeat each={data?.ingredients ?? []}>
                    {(item: {
                      name: string;
                      quantity: number | null;
                      unit: string | null;
                      optional: boolean;
                      matched: boolean;
                    }) => (
                      <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-ink">
                          {item.name}
                          <Show when={item.optional}>
                            <span className="ml-1.5 text-xs text-ink-3">optional</span>
                          </Show>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-xs text-ink-3">
                            {item.quantity ?? ''} {item.unit ?? ''}
                          </span>
                          <Show when={!item.matched}>
                            <Tag size="sm">unmatched</Tag>
                          </Show>
                        </span>
                      </li>
                    )}
                  </Repeat>
                </ul>
              </InfoCard>

              <InfoCard title={`Steps (${String(data?.steps.length ?? 0)})`}>
                <ol className="flex flex-col gap-3">
                  <Repeat each={data?.steps ?? []}>
                    {(step: { index: number; heading: string; description: string; estMinutes: number }) => (
                      <li key={step.index} className="border-b border-line/60 pb-3 last:border-0">
                        <p className="text-sm font-extrabold text-ink">
                          {step.index}. {step.heading}
                          <span className="ml-2 font-mono text-xs font-normal text-ink-3">
                            {step.estMinutes}m
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-ink-2">{step.description}</p>
                      </li>
                    )}
                  </Repeat>
                </ol>
              </InfoCard>
            </div>
          </div>
        </div>
      </Show>
    </ConsoleShell>
  );
}
