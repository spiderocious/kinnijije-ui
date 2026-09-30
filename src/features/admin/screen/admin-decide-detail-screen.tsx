import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDateTime } from '@shared/utils/format-date';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useDecideLog } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';

function Row({ label, value }: { readonly label: string; readonly value: string | number | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 text-sm">
      <span className="font-mono text-xs uppercase tracking-overline text-ink-3">{label}</span>
      <span className="min-w-0 break-all text-right text-ink">{value ?? '—'}</span>
    </div>
  );
}

/** A list of names as chips, or an explicit note that there were none. */
function Chips({ items, empty }: { readonly items: string[]; readonly empty: string }) {
  return (
    <Show
      when={items.length > 0}
      fallback={<p className="text-sm italic text-ink-3">{empty}</p>}
    >
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Tag key={item} size="sm">
            {item}
          </Tag>
        ))}
      </div>
    </Show>
  );
}

/**
 * One decision, in full.
 *
 * The list answers "what happened"; this answers "why did THAT happen", so it
 * leads with the two halves of the exchange side by side — what they told us,
 * and what we said back — rather than a flat field dump.
 */
export default function AdminDecideDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams({ strict: false }) as { logId: string };
  const { data, isLoading } = useDecideLog(logId);

  const nothingFit = data !== undefined && data.verdict_meal_id === null;

  return (
    <ConsoleShell
      active="decide"
      title={data?.verdict_name ?? 'Decision'}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_DECIDE });
          }}
        >
          Back
        </Button>
      }
    >
      <Show when={!isLoading} fallback={<p className="text-sm text-ink-3">Loading…</p>}>
        <Show when={data !== undefined} fallback={<p className="text-sm text-ink-3">Not found.</p>}>
          <div className="flex flex-col gap-4">
            <Show when={nothingFit}>
              <Callout
                tone="critical"
                title="Nothing fit"
                body="No meal survived filtering for this combination. Worth checking the time ceiling and the weight tags on the catalogue."
              />
            </Show>

            <Show when={data?.ai_fallback_reason !== null && data?.ai_fallback_reason !== undefined}>
              <Callout
                tone="caution"
                title="The model did not contribute"
                body={data?.ai_fallback_reason ?? ''}
              />
            </Show>

            <div className="grid gap-4 lg:grid-cols-2">
              <InfoCard title="What they told us">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Tag size="sm">{data?.mood}</Tag>
                  <Tag size="sm">{data?.weight}</Tag>
                  <Tag size="sm">{data?.minutes} min</Tag>
                  <Show when={data?.city !== null}>
                    <Tag size="sm" tone="info">
                      {data?.city}
                    </Tag>
                  </Show>
                </div>

                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-label text-ink-3">
                  In their kitchen ({data?.kitchen_items.length ?? 0})
                </div>
                <Chips
                  items={data?.kitchen_items ?? []}
                  empty={
                    data?.kitchen_skipped === true
                      ? 'They said they have nothing.'
                      : 'Nothing picked.'
                  }
                />

                <Show when={(data?.rejected.length ?? 0) > 0}>
                  <div className="mb-2 mt-4 text-[11px] font-extrabold uppercase tracking-label text-ink-3">
                    Already refused ({data?.rejected.length ?? 0})
                  </div>
                  <Chips items={data?.rejected ?? []} empty="None." />
                </Show>
              </InfoCard>

              <InfoCard title="What we said">
                <Show
                  when={!nothingFit}
                  fallback={<p className="text-sm italic text-ink-3">No meal was returned.</p>}
                >
                  <div className="mb-2 font-display text-lg font-extrabold text-ink">
                    {data?.verdict_name}
                  </div>
                  <p className="mb-3 text-sm text-ink-2">{data?.why}</p>

                  <div className="flex flex-wrap gap-1.5">
                    <Tag size="sm" tone={data?.provenance === 'ai_framed' ? 'info' : 'neutral'}>
                      {data?.provenance === 'ai_framed' ? 'AI wrote the why' : 'templated'}
                    </Tag>
                    <Tag size="sm">
                      score {data?.verdict_score?.toFixed(2) ?? '—'}
                    </Tag>
                    <Tag size="sm">{data?.pool_size} in pool</Tag>
                    <Tag size="sm">{data?.duration_ms}ms</Tag>
                  </div>
                </Show>
              </InfoCard>
            </div>

            <InfoCard title="Record">
              <Row label="when" value={formatDateTime(data?.created_at ?? null)} />
              <Row label="visitor" value={data?.visitor ?? null} />
              <Row label="request id" value={data?.request_id ?? null} />
              <Row label="meal id" value={data?.verdict_meal_id ?? null} />
              <Row label="log id" value={data?.id ?? null} />
              {/* The hash is salted server-side and truncated here: enough to
                  spot the same visitor twice, useless for anything else. */}
              <p className="pt-3 text-xs text-ink-3">
                The visitor id is a salted hash of the IP. It cannot be reversed, and no other
                personal data is recorded for an anonymous decision.
              </p>
            </InfoCard>
          </div>
        </Show>
      </Show>
    </ConsoleShell>
  );
}
