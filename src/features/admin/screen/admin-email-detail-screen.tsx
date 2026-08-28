import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useAdminEmail, useResendEmail } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';

function Row({ label, value }: { readonly label: string; readonly value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 text-sm">
      <span className="font-mono text-xs uppercase tracking-overline text-ink-3">{label}</span>
      <span className="min-w-0 break-all text-right text-ink">{value ?? '—'}</span>
    </div>
  );
}

/**
 * One email, exactly as it was sent.
 *
 * The stored HTML is rendered in an iframe rather than injected into this page:
 * an email body is arbitrary markup with its own colours and layout, and
 * dropping it into the console would let it restyle the console.
 */
export default function AdminEmailDetailScreen() {
  const navigate = useNavigate();
  const { emailId } = useParams({ strict: false }) as { emailId: string };

  const { data, isLoading } = useAdminEmail(emailId);
  const resend = useResendEmail();

  return (
    <ConsoleShell
      active="emails"
      title={data?.subject ?? 'Email'}
      actions={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void navigate({ to: ROUTES.ADMIN_EMAILS });
            }}
          >
            Back
          </Button>
          <Show when={data !== undefined}>
            <Button
              size="sm"
              loading={resend.isPending}
              onClick={() => {
                resend.mutate(emailId, {
                  onSuccess: (result) => {
                    void navigate({ to: ROUTES.ADMIN_EMAIL(result.id) });
                  },
                });
              }}
            >
              Send it again
            </Button>
          </Show>
        </>
      }
    >
      <Show when={isLoading}>
        <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-paper-2" />
      </Show>

      <Show when={resend.error !== null}>
        <Callout tone="critical" title="Could not resend" body={resend.error?.message} className="mb-4" />
      </Show>

      <Show when={data !== undefined}>
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <InfoCard
            title="Delivery"
            tone={data?.status === 'failed' ? 'critical' : 'default'}
          >
            <div className="mb-3 flex flex-wrap gap-1.5">
              <Tag size="sm">{data?.kind}</Tag>
              <Tag tone={data?.status === 'sent' ? 'info' : 'neutral'} size="sm">
                {data?.status}
              </Tag>
            </div>
            <Row label="to" value={data?.to ?? null} />
            <Row label="subject" value={data?.subject ?? null} />
            <Row label="owner" value={data?.owner_id ?? null} />
            <Row label="provider id" value={data?.provider_id ?? null} />
            <Row label="sent by" value={data?.sent_by ?? null} />
            <Row label="resend of" value={data?.resend_of ?? null} />
            <Row label="when" value={data?.created_at ?? null} />

            <Show when={data?.status === 'suppressed'}>
              <p className="mt-3 text-xs text-ink-3">
                Nothing left the building — no mail key was configured when this was written.
              </p>
            </Show>

            <Show when={data?.error !== null}>
              <p className="mt-3 text-xs text-critical-onsoft">{data?.error}</p>
            </Show>
          </InfoCard>

          <div className="flex min-w-0 flex-col gap-4">
            <InfoCard title="As it looked">
              <iframe
                title="Email preview"
                srcDoc={data?.html ?? ''}
                sandbox=""
                className="h-[560px] w-full rounded-blade-sm border border-line bg-white"
              />
            </InfoCard>

            <InfoCard title="The plain-text version">
              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-blade-sm bg-paper-2 p-3 font-mono text-xs text-ink">
                {data?.text}
              </pre>
            </InfoCard>
          </div>
        </div>
      </Show>
    </ConsoleShell>
  );
}
