import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';

import { useAdminJob, useCancelJob, useRetryJob } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';

function Row({ label, value }: { readonly label: string; readonly value: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 text-sm">
      <span className="font-mono text-xs uppercase tracking-overline text-ink-3">{label}</span>
      <span className="min-w-0 break-all text-right text-ink">{value ?? '—'}</span>
    </div>
  );
}

/** Pretty-printed JSON in a scrolling box. */
function Json({ value }: { readonly value: unknown }) {
  return (
    <pre className="max-h-[420px] overflow-auto rounded-blade-sm bg-paper-2 p-3 font-mono text-xs text-ink">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function AdminJobDetailScreen() {
  const navigate = useNavigate();
  const { jobId } = useParams({ strict: false }) as { jobId: string };

  const { data, isLoading } = useAdminJob(jobId);
  const retry = useRetryJob();
  const cancel = useCancelJob();

  const isTerminal = data?.finished_at !== null;
  const succeeded = data?.status === 'succeeded';

  return (
    <ConsoleShell
      active="jobs"
      title={data?.type ?? 'Job'}
      actions={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void navigate({ to: ROUTES.ADMIN_JOBS });
            }}
          >
            Back
          </Button>

          <Show when={data !== undefined && !isTerminal}>
            <Button
              variant="secondary"
              size="sm"
              loading={cancel.isPending}
              onClick={() => {
                cancel.mutate(jobId);
              }}
            >
              Cancel
            </Button>
          </Show>

          <Show when={data !== undefined && isTerminal}>
            <Button
              size="sm"
              loading={retry.isPending}
              onClick={() => {
                // `force` only when it already succeeded — re-running a good
                // job is an operator decision, never an accident.
                retry.mutate({ jobId, force: succeeded });
              }}
            >
              {succeeded ? 'Run it again' : 'Retry'}
            </Button>
          </Show>
        </>
      }
    >
      <Show when={isLoading}>
        <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-skeleton" />
      </Show>

      <Show when={retry.error !== null}>
        <Callout tone="critical" title="Could not requeue" body={retry.error?.message} className="mb-4" />
      </Show>
      <Show when={cancel.error !== null}>
        <Callout tone="critical" title="Could not cancel" body={cancel.error?.message} className="mb-4" />
      </Show>

      <Show when={data !== undefined}>
        <div className="grid gap-4 lg:grid-cols-2">
          <InfoCard title="State" tone={data?.status === 'failed' ? 'critical' : 'default'}>
            <Row label="id" value={data?.id ?? null} />
            <Row label="type" value={data?.type ?? null} />
            <Row label="status" value={data?.status ?? null} />
            <Row label="progress" value={`${String(Math.round((data?.progress ?? 0) * 100))}%`} />
            <Row label="label" value={data?.progress_label ?? null} />
            <Row
              label="attempts"
              value={`${String(data?.attempts ?? 0)} of ${String(data?.max_attempts ?? 0)}`}
            />
            <Row label="owner" value={data?.owner_id ?? null} />
            <Row label="created" value={data?.created_at ?? null} />
            <Row label="started" value={data?.started_at ?? null} />
            <Row label="finished" value={data?.finished_at ?? null} />
            <Row label="cancel asked" value={data?.cancel_requested_at ?? null} />
            <Row label="lease until" value={data?.lease_expires_at ?? null} />
          </InfoCard>

          <div className="flex flex-col gap-4">
            <Show when={data?.error !== null}>
              <Callout tone="critical" title="It failed with" body={data?.error ?? ''} />
            </Show>

            <InfoCard title="What it was asked to do">
              <Json value={data?.payload} />
            </InfoCard>

            <InfoCard title="What it produced">
              <Show
                when={data?.result !== null}
                fallback={<p className="text-sm text-ink-3">Nothing yet.</p>}
              >
                <Json value={data?.result} />
              </Show>
            </InfoCard>
          </div>
        </div>
      </Show>
    </ConsoleShell>
  );
}
