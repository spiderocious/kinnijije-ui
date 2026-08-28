import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useAiLog } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';

function Row({ label, value }: { readonly label: string; readonly value: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 text-sm">
      <span className="font-mono text-xs uppercase tracking-overline text-ink-3">{label}</span>
      <span className="min-w-0 break-all text-right text-ink">{value ?? '—'}</span>
    </div>
  );
}

function Block({ text }: { readonly text: string }) {
  return (
    <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-blade-sm bg-paper-2 p-3 font-mono text-xs text-ink">
      {text}
    </pre>
  );
}

/**
 * One AI call, in full.
 *
 * This is the screen that answers "the AI got it wrong" — usually by showing
 * that the model was right and the schema rejected it.
 */
export default function AdminAiDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams({ strict: false }) as { logId: string };
  const { data, isLoading } = useAiLog(logId);

  return (
    <ConsoleShell
      active="ai"
      title={data?.prompt_id ?? 'AI call'}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_AI });
          }}
        >
          Back
        </Button>
      }
    >
      <Show when={isLoading}>
        <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-skeleton" />
      </Show>

      <Show when={data !== undefined}>
        <div className="flex flex-col gap-4">
          <Show when={!(data?.ok ?? true)}>
            <Callout
              tone="critical"
              title="This answer was rejected"
              body={
                data?.parse_error ??
                data?.error ??
                'It did not match the schema, so nothing reached the person.'
              }
            />
          </Show>

          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <InfoCard title="The call">
              <div className="mb-3 flex flex-wrap gap-1.5">
                <Tag tone={data?.provider === 'mock' ? 'neutral' : 'info'} size="sm">
                  {data?.provider}
                </Tag>
                <Tag size="sm">{data?.model}</Tag>
              </div>
              <Row label="prompt" value={data?.prompt_id ?? null} />
              <Row label="owner" value={data?.owner_id ?? null} />
              <Row label="parsed" value={data?.parsed === true ? 'yes' : 'no'} />
              <Row label="prompt tokens" value={data?.prompt_tokens ?? null} />
              <Row label="reply tokens" value={data?.completion_tokens ?? null} />
              <Row label="total tokens" value={data?.total_tokens ?? null} />
              <Row label="took" value={`${String(data?.duration_ms ?? 0)}ms`} />
              <Row label="images" value={(data?.image_refs ?? []).length} />
              <Row label="when" value={data?.created_at ?? null} />

              <Show when={data?.metrics !== null && data?.metrics !== undefined}>
                <p className="mt-4 mb-1.5 font-mono text-xs uppercase tracking-overline text-ink-3">
                  what the model said about itself
                </p>
                <pre className="overflow-auto rounded-blade-sm bg-paper-2 p-3 font-mono text-xs">
                  {JSON.stringify(data?.metrics, null, 2)}
                </pre>
              </Show>
            </InfoCard>

            <div className="flex min-w-0 flex-col gap-4">
              <InfoCard title="What came back">
                <Show
                  when={data?.raw_response !== null}
                  fallback={<p className="text-sm text-ink-3">Nothing — the call itself failed.</p>}
                >
                  <Block text={data?.raw_response ?? ''} />
                </Show>
              </InfoCard>

              <InfoCard title="What we sent">
                <Block text={data?.user_prompt ?? ''} />
              </InfoCard>

              <InfoCard title="The instructions it was given">
                <Block text={data?.system_prompt ?? ''} />
              </InfoCard>
            </div>
          </div>
        </div>
      </Show>
    </ConsoleShell>
  );
}
