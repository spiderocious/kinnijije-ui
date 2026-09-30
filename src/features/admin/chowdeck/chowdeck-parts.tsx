import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Link, useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { ApiError } from '@shared/services/api-client';
import { cn } from '@shared/utils/cn';
import { Callout } from '@ui/feedback';
import { Tabs } from '@ui/navigation';
import { Button } from '@ui/primitives';

import { useAdminJob } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';

import type { CacheStatus, CallStatus, Freshness } from './chowdeck.types';

// ── The frame ────────────────────────────────────────────────────────

export type ChowdeckSection = 'overview' | 'requests' | 'cache' | 'coverage' | 'places' | 'clicks';

const SECTIONS: { value: ChowdeckSection; label: string; to: string }[] = [
  { value: 'overview', label: 'Overview', to: ROUTES.ADMIN_CHOWDECK },
  { value: 'requests', label: 'Requests', to: ROUTES.ADMIN_CHOWDECK_REQUESTS },
  { value: 'cache', label: 'Cache', to: ROUTES.ADMIN_CHOWDECK_CACHE },
  { value: 'coverage', label: 'Coverage', to: ROUTES.ADMIN_CHOWDECK_COVERAGE },
  { value: 'places', label: 'Places', to: ROUTES.ADMIN_CHOWDECK_PLACES },
  { value: 'clicks', label: 'Clicks', to: ROUTES.ADMIN_CHOWDECK_CLICKS },
];

/**
 * The console frame, plus the Chowdeck section strip.
 *
 * Each section is its own URL rather than a tab panel: a request or a cache
 * row gets linked from everywhere else in here, and a link has to land on
 * something.
 */
