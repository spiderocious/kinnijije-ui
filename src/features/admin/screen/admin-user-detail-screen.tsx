import { useNavigate, useParams } from '@tanstack/react-router';
import { Repeat, Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { InfoCard, MetricTile } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useAdminUser, useSetUserRole, useSetUserStatus } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';

const STATUSES = ['active', 'pending', 'suspended', 'banned', 'deleted'];
const ROLES = ['user', 'moderator', 'admin', 'super_admin'];

function Row({ label, value }: { readonly label: string; readonly value: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 text-sm">
      <span className="font-mono text-xs uppercase tracking-overline text-ink-3">{label}</span>
      <span className="min-w-0 break-all text-right text-ink">{value ?? '—'}</span>
    </div>
  );
}

/** One person, and everything of theirs. */
export default function AdminUserDetailScreen() {
  const navigate = useNavigate();
  const { userId } = useParams({ strict: false }) as { userId: string };

  const { data, isLoading } = useAdminUser(userId);
  const setStatus = useSetUserStatus();
  const setRole = useSetUserRole();

  return (
    <ConsoleShell
      active="users"
      title={data?.account.email ?? 'Account'}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_USERS });
          }}
        >
          Back
        </Button>
      }
    >
      <Show when={isLoading}>
        <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-paper-2" />
      </Show>

      <Show when={setStatus.error !== null || setRole.error !== null}>
        <Callout
          tone="critical"
          title="That change did not save"
          body={setStatus.error?.message ?? setRole.error?.message}
          className="mb-4"
        />
      </Show>

      <Show when={data !== undefined}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricTile label="Stock" value={data?.totals.stock_items ?? 0} icon="shelf" />
            <MetricTile label="Market" value={data?.totals.market_items ?? 0} icon="shoppingBasket" />
            <MetricTile label="Cooked" value={data?.totals.cooked ?? 0} icon="cookingPot" />
            <MetricTile label="Saved" value={data?.totals.favourites ?? 0} icon="bookmark" />
            <MetricTile label="Messages" value={data?.totals.chat_messages ?? 0} icon="speechBubble" />
            <MetricTile label="AI tokens" value={(data?.totals.ai_tokens ?? 0).toLocaleString()} icon="robotForAi" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <InfoCard title="Account">
              <Row label="id" value={data?.account.id ?? null} />
              <Row label="email" value={data?.account.email ?? null} />
              <Row label="name" value={data?.account.name ?? null} />
              <Row label="verified" value={data?.account.email_verified_at ?? 'not verified'} />
              <Row label="onboarded" value={data?.account.has_onboarded === true ? 'yes' : 'no'} />
              <Row label="joined" value={data?.account.created_at ?? null} />
              <Row label="ai calls" value={data?.totals.ai_calls ?? 0} />
              <Row label="ai rejected" value={data?.totals.ai_failed ?? 0} />

              <div className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-xs uppercase tracking-overline text-ink-3">
                    status
                  </span>
                  <select
                    value={data?.account.status ?? ''}
                    onChange={(event) => {
                      setStatus.mutate({ userId, status: event.target.value });
                    }}
                    className="rounded-blade-xs border border-line bg-white px-3 py-2 text-sm"
                  >
                    {STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-mono text-xs uppercase tracking-overline text-ink-3">
                    role
                  </span>
                  <select
                    value={data?.account.role ?? ''}
                    onChange={(event) => {
                      setRole.mutate({ userId, role: event.target.value });
                    }}
                    className="rounded-blade-xs border border-line bg-white px-3 py-2 text-sm"
                  >
                    {ROLES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </InfoCard>

            <div className="flex min-w-0 flex-col gap-4">
              <InfoCard title={`Their kitchen (${String(data?.stock.length ?? 0)})`}>
                <Show
                  when={(data?.stock.length ?? 0) > 0}
                  fallback={<p className="text-sm text-ink-3">Nothing in it.</p>}
                >
                  <ul className="flex flex-col gap-1.5">
                    <Repeat each={data?.stock ?? []}>
                      {(item: { id: string; name: string; quantity: number; unit: string }) => (
                        <li key={item.id} className="flex justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate text-ink">{item.name}</span>
                          <span className="shrink-0 font-mono text-xs text-ink-3">
                            {item.quantity} {item.unit}
                          </span>
                        </li>
                      )}
                    </Repeat>
                  </ul>
                </Show>
              </InfoCard>

              <InfoCard title={`Market list (${String(data?.market.length ?? 0)})`}>
                <Show
                  when={(data?.market.length ?? 0) > 0}
                  fallback={<p className="text-sm text-ink-3">Nothing on it.</p>}
                >
                  <ul className="flex flex-col gap-1.5">
                    <Repeat each={data?.market ?? []}>
                      {(item: { id: string; name: string; bought: boolean }) => (
                        <li key={item.id} className="flex justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate text-ink">{item.name}</span>
                          <Tag tone={item.bought ? 'neutral' : 'info'} size="sm">
                            {item.bought ? 'bought' : 'to buy'}
                          </Tag>
                        </li>
                      )}
                    </Repeat>
                  </ul>
                </Show>
              </InfoCard>

              <InfoCard title={`What they have cooked (${String(data?.cooked.length ?? 0)})`}>
                <Show
                  when={(data?.cooked.length ?? 0) > 0}
                  fallback={<p className="text-sm text-ink-3">Nothing yet.</p>}
                >
                  <ul className="flex flex-col gap-1.5">
                    <Repeat each={data?.cooked ?? []}>
                      {(row: { meal_id: string; meal_name: string; cooked_at: string }) => (
                        <li
                          key={`${row.meal_id}-${row.cooked_at}`}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <span className="min-w-0 truncate text-ink">{row.meal_name}</span>
                          <span className="shrink-0 font-mono text-xs text-ink-3">
                            {new Date(row.cooked_at).toLocaleDateString()}
                          </span>
                        </li>
                      )}
                    </Repeat>
                  </ul>
                </Show>
              </InfoCard>

              <InfoCard title={`Their jobs (${String(data?.jobs.length ?? 0)})`}>
                <Show
                  when={(data?.jobs.length ?? 0) > 0}
                  fallback={<p className="text-sm text-ink-3">None.</p>}
                >
                  <ul className="flex flex-col gap-1.5">
                    <Repeat each={data?.jobs ?? []}>
                      {(job: { id: string; type: string; status: string }) => (
                        <li key={job.id} className="flex justify-between gap-3 text-sm">
                          <button
                            type="button"
                            onClick={() => {
                              void navigate({ to: ROUTES.ADMIN_JOB(job.id) });
                            }}
                            className="min-w-0 truncate text-left font-mono text-xs text-sky-on underline-offset-2 hover:underline"
                          >
                            {job.type}
                          </button>
                          <span className="shrink-0 font-mono text-xs text-ink-3">{job.status}</span>
                        </li>
                      )}
                    </Repeat>
                  </ul>
                </Show>
              </InfoCard>
            </div>
          </div>
        </div>
      </Show>
    </ConsoleShell>
  );
}
