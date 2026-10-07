import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ExternalLink } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { formatDate } from '@shared/utils/format-date';
import { InfoCard } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';
import { DrawerService } from '@ui/drawer';

import {
  usePromoteSuggestion,
  useRejectSuggestion,
  useSuggestions,
} from '../hooks/use-admin-suggestions';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { SuggestionRow } from '../services/suggestions.api';

/**
 * The review queue for dishes the planner invented.
 *
 * WHY THIS SCREEN EXISTS. The composing planner proposes plates that are not
 * in our catalogue — "beans porridge with fried plantain" — and those reach
 * cooks immediately with the model's own steps behind them. That is the deal
 * the inverted planner makes: more reach, less curation.
 *
 * This is where the curation happens. A dish proposed forty times is one
 * worth having as a real recipe with a tested method and a photo, and
 * `timesSuggested` is what points at those. Promoting creates a DRAFT, never
 * a published meal.
 */

const FILTERS = [
  { value: 'new', label: 'To review' },
  { value: 'promoted', label: 'Promoted' },
  { value: 'rejected', label: 'Rejected' },
] as const;

/** The roles, in the order a plate is built. */
const ROLE_ORDER: Record<string, number> = {
  base: 0,
  sauce: 1,
  protein: 2,
  side: 3,
  drink: 4,
};

export default function AdminSuggestionsScreen() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SuggestionRow['status']>('new');

  const { data, isLoading } = useSuggestions({ status, limit: 100 });
  const promote = usePromoteSuggestion();
  const reject = useRejectSuggestion();

  const suggestions = data?.suggestions ?? [];

  const columns: Column<SuggestionRow>[] = [
    {
      key: 'name',
      header: 'Dish',
      render: (row) => (
        <div>
          <p className="font-extrabold text-ink">{row.name}</p>
          <p className="mt-0.5 max-w-[46ch] text-xs text-ink-3">{row.why}</p>
        </div>
      ),
    },
    {
      /**
       * THE COLUMN A REVIEWER ACTUALLY READS.
       *
       * The parts say whether the model proposed a real meal — a base with a
       * sauce — or another lone component, which is the exact failure this
       * whole planner rewrite was built to fix. Visible at a glance, without
       * opening the steps.
       */
      key: 'parts',
      header: 'The plate',
      render: (row) =>
        row.parts.length === 0 ? (
          <span className="text-xs text-ink-4">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {[...row.parts]
              .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9))
              .map((part) => (
                <span
                  key={`${part.role}-${part.name}`}
                  className="rounded-pill border border-line-2 bg-paper-2 px-2 py-0.5 text-xs text-ink-2"
                >
                  <span className="font-mono text-[10px] uppercase text-ink-4">{part.role}</span>{' '}
                  {part.name}
                </span>
              ))}
          </div>
        ),
    },
    {
      key: 'substance',
      header: 'Filling',
      numeric: true,
      render: (row) =>
        row.substance === null ? (
          <span className="text-xs text-ink-4">—</span>
        ) : (
          <span className={row.substance >= 4 ? 'font-extrabold text-ink' : 'text-ink-2'}>
            {row.substance}/5
          </span>
        ),
    },
    {
      key: 'times',
      header: 'Seen',
      numeric: true,
      render: (row) => (
        <span className={row.timesSuggested >= 5 ? 'font-extrabold text-sky-on' : undefined}>
          {row.timesSuggested}x
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'First seen',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-ink-3">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.status === 'promoted' && row.promotedMealId !== null ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void navigate({ to: ROUTES.ADMIN_RECIPE(row.promotedMealId ?? '') });
            }}
          >
            <ExternalLink size={13} strokeWidth={2.4} />
            Open draft
          </Button>
        ) : row.status === 'rejected' ? (
          <Tag size="sm" tone="neutral">
            rejected
          </Tag>
        ) : (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              loading={promote.isPending && promote.variables === row.id}
              onClick={() => {
                promote.mutate(row.id, {
                  onSuccess: (result) => {
                    DrawerService.toast(
                      result.alreadyPromoted
                        ? 'That one was already promoted.'
                        : `"${row.name}" is now a draft recipe.`,
                      { tone: 'success' },
                    );
                  },
                  onError: (failure) => {
                    DrawerService.toast(failure.message, { tone: 'critical' });
                  },
                });
              }}
            >
              Promote
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={reject.isPending && reject.variables === row.id}
              onClick={() => {
                reject.mutate(row.id, {
                  onError: (failure) => {
                    DrawerService.toast(failure.message, { tone: 'critical' });
                  },
                });
              }}
            >
              Reject
            </Button>
          </div>
        ),
    },
  ];

  return (
    <ConsoleShell active="suggestions" title="Planner suggestions">
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            size="sm"
            variant={status === filter.value ? 'primary' : 'secondary'}
            onClick={() => {
              setStatus(filter.value);
            }}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <Show when={status === 'new'}>
        <div className="mb-4">
          <Callout
            tone="info"
            title="These are dishes the planner invented"
            body="The composing planner proposes plates that are not in our catalogue, and cooks see them straight away with the model's own method. Promoting one creates a DRAFT recipe for review — it is never published from here. Dishes seen many times are the ones worth making real."
          />
        </div>
      </Show>

      <InfoCard title={`${String(data?.total ?? 0)} ${status === 'new' ? 'to review' : status}`}>
        <DataTable
          rows={suggestions}
          columns={columns}
          isLoading={isLoading}
          rowKey={(row) => row.id}
          empty={
            status === 'new'
              ? 'Nothing waiting. The planner has not invented anything new.'
              : `No ${status} suggestions.`
          }
        />
      </InfoCard>
    </ConsoleShell>
  );
}