export function ChowdeckShell({
  section,
  title,
  actions,
  children,
}: {
  readonly section: ChowdeckSection;
  readonly title: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <ConsoleShell active="chowdeck" title={title} {...(actions !== undefined && { actions })}>
      <Tabs
        value={section}
        onValueChange={(value) => {
          const target = SECTIONS.find((s) => s.value === value);
          if (target !== undefined) void navigate({ to: target.to });
        }}
        className="mb-5"
      >
        <Tabs.List label="Chowdeck sections">
          {SECTIONS.map((s) => (
            <Tabs.Tab key={s.value} value={s.value}>
              {s.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      {children}
    </ConsoleShell>
  );
}

// ── Errors ───────────────────────────────────────────────────────────

/** Rate limits carry a real wait — "try again later" gives a person nothing to act on. */
function formatWait(seconds: number): string {
  if (seconds < 60) return `${String(seconds)} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? 'a minute' : `${String(minutes)} minutes`;
}

/**
 * A failed request, said the way the rest of the console says it.
 *
 * Every action here sits behind its own rate limit, and pressing a button too
 * often is a "wait", not a fault — so a 429 reads softer and carries the
 * server's own Retry-After, the same way the sign-in form does it.
 */
export function ChowdeckError({
  error,
  title,
  className = 'mb-4',
}: {
  readonly error: Error | null;
  readonly title: string;
  readonly className?: string;
}) {
  if (error === null) return null;

  const api = error instanceof ApiError ? error : null;
  const limited = api !== null && (api.status === 429 || api.code === 'rate_limited');
  const transient = limited || (api !== null && api.status >= 500);
  const wait =
    api?.retryAfterSeconds !== undefined ? ` Try again in ${formatWait(api.retryAfterSeconds)}.` : '';

  return (
    <Callout
      tone={transient ? 'caution' : 'critical'}
      title={limited ? 'Slow down — that was asked too often' : title}
      body={`${error.message}${wait}`}
      className={className}
    />
  );
}

// ── Badges ───────────────────────────────────────────────────────────

/**
 * Local rather than reused, as in the images panel: `Tag` is deliberately
 * limited to neutral and info, and `Status` maps a fixed set of domain enums.
 * A call outcome and a cache age are neither.
 */
function Badge({ className, children }: { readonly className: string; readonly children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-pill border-hair px-2 py-0.5 text-[11px] font-extrabold',
        className,
      )}
    >
      {children}
    </span>
  );
}

const GOOD = 'border-success-border bg-success-soft text-success-onsoft';
const WARN = 'border-caution-border bg-caution-soft text-caution-onsoft';
const BAD = 'border-critical-border bg-critical-soft text-critical-onsoft';
const QUIET = 'border-line-2 bg-paper-2 text-ink-3';

const CALL_STATUS_CLASS: Record<CallStatus, string> = {
  ok: GOOD,
  http_error: BAD,
  timeout: BAD,
  network_error: BAD,
  parse_error: BAD,
  // We did not send it. Our own guard said no — worth noticing, not an outage.
  refused: WARN,
};

export function CallStatusBadge({ status }: { readonly status: CallStatus }) {
  return <Badge className={CALL_STATUS_CLASS[status]}>{status.replace('_', ' ')}</Badge>;
}

const FRESHNESS_CLASS: Record<Freshness, string> = { fresh: GOOD, stale: WARN, expired: QUIET };

export function FreshnessBadge({ freshness }: { readonly freshness: Freshness }) {
  return <Badge className={FRESHNESS_CLASS[freshness]}>{freshness}</Badge>;
}

export function CacheStatusBadge({ status }: { readonly status: CacheStatus }) {
  return <Badge className={status === 'ok' ? GOOD : QUIET}>{status === 'ok' ? 'has offers' : 'empty'}</Badge>;
}

export function OnOffBadge({ on, onLabel = 'on', offLabel = 'off' }: {
  readonly on: boolean;
  readonly onLabel?: string;
  readonly offLabel?: string;
}) {
  return <Badge className={on ? GOOD : BAD}>{on ? onLabel : offLabel}</Badge>;
}

// ── Detail bits ──────────────────────────────────────────────────────

export function Row({ label, value }: { readonly label: string; readonly value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 text-sm">
      <span className="shrink-0 font-mono text-xs uppercase tracking-overline text-ink-3">{label}</span>
      <span className="min-w-0 break-all text-right text-ink">{value ?? '—'}</span>
    </div>
  );
}

/** Pretty-printed JSON in a scrolling box. */
export function Json({ value }: { readonly value: unknown }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-blade-sm bg-paper-2 p-3 font-mono text-xs text-ink">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function Block({ text }: { readonly text: string }) {
  return (
    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-all rounded-blade-sm bg-paper-2 p-3 font-mono text-xs text-ink">
      {text}
    </pre>
  );
}

/** A link inside a table row that must not also trigger the row. */
export function InlineLink({ to, children }: { readonly to: string; readonly children: ReactNode }) {
  return (
    <Link
      to={to}
      onClick={(event) => {
        event.stopPropagation();
      }}
      className="font-mono text-xs text-sky-on underline-offset-2 hover:underline"
    >
      {children}
    </Link>
  );
}

export function CopyButton({ text, label = 'Copy' }: { readonly text: string; readonly label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      size="sm"
      variant="tertiary"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 1500);
        });
      }}
    >
      {copied ? 'Copied' : label}
    </Button>
  );
}

// ── Money and numbers ────────────────────────────────────────────────

export function naira(value: number | null): string {
  if (value === null) return '—';
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

/** Stored prices are kobo, exactly as Chowdeck sent them. */
export function nairaFromKobo(kobo: number | null): string {
  return kobo === null ? '—' : naira(kobo / 100);
}

// ── Paging ───────────────────────────────────────────────────────────

export function Pager({
  total,
  limit,
  skip,
  onSkip,
  noun,
}: {
  readonly total: number;
  readonly limit: number;
  readonly skip: number;
  readonly onSkip: (skip: number) => void;
  readonly noun: string;
}) {
  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(total, skip + limit);

  return (
    <div className="mt-3 flex items-center justify-end gap-2">
      <span className="font-mono text-xs text-ink-3">
        {from}–{to} of {total} {noun}
      </span>
      <Button
        size="sm"
        variant="secondary"
        disabled={skip === 0}
        onClick={() => {
          onSkip(Math.max(0, skip - limit));
        }}
      >
        Newer
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={skip + limit >= total}
        onClick={() => {
          onSkip(skip + limit);
        }}
      >
        Older
      </Button>
    </div>
  );
}

// ── Following a job ──────────────────────────────────────────────────

/**
 * A queued job, followed to the end.
 *
 * The same poll the job detail screen uses — every few seconds until it has a
 * finish time, then never again. `onDone` fires once, when it lands, so the
 * caller can refetch whatever the job was writing.
 */
export function JobFollower({
  jobId,
  onDone,
}: {
  readonly jobId: string;
  readonly onDone?: () => void;
}) {
  const { data } = useAdminJob(jobId);
  const finished = data !== undefined && data.finished_at !== null;

  // Once per job, however many renders land after it finishes.
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (finished && reported.current !== jobId) {
      reported.current = jobId;
      onDone?.();
    }
  }, [finished, jobId, onDone]);

  const percent = Math.round((data?.progress ?? 0) * 100);
  const failed = data?.status === 'failed';

  return (
    <div
      className={cn(
        'rounded-blade-sm border p-3',
        failed ? 'border-critical-border bg-critical-soft' : 'border-line bg-paper-2',
      )}
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-extrabold text-ink">
          {data?.status ?? 'queued'}
          <Show when={data?.progress_label !== null && data?.progress_label !== undefined}>
            <span className="font-normal text-ink-3"> · {data?.progress_label}</span>
          </Show>
        </span>
        <InlineLink to={ROUTES.ADMIN_JOB(jobId)}>{jobId}</InlineLink>
      </div>

      <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-pill bg-skeleton">
        <span
          className={cn('block h-full rounded-pill', failed ? 'bg-critical' : 'bg-sky')}
          style={{ width: `${String(finished ? 100 : percent)}%` }}
        />
      </span>

      <Show when={data?.error !== null && data?.error !== undefined}>
        <p className="mt-2 text-xs text-critical-onsoft">{data?.error}</p>
      </Show>

      <Show when={finished && data?.result !== null && data?.result !== undefined}>
        <div className="mt-2">
          <Json value={data?.result} />
        </div>
      </Show>
    </div>
  );
}
