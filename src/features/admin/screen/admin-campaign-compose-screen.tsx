import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { Input, Select } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useCampaignOverview, useCompose, useUserSearch } from '../hooks/use-campaigns';
import { ConsoleShell } from '../parts/console-shell';

/** Matches the server's cap: previewing a digest is a model call per person. */
const MAX_RECIPIENTS = 25;

/**
 * Build one kind for named users.
 *
 * The prototyping loop: tweak a template or a prompt, generate against a few
 * real accounts, read exactly what comes out. It drafts through the SAME
 * builder the sweep uses — a separate render path would mean testing the
 * composer rather than the thing that actually sends.
 */
export default function AdminCampaignComposeScreen() {
  const navigate = useNavigate();
  const { data } = useCampaignOverview();
  const compose = useCompose();

  const [kind, setKind] = useState('');
  const [term, setTerm] = useState('');
  const [picked, setPicked] = useState<{ id: string; email: string }[]>([]);

  const { data: hits = [], isFetching } = useUserSearch(term);
  const kinds = data?.kinds ?? [];
  const atCap = picked.length >= MAX_RECIPIENTS;

  const add = (user: { id: string; email: string }): void => {
    if (atCap || picked.some((p) => p.id === user.id)) return;
    setPicked([...picked, user]);
    setTerm('');
  };

  return (
    <ConsoleShell active="campaigns" title="Compose an email">
      <p className="mb-4 max-w-[46rem] text-xs text-ink-3">
        Builds a real draft for the people you pick, using the same code the scheduled sweep
        uses. Nothing is sent — it lands as a batch you review and approve, so this is safe to
        use for testing against live accounts.
      </p>

      <div className="rounded-blade border border-line bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Kind"
            value={kind === '' ? undefined : kind}
            onValueChange={setKind}
            placeholder="Which email…"
            options={kinds.map((row) => ({ value: row.kind, label: row.kind }))}
          />

          <label className="flex flex-1 flex-col gap-1" style={{ minWidth: '16rem' }}>
            <span className="text-xs font-bold text-ink-2">Find people by email or name</span>
            <Input
              value={term}
              placeholder="Type at least two characters…"
              onChange={(event) => { setTerm(event.target.value); }}
            />
          </label>
        </div>

        <Show when={term.trim().length >= 2}>
          <div className="mt-2 flex flex-wrap gap-2">
            <Show when={isFetching}>
              <span className="text-xs text-ink-4">searching…</span>
            </Show>
            {hits.map((user) => (
              <Button
                key={user.id}
                size="sm"
                variant="secondary"
                disabled={atCap || picked.some((p) => p.id === user.id)}
                onClick={() => { add({ id: user.id, email: user.email }); }}
              >
                {user.email}
              </Button>
            ))}
            <Show when={hits.length === 0 && !isFetching}>
              <span className="text-xs text-ink-4">nobody matches</span>
            </Show>
          </div>
        </Show>

        <Show when={picked.length > 0}>
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-2 text-xs font-bold text-ink-2">
              {picked.length} selected{atCap ? ` — that is the cap of ${String(MAX_RECIPIENTS)}` : ''}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {picked.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => { setPicked(picked.filter((p) => p.id !== user.id)); }}
                >
                  <Tag size="sm" tone="info">{user.email} ✕</Tag>
                </button>
              ))}
            </div>
          </div>
        </Show>

        <div className="mt-4 flex items-center gap-3">
          <Button
            loading={compose.isPending}
            disabled={kind === '' || picked.length === 0}
            onClick={() => {
              compose.mutate(
                { kind, userIds: picked.map((user) => user.id) },
                {
                  onSuccess: (result) => {
                    // Straight into review, which is where the output is.
                    void navigate({ to: ROUTES.ADMIN_CAMPAIGN_BATCH(result.batchId) });
                  },
                },
              );
            }}
          >
            Build &amp; preview
          </Button>
          <span className="text-xs text-ink-3">
            Capped at {MAX_RECIPIENTS}: building a digest runs a model call per person.
          </span>
        </div>

        <Show when={compose.error !== null}>
          <p className="mt-2 text-xs text-critical-onsoft">{compose.error?.message}</p>
        </Show>
      </div>
    </ConsoleShell>
  );
}
