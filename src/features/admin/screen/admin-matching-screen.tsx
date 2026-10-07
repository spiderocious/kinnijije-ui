import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDate } from '@shared/utils/format-date';
import { MetricTile } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Select } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useMatchRules, useSetRuleEnabled } from '../hooks/use-matching';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { MatchRule, RuleStatus } from '../services/matching.api';

/**
 * The matching studio.
 *
 * A way to say "when somebody has this, serve that" without touching the
 * ranker. Rules are consulted first; anything they do not cover falls through
 * to the existing engine untouched, and the model still writes the sentence
 * either way.
 *
 * The numbers on each row are the point. A rule that fires often and is never
 * cooked is worse than no rule, and only served-versus-cooked will say so.
 */

const STATUS_LABEL: Record<RuleStatus, string> = {
  draft: 'Draft',
  pending: 'Waiting for approval',
  live: 'Live',
  retired: 'Retired',
};

const STATUS_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '', label: 'All rules' },
  { value: 'live', label: 'Live' },
  { value: 'draft', label: 'Drafts' },
  { value: 'pending', label: 'Waiting for approval' },
  { value: 'retired', label: 'Retired' },
];

/**
 * A rule's conditions, in a line somebody can read.
 *
 * Built from the clauses actually present, so a rule reads as what it says
 * rather than as a template with blanks. "Anything" is honest for a
 * catch-all — it is a legitimate rule, and hiding that would be worse.
 */
function describeWhen(rule: MatchRule): string {
  const parts: string[] = [];
  const { when } = rule;

  if ((when.allOf?.length ?? 0) > 0) parts.push(`has ${when.allOf?.join(' + ') ?? ''}`);
  if ((when.anyOf?.length ?? 0) > 0) parts.push(`any of ${when.anyOf?.join(', ') ?? ''}`);
  if ((when.noneOf?.length ?? 0) > 0) parts.push(`without ${when.noneOf?.join(', ') ?? ''}`);
  if ((when.moods?.length ?? 0) > 0) parts.push(`feeling ${when.moods?.join(' or ') ?? ''}`);
  if ((when.weights?.length ?? 0) > 0) parts.push(`wants ${when.weights?.join(' or ') ?? ''}`);

  const minutes = when.minutes;
  if (minutes !== undefined) {
    const min = minutes.min ?? null;
    const max = minutes.max ?? null;
    if (min !== null && max !== null) parts.push(`${String(min)} to ${String(max)} minutes`);
    else if (max !== null) parts.push(`under ${String(max)} minutes`);
    else if (min !== null) parts.push(`over ${String(min)} minutes`);
  }

  const hour = when.hour;
  if (hour !== undefined && (hour.min ?? null) !== null) {
    parts.push(`between ${String(hour.min)}:00 and ${String(hour.max ?? 23)}:00`);
  }

  if (when.weather !== undefined && when.weather !== null) parts.push(when.weather);
  if ((when.cities?.length ?? 0) > 0) parts.push(`in ${when.cities?.join(', ') ?? ''}`);

  return parts.length === 0 ? 'Anything' : parts.join(', ');
}

/**
 * The cook rate, which is the number that decides whether a rule earns its
 * place. Null until it has served enough to mean anything — a rule shown as
 * "0 percent" after two servings reads as a failure when it is just new.
 */
function cookRate(rule: MatchRule): number | null {
  if (rule.stats.served < 10) return null;
  return Math.round((rule.stats.cooked / rule.stats.served) * 100);
}

