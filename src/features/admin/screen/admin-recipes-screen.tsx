import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { Callout } from '@ui/feedback';
import { Checkbox, Input } from '@ui/inputs';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import { useAdminRecipes, useDeleteRecipes, useSetRecipesStatus } from '../hooks/use-admin';
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

/**
 * A checkbox inside a clickable row.
 *
 * The row opens the recipe on click, so the box has to keep its click to
 * itself — otherwise ticking a recipe would also navigate away from the list
 * you are building a selection in.
 */
function RowBox({ children }: { readonly children: React.ReactNode }) {
  return (
    <span
      className="inline-flex"
      onClick={(event) => {
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
      }}
      role="presentation"
    >
      {children}
    </span>
  );
}

export default function AdminRecipesScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const { data, isLoading } = useAdminRecipes({
    ...(search.length > 0 && { search }),
    ...(status.length > 0 && { status }),
    limit: 100,
  });

  /**
   * The multi-select, held as ids and read back through the rows on screen.
   *
   * Filtering or searching narrows what is visible, and a selection that
   * silently kept recipes you can no longer see is how the wrong thing gets
   * deleted. So only visible, ticked recipes count — "select all" means all
   * of THIS list, and the count on the button always matches what you see.
   */
  const remove = useDeleteRecipes();
  const setStatusMany = useSetRecipesStatus();
  const [statusDone, setStatusDone] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const rows = data?.items ?? [];
  const selectedRows = rows.filter((row) => selected.has(row.id));
  const publishedSelected = selectedRows.filter((row) => row.status === 'published').length;
  const draftSelected = selectedRows.length - publishedSelected;

  /**
   * Publish or unpublish, straight away — no second click. Unlike a delete it
   * is fully reversible from the same bar, so a confirmation would only slow
   * down the thing somebody does fifty times while curating.
   */
  const changeStatus = (next: 'draft' | 'published') => {
    setStatusDone(null);
    setStatusMany.mutate(
      { ids: selectedRows.map((row) => row.id), status: next },
      {
        onSuccess: (result) => {
          const verb = next === 'published' ? 'Published' : 'Unpublished';
          setStatusDone(
            `${verb} ${String(result.changed)} ${result.changed === 1 ? 'recipe' : 'recipes'}` +
              (result.unchanged > 0 ? ` — ${String(result.unchanged)} already were` : '') +
              '.',
          );
        },
      },
    );
  };
  const headerState =
    rows.length > 0 && selectedRows.length === rows.length ? true : selectedRows.length > 0 ? 'mixed' : false;

  const toggleAll = (on: boolean) => {
    setSelected(on ? new Set(rows.map((row) => row.id)) : new Set());
    setConfirming(false);
  };

  const columns: Column<AdminRecipeRow>[] = [
    {
      key: 'select',
      header: (
        <Checkbox
          checked={headerState}
          disabled={rows.length === 0}
          onCheckedChange={(on) => {
            // A partly-ticked header clears rather than fills: clearing is the
            // safer of the two when a delete sits one click away.
            toggleAll(headerState === 'mixed' ? false : on);
          }}
        >
          <span className="sr-only">Select all recipes shown</span>
        </Checkbox>
      ),
      render: (row) => (
        <RowBox>
          <Checkbox
            checked={selected.has(row.id)}
            onCheckedChange={(on) => {
              setSelected((current) => {
                const next = new Set(current);
                if (on) next.add(row.id);
                else next.delete(row.id);
                return next;
              });
              setConfirming(false);
            }}
          >
            <span className="sr-only">Select {row.name}</span>
          </Checkbox>
        </RowBox>
      ),
    },
    ...COLUMNS,
  ];

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

      <Show when={remove.error !== null}>
        <Callout
          tone="critical"
          title="Nothing was deleted"
          body={remove.error?.message ?? ''}
          className="mb-4"
        />
      </Show>

      <Show when={setStatusMany.error !== null}>
        <Callout
          tone="critical"
          title="The status did not change"
          body={setStatusMany.error?.message ?? ''}
          className="mb-4"
        />
      </Show>

      {/* Kept while the selection stays, so a second action can follow. */}
      <Show when={statusDone !== null}>
        <p className="mb-3 text-xs font-extrabold text-success-onsoft">{statusDone}</p>
      </Show>

      <Show when={remove.data !== undefined && selectedRows.length === 0}>
        <p className="mb-3 text-xs font-extrabold text-success-onsoft">
          Deleted {remove.data?.deleted ?? 0} {remove.data?.deleted === 1 ? 'recipe' : 'recipes'}
          {(remove.data?.missing.length ?? 0) > 0
            ? ` — ${String(remove.data?.missing.length ?? 0)} had already been deleted elsewhere`
            : ''}
          .
        </p>
      </Show>

      {/* The bulk bar, only while something is ticked. Deleting takes a
          second click, and names how many are live on the site: deleting a
          published recipe takes it out of everybody's suggestions at once. */}
      <Show when={selectedRows.length > 0}>
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-blade-xs border border-line bg-paper-2 px-3 py-2">
          <span className="text-xs font-extrabold text-ink">
            {selectedRows.length} selected
            {publishedSelected > 0 && (
              <span className="font-bold text-caution-onsoft"> · {publishedSelected} published</span>
            )}
          </span>

          <Show
            when={confirming}
            fallback={
              <>
                {/* Each only when it would change something: "Unpublish" on a
                    selection of drafts is a button that does nothing. */}
                <Show when={publishedSelected > 0}>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={setStatusMany.isPending && setStatusMany.variables.status === 'draft'}
                    disabled={setStatusMany.isPending}
                    onClick={() => {
                      changeStatus('draft');
                    }}
                  >
                    Unpublish {publishedSelected}
                  </Button>
                </Show>
                <Show when={draftSelected > 0}>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={setStatusMany.isPending && setStatusMany.variables.status === 'published'}
                    disabled={setStatusMany.isPending}
                    onClick={() => {
                      changeStatus('published');
                    }}
                  >
                    Publish {draftSelected}
                  </Button>
                </Show>
                <Button
                  size="sm"
                  variant="tertiary"
                  destructive
                  onClick={() => {
                    setConfirming(true);
                  }}
                >
                  Delete selected
                </Button>
                <Button
                  size="sm"
                  variant="tertiary"
                  onClick={() => {
                    toggleAll(false);
                  }}
                >
                  Clear
                </Button>
              </>
            }
          >
            <span className="text-xs font-extrabold text-caution-onsoft">
              Delete {selectedRows.length} {selectedRows.length === 1 ? 'recipe' : 'recipes'} for good?
            </span>
            <Button
              size="sm"
              destructive
              loading={remove.isPending}
              onClick={() => {
                remove.mutate(
                  selectedRows.map((row) => row.id),
                  {
                    onSuccess: () => {
                      setSelected(new Set());
                    },
                    onSettled: () => {
                      setConfirming(false);
                    },
                  },
                );
              }}
            >
              Yes, delete
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              onClick={() => {
                setConfirming(false);
              }}
            >
              No
            </Button>
          </Show>
        </div>
      </Show>

      <DataTable
        rows={rows}
        columns={columns}
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
