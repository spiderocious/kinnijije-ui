import { useState } from 'react';

import { Show } from 'meemaw';

import type { Job } from '@features/jobs/types/jobs.types';
import { formatDate } from '@shared/utils/format-date';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { usePermissions } from '@shared/hooks/use-permissions';

import { useRunScript, useScripts } from '../hooks/use-scripts';
import { ConsoleShell } from '../parts/console-shell';
import type { ScriptRow } from '../services/scripts.api';

const TONE: Record<Job['status'], 'info' | 'neutral'> = {
  queued: 'neutral',
  running: 'info',
  succeeded: 'info',
  failed: 'neutral',
  cancelled: 'neutral',
};

/**
 * One past run, with its result.
 *
 * The result is rendered as formatted JSON rather than prose: every script
 * returns a different shape, and a summary sentence written per script would
 * be another thing to keep in step with what the script actually does.
 */
function RunRow({ job }: { readonly job: Job }) {
  const [open, setOpen] = useState(false);
  const payload = job.result ?? job.error;

  return (
    <li className="border-t border-line py-2 first:border-t-0">
      <div className="flex items-center gap-2">
        <Tag size="sm" tone={TONE[job.status]}>
          {job.status}
        </Tag>
        <span className="text-xs text-ink-3">{formatDate(job.created_at)}</span>

        <Show when={!job.is_terminal}>
          <span className="text-xs text-ink-2">
            {job.progress_label ?? 'working'} · {Math.round(job.progress * 100)}%
          </span>
        </Show>

        <Show when={payload !== null && payload !== undefined}>
          <button
            type="button"
            className="ml-auto text-xs font-bold text-sky-deep hover:underline"
            onClick={() => { setOpen(!open); }}
          >
            {open ? 'Hide' : 'Result'}
          </button>
        </Show>
      </div>

      <Show when={open}>
        <pre className="mt-2 max-h-72 overflow-auto rounded-blade-xs bg-paper-2 p-3 text-[11px] leading-relaxed text-ink-2">
          {job.error ?? JSON.stringify(job.result, null, 2)}
        </pre>
      </Show>
    </li>
  );
}

function ScriptCard({ script }: { readonly script: ScriptRow }) {
  const run = useRunScript();
  const { can } = usePermissions();
  const [confirming, setConfirming] = useState(false);

  // Listing is a separate grant from running: somebody debugging can see what
  // exists and what it last returned without being able to fire it.
  const mayRun = can('scripts:write');

  const inFlight = script.recent.some((job) => !job.is_terminal);
  const busy = run.isPending || inFlight;

  const start = (dryRun: boolean): void => {
    run.mutate({ scriptId: script.id, dryRun });
    setConfirming(false);
  };

  return (
    <div className="rounded-blade border border-line bg-white p-4">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <h2 className="font-display text-base font-extrabold text-ink">{script.name}</h2>
          <p className="mt-1 text-xs text-ink-2">{script.description}</p>
          <p className="mt-1 text-xs text-ink-3">
            <span className="font-bold">Effect:</span> {script.effect}
          </p>
        </div>
        <Show when={script.destructive}>
          <Tag size="sm" tone="neutral">
            destructive
          </Tag>
        </Show>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Preview first, and listed first, because "what would this do" is
            the question an operator has before they commit. */}
        <Show when={mayRun && script.supports_dry_run}>
          <Button
            size="sm"
            variant="secondary"
            loading={busy}
            onClick={() => { start(true); }}
          >
            Preview
          </Button>
        </Show>

        <Show when={mayRun && !confirming}>
          <Button
            size="sm"
            loading={busy}
            onClick={() => {
              // A destructive script asks twice. Everything else runs.
              if (script.destructive) setConfirming(true);
              else start(false);
            }}
          >
            Run for real
          </Button>
        </Show>

        <Show when={mayRun && confirming}>
          <span className="flex items-center gap-2">
            <span className="text-xs font-bold text-critical-onsoft">Sure? This writes.</span>
            <Button size="sm" loading={busy} onClick={() => { start(false); }}>
              Yes, run it
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              onClick={() => { setConfirming(false); }}
            >
              Cancel
            </Button>
          </span>
        </Show>

        <Show when={inFlight}>
          <span className="text-xs text-ink-3">already running…</span>
        </Show>
      </div>

      <Show when={run.error !== null}>
        <p className="mt-2 text-xs text-critical-onsoft">{run.error?.message}</p>
      </Show>

      <Show when={!mayRun}>
        <p className="mt-3 text-xs text-ink-4">
          You can see what this does and what it last returned. Running it needs a wider grant.
        </p>
      </Show>

      <Show when={script.recent.length > 0}>
        <ul className="mt-3 border-t border-line pt-1">
          {script.recent.map((job) => (
            <RunRow key={job.id} job={job} />
          ))}
        </ul>
      </Show>
    </div>
  );
}

/**
 * Operations, run from here instead of a shell.
 *
 * Production has no terminal, so a migration written as an npm script is one
 * that cannot be run where it matters. These are declared in the backend's
 * script registry, executed through the ordinary job queue — so they survive a
 * restart and report progress — and every run lands in the audit trail with
 * its result attached.
 */
export default function AdminScriptsScreen() {
  const { data: scripts = [], isLoading } = useScripts();

  return (
    <ConsoleShell active="scripts" title="Operations">
      <p className="mb-4 max-w-[46rem] text-xs text-ink-3">
        Each of these runs as a background job, so it survives a deploy and reports progress.
        Everything is recorded in the audit trail with whatever it returned. They are all safe
        to run twice.
      </p>

      <Show when={isLoading}>
        <p className="text-sm text-ink-3">Loading…</p>
      </Show>

      <div className="flex flex-col gap-3">
        {scripts.map((script) => (
          <ScriptCard key={script.id} script={script} />
        ))}
      </div>
    </ConsoleShell>
  );
}