export default function AdminMatchingScreen() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('');

  const { data, isLoading } = useMatchRules({
    ...(status !== '' && { status: status as RuleStatus }),
  });
  const setEnabled = useSetRuleEnabled();

  const rules = data?.rules ?? [];

  /**
   * Is the serving index behind the database?
   *
   * A published rule that never reached the index is approved and does
   * nothing, which is the most confusing possible state — so it is surfaced
   * rather than left for somebody to deduce.
   */
  const liveCount = data?.liveCount ?? 0;
  const indexSize = data?.index.size ?? 0;
  const indexStale = !isLoading && liveCount !== indexSize;

  const columns: Column<MatchRule>[] = [
    {
      key: 'name',
      header: 'Rule',
      render: (row) => (
        <button
          type="button"
          className="flex flex-col text-left hover:underline"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_MATCHING_RULE(row.id) });
          }}
        >
          <span className="font-extrabold text-ink">{row.name}</span>
          <span className="text-xs text-ink-3">{describeWhen(row)}</span>
        </button>
      ),
    },
    {
      key: 'then',
      header: 'Serves',
      render: (row) => (
        <span className="text-sm text-ink-2">
          {row.then.mode === 'boost' ? 'Lifts ' : ''}
          {row.then.meals.length} meal{row.then.meals.length === 1 ? '' : 's'}
          <Show when={row.branches.length > 0}>
            <span className="text-xs text-ink-3">
              {` · ${String(row.branches.length)} branch${row.branches.length === 1 ? '' : 'es'}`}
            </span>
          </Show>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <Tag size="sm" tone={row.status === 'live' ? 'info' : 'neutral'}>
            {STATUS_LABEL[row.status]}
          </Tag>
          {/* Shadow and the kill switch both mean "live but not serving", and
              a curator needs to tell them apart at a glance. */}
          <Show when={row.shadow}>
            <span className="text-xs font-extrabold text-grape-on">Shadow</span>
          </Show>
          <Show when={!row.enabled}>
            <span className="text-xs font-extrabold text-critical-on">Switched off</span>
          </Show>
        </div>
      ),
    },
    {
      key: 'specificity',
      header: 'Clauses',
      numeric: true,
      render: (row) => row.specificity,
    },
    {
      key: 'stats',
      header: 'Matched / served / cooked',
      render: (row) => {
        const rate = cookRate(row);
        return (
          <div className="flex flex-col">
            <span className="font-mono text-xs text-ink">
              {row.stats.matched} / {row.stats.served} / {row.stats.cooked}
            </span>
            <Show when={rate !== null}>
              <span
                className={`text-xs font-extrabold ${
                  (rate ?? 0) < 20 ? 'text-caution-on' : 'text-ink-3'
                }`}
              >
                {rate}% cooked
              </span>
            </Show>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Show when={row.status === 'live'}>
          <Button
            size="sm"
            variant="secondary"
            loading={setEnabled.isPending}
            onClick={() => {
              setEnabled.mutate({ ruleId: row.id, enabled: !row.enabled });
            }}
          >
            {row.enabled ? 'Switch off' : 'Switch on'}
          </Button>
        </Show>
      ),
    },
  ];

  return (
    <ConsoleShell
      active="matching"
      title="Matching studio"
      actions={
        <Button
          size="sm"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_MATCHING_NEW });
          }}
        >
          New rule
        </Button>
      }
    >
      <Show when={indexStale}>
        <div className="mb-4">
          <Callout
            tone="caution"
            title="The serving index does not match the database"
            body={`${String(liveCount)} rules are live but the index holds ${String(indexSize)}. A rule that is live but not indexed serves nothing. This usually clears itself on the next publish or restart.`}
          />
        </div>
      </Show>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Live" value={liveCount} />
        <MetricTile label="Indexed" value={indexSize} />
        <MetricTile label="Drafts" value={rules.filter((row) => row.status === 'draft').length} />
        <MetricTile label="In shadow" value={rules.filter((row) => row.shadow).length} />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select
          label="Status"
          value={status}
          onValueChange={setStatus}
          options={STATUS_OPTIONS}
          size="sm"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_MATCHING_TEST });
          }}
        >
          Test a kitchen
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_MATCHING_COVERAGE });
          }}
        >
          Coverage map
        </Button>
      </div>

      <DataTable
        rows={rules}
        columns={columns}
        isLoading={isLoading}
        empty="No rules yet. The ranker is deciding everything."
        rowKey={(row) => row.id}
      />

      <Show when={rules.length > 0}>
        <p className="mt-4 text-xs text-ink-3">
          Last indexed {data === undefined ? 'never' : formatDate(data.index.built_at)}. A rule
          replaces the ranking, never the writing: the model still writes the sentence.
        </p>
      </Show>
    </ConsoleShell>
  );
}
