import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { Input } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useAdminRecipes } from '../hooks/use-admin';
import { ConsoleShell } from '../parts/console-shell';
import { DataTable, type Column } from '../parts/data-table';
import type { AdminRecipeRow } from '../services/admin.api';

const COLUMNS: Column<AdminRecipeRow>[] = [
  {
    key: 'name',
    header: 'Recipe',
    render: (row) => <span className="font-extrabold text-ink">{row.name}</span>,
  },
  {
    key: 'source',
    header: 'Source',
    render: (row) => (
      <Tag tone={row.source === 'ai' ? 'info' : 'neutral'} size="sm">
        {row.source === 'ai' ? 'generated' : 'written'}
      </Tag>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <Tag tone={row.status === 'published' ? 'info' : 'neutral'} size="sm">
        {row.status}
      </Tag>
    ),
  },
  { key: 'time', header: 'Minutes', numeric: true, render: (row) => row.cook_time_minutes },
  {
    key: 'ingredients',
    header: 'Matched',
    numeric: true,
    render: (row) => (
      // The number that decides whether this recipe can ever be SUGGESTED.
      // Unmatched ingredients are invisible to the matcher.
      <span
        className={
          row.matched_ingredients < row.ingredient_count ? 'text-caution-onsoft' : 'text-ink-2'
        }
      >
        {row.matched_ingredients}/{row.ingredient_count}
      </span>
    ),
  },
  { key: 'steps', header: 'Steps', numeric: true, render: (row) => row.step_count },
];

export default function AdminRecipesScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const { data, isLoading } = useAdminRecipes({
    ...(search.length > 0 && { search }),
    ...(status.length > 0 && { status }),
    limit: 100,
  });

  return (
    <ConsoleShell
      active="recipes"
      title="Recipes"
      actions={
        <Button
          size="sm"
          onClick={() => {
            void navigate({ to: ROUTES.ADMIN_RECIPE_NEW });
          }}
        >
          Add recipes
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
          className="max-w-[280px]"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
          }}
          aria-label="Filter by status"
          className="rounded-blade-xs border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        <Show when={data !== undefined}>
          <span className="ml-auto font-mono text-xs text-ink-3">
            {data?.total ?? 0} total
          </span>
        </Show>
      </div>

      <DataTable
        rows={data?.items ?? []}
        columns={COLUMNS}
        isLoading={isLoading}
        empty="No recipes match that."
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          void navigate({ to: ROUTES.ADMIN_RECIPE(row.id) });
        }}
      />
    </ConsoleShell>
  );
}
