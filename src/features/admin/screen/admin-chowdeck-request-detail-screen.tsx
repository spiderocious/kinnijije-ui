import { useEffect, useState } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDateTime } from '@shared/utils/format-date';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button, Segmented } from '@ui/primitives';
import { Tag } from '@ui/status';

import {
  Block,
  CallStatusBadge,
  ChowdeckError,
  ChowdeckShell,
  CopyButton,
  InlineLink,
  Json,
  Row,
} from '../chowdeck/chowdeck-parts';
import type { CallDetail, CallRow } from '../chowdeck/chowdeck.types';
import { useChowdeckCall, useReplayCall } from '../chowdeck/use-chowdeck';
import { DataTable, type Column } from '../parts/data-table';

const REPLAY_COLUMNS: Column<CallRow>[] = [
  {
    key: 'when',
    header: 'When',
    render: (row) => <span className="font-mono text-xs text-ink-3">{formatDateTime(row.created_at)}</span>,
  },
  { key: 'status', header: 'Status', render: (row) => <CallStatusBadge status={row.status} /> },
  {
    key: 'http',
    header: 'HTTP',
    numeric: true,
    render: (row) => <span className="font-mono text-xs">{row.http_status ?? '—'}</span>,
  },
  {
    key: 'results',
    header: 'Results',
    numeric: true,
    render: (row) => <span className="font-mono text-xs">{row.result_count ?? '—'}</span>,
  },
  {
    key: 'ms',
    header: 'ms',
    numeric: true,
    render: (row) => <span className="font-mono text-xs">{row.duration_ms}</span>,
  },
];

const bytes = (value: number | null) =>
  value === null ? '—' : value < 1024 ? `${String(value)} B` : `${(value / 1024).toFixed(1)} KB`;

/**
 * What actually happened, in one line: the question somebody opening a
 * failed call is really asking. Read from the status code, the headers and
 * the network error — never guessed from the error text.
 */
function diagnosis(call: CallDetail): { tone: 'success' | 'caution' | 'critical'; title: string; body: string } {
  const http = call.http_status;
  const server = call.response_headers?.['server'] ?? null;
  const edge = call.response_headers?.['cf-ray'] !== undefined ? ' (through Cloudflare)' : '';

  if (call.status === 'refused') {
    return {
      tone: 'caution',
      title: 'Never sent — refused on our side',
      body: `Our own guard stopped it: ${call.error ?? 'unknown'}. Chowdeck never saw this request.`,
    };
  }
  if (http === 429) {
    return {
      tone: 'critical',
      title: 'Rate limited by Chowdeck',
      body:
        call.retry_after !== null
          ? `They answered 429 and asked us to wait ${call.retry_after}s. Our breaker opened at once.`
          : 'They answered 429 with no Retry-After. Our breaker opened at once.',
    };
  }
  if (http === 403 || http === 401) {
    return {
      tone: 'critical',
      title: 'Blocked by Chowdeck',
      body: `HTTP ${String(http)}${edge}. They reached a decision about us rather than failing — check the body and headers.`,
    };
  }
  if (http !== null && http >= 500) {
    return {
      tone: 'critical',
      title: 'Chowdeck was down or failing',
      body: `HTTP ${String(http)}${server !== null ? ` from ${server}` : ''}${edge}. Their side, not ours.`,
    };
  }
  if (call.status === 'timeout') {
    return {
      tone: 'critical',
      title: 'No answer in time',
      body: `Nothing within the timeout${http !== null ? `, after an HTTP ${String(http)} status line` : ''}. Slow, or down.`,
    };
  }
  if (call.status === 'network_error') {
    return {
      tone: 'critical',
      title: 'Never reached them',
      body: `${call.error_code ?? 'No error code'} — ${call.error ?? 'network error'}. Usually our network or DNS, not Chowdeck.`,
    };
  }
  if (call.status === 'parse_error') {
    return {
      tone: 'caution',
      title: 'They answered, but not in a shape we recognise',
      body: `${call.error ?? ''} — their response format may have changed.`,
    };
  }
  if (call.status === 'http_error') {
    return { tone: 'caution', title: `HTTP ${String(http ?? '')}`, body: call.error ?? '' };
  }
  return { tone: 'success', title: 'Answered normally', body: `HTTP ${String(http ?? '')}, ${String(call.result_count ?? 0)} results.` };
}

/**
 * One request, in full: what we sent, what came back, and what we made of it.
 *
 * The body is kept exactly as received, so "Chowdeck changed their shape" can
 * be proven or ruled out from here without calling them again.
 */
export default function AdminChowdeckRequestDetailScreen() {
  const navigate = useNavigate();
  const { callId } = useParams({ strict: false }) as { callId: string };
  const { data, isLoading, error } = useChowdeckCall(callId);
  const replay = useReplayCall();
  const [view, setView] = useState<'json' | 'raw'>('json');

  // Following the link to the replay lands on this same screen; the last
  // replay's result belongs to the call it was made from, not to the new one.
  const resetReplay = replay.reset;
  useEffect(() => {
    resetReplay();
  }, [callId, resetReplay]);

  const replayed = replay.data?.call;
  const hasJson = data?.response_json !== null && data?.response_json !== undefined;
  const verdict = data === undefined ? null : diagnosis(data);

  return (
    <ChowdeckShell
      section="requests"
      title={data === undefined ? 'Request' : `${data.kind} · ${data.params['query'] ?? data.params['input'] ?? data.id}`}
      actions={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void navigate({ to: ROUTES.ADMIN_CHOWDECK_REQUESTS });
            }}
          >
            Back
          </Button>
          <Show when={data !== undefined}>
            <Button
              size="sm"
              loading={replay.isPending}
              onClick={() => {
                replay.mutate(callId);
              }}
            >
              Replay
            </Button>
          </Show>
        </>
      }
    >
      <ChowdeckError error={error} title="This request did not load" />
      <ChowdeckError error={replay.error} title="Could not replay" />

      {/* What the replay did, with a way to the call it made. */}
      <Show when={replayed !== undefined}>
        <Callout
          tone={replayed?.status === 'ok' ? 'success' : replayed?.status === 'refused' ? 'caution' : 'critical'}
          title={`Replayed: ${replayed?.status ?? ''}${replayed?.refusal === null || replayed?.refusal === undefined ? '' : ` (${replayed.refusal})`}`}
          body={
            <span className="flex flex-col gap-1">
              <span>
                {replayed?.http_status ?? 'no HTTP status'} in {replayed?.duration_ms ?? 0}ms
                {replay.data?.cache_updated === true ? ' — the cache row was rewritten.' : ''}
              </span>
              <Show when={replayed?.error !== null && replayed?.error !== undefined}>
                <span>{replayed?.error}</span>
              </Show>
              <span>
                <InlineLink to={ROUTES.ADMIN_CHOWDECK_REQUEST(replayed?.call_id ?? '')}>
                  Open {replayed?.call_id}
                </InlineLink>
              </span>
            </span>
          }
          className="mb-4"
        />
      </Show>

      <Show when={isLoading}>
        <div aria-hidden="true" className="h-64 animate-shimmer rounded-blade bg-skeleton" />
      </Show>

      <Show when={data !== undefined}>
        <div className="flex flex-col gap-4">
          <Show when={verdict !== null}>
            <Callout tone={verdict?.tone ?? 'success'} title={verdict?.title ?? ''} body={verdict?.body ?? ''} />
          </Show>

          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <div className="flex min-w-0 flex-col gap-4">
              <InfoCard title="The call">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <CallStatusBadge status={data?.status ?? 'ok'} />
                  <Tag size="sm">{data?.kind}</Tag>
                  <Tag size="sm" tone="info">
                    {data?.trigger}
                  </Tag>
                </div>
                <Row label="id" value={data?.id ?? null} />
                <Row label="when" value={formatDateTime(data?.created_at)} />
                <Row label="http" value={data?.http_status ?? null} />
                <Row label="error" value={data?.error ?? null} />
                <Row label="error code" value={data?.error_code ?? null} />
                <Row label="retry-after" value={data?.retry_after ?? null} />
                <Row label="took" value={`${String(data?.duration_ms ?? 0)}ms`} />
                <Row label="results" value={data?.result_count ?? null} />
                <Row label="body" value={bytes(data?.response_bytes ?? null)} />
                <Row label="truncated" value={data?.truncated === true ? 'yes' : 'no'} />
                <Row label="actor" value={data?.actor_id ?? null} />
                <Row label="request id" value={data?.request_id ?? null} />
                <Row
                  label="replay of"
                  value={
                    data?.replay_of === null || data?.replay_of === undefined ? null : (
                      <InlineLink to={ROUTES.ADMIN_CHOWDECK_REQUEST(data.replay_of)}>{data.replay_of}</InlineLink>
                    )
                  }
                />
                <Row
                  label="cache row"
                  value={
                    data?.cache_entry_id === null || data?.cache_entry_id === undefined ? null : (
                      <InlineLink to={ROUTES.ADMIN_CHOWDECK_CACHE_ENTRY(data.cache_entry_id)}>
                        {data.cache_entry_id}
                      </InlineLink>
                    )
                  }
                />
              </InfoCard>

              <InfoCard title="What we sent" action={<CopyButton text={data?.url ?? ''} label="Copy URL" />}>
                <p className="mb-3 break-all font-mono text-xs text-ink">{data?.url}</p>
                <Json value={data?.params ?? {}} />
                <p className="mb-1 mt-3 text-[11px] font-extrabold uppercase tracking-overline text-ink-3">Headers</p>
                <Json value={data?.request_headers ?? {}} />
              </InfoCard>

              {/* Retry-After, rate-limit counters, server and CDN headers: the
                  evidence for what a refusal really was. */}
              <InfoCard title="Response headers">
                <Show
                  when={data?.response_headers !== null && data?.response_headers !== undefined}
                  fallback={<p className="text-sm text-ink-3">None — no response arrived.</p>}
                >
                  <Json value={data?.response_headers ?? {}} />
                </Show>
              </InfoCard>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <InfoCard
                title="What came back"
                action={
                  <Segmented
                    value={view}
                    onValueChange={(value) => {
                      setView(value === 'raw' ? 'raw' : 'json');
                    }}
                    label="Body view"
                  >
                    <Segmented.Item value="json">Parsed</Segmented.Item>
                    <Segmented.Item value="raw">Raw</Segmented.Item>
                  </Segmented>
                }
              >
                <Show when={data?.truncated === true}>
                  <Callout
                    tone="caution"
                    title="Truncated"
                    body="The body was over the storage cap and was cut off, so it cannot be parsed. The raw view shows what was kept."
                    className="mb-3"
                  />
                </Show>

                <Show
                  when={data?.response_body !== null && data?.response_body !== undefined}
                  fallback={<p className="text-sm text-ink-3">No body — the request never got an answer.</p>}
                >
                  <Show when={view === 'json'}>
                    <Show
                      when={hasJson}
                      fallback={<p className="text-sm text-ink-3">Not JSON, or not whole. See the raw view.</p>}
                    >
                      <Json value={data?.response_json} />
                    </Show>
                  </Show>
                  <Show when={view === 'raw'}>
                    <Block text={data?.response_body ?? ''} />
                  </Show>
                </Show>
              </InfoCard>

              <InfoCard title="Replays">
                <DataTable
                  rows={data?.replays ?? []}
                  columns={REPLAY_COLUMNS}
                  isLoading={false}
                  empty="Never replayed."
                  rowKey={(row) => row.id}
                  onRowClick={(row) => {
                    void navigate({ to: ROUTES.ADMIN_CHOWDECK_REQUEST(row.id) });
                  }}
                />
              </InfoCard>
            </div>
          </div>
        </div>
      </Show>
    </ChowdeckShell>
  );
}
