import { useState } from 'react';

import { Blob } from '@icons';
import { Button } from '@ui/primitives/button/button';
import { IconButton } from '@ui/primitives/icon-button/icon-button';
import { Figure } from '@ui/display/figure/figure';
import { DiffView, JsonInspector } from '@ui/display/json-inspector/json-inspector';
import { CursorPager, Table, TableSkeleton, type TableColumn } from '@ui/display/table/table';
import { EmptyFiltered } from '@ui/feedback/empty-state/empty-state';
import { Panel } from '@ui/structure/panel/panel';
import { Row } from '@ui/structure/rows/rows';
import { Status } from '@ui/status/status/status';
import { Provenance, isApproximate, type RecipeSource } from '@ui/domain/provenance/provenance';

import { Api, Demo, Note, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/91-table.html
 *                                                          93-cursor-pager.html
 *                                                          103-json-inspector.html
 *                                                          104-diff-view.html
 *                                                          15-density.html
 *              design-system/projects/kinnijije-v2/preview-admin/a03-recipes.html
 *                                                                a05-ai-audit.html
 */

interface RecipeRecord {
  id: string;
  name: string;
  source: RecipeSource;
  minutes: number;
  status: 'published' | 'draft';
}

const RECIPES: RecipeRecord[] = [
  { id: '1', name: 'Jollof Rice, Party Style', source: 'seed', minutes: 45, status: 'published' },
  { id: '2', name: 'Egusi Soup & Pounded Yam', source: 'seed', minutes: 70, status: 'draft' },
  { id: '3', name: 'Ewa Agoyin & Plantain', source: 'ai', minutes: 55, status: 'published' },
  { id: '4', name: 'Efo Riro', source: 'seed', minutes: 40, status: 'published' },
  { id: '5', name: 'Moi Moi', source: 'ai', minutes: 90, status: 'draft' },
];

const COLUMNS: TableColumn<RecipeRecord>[] = [
  { key: 'name', header: 'Recipe', sortable: true, render: (row) => row.name },
  {
    key: 'source',
    header: 'Source',
    width: '150px',
    render: (row) => <Provenance source={row.source} size="sm" />,
  },
  {
    key: 'minutes',
    header: 'Time',
    numeric: true,
    sortable: true,
    width: '96px',
    render: (row) => (
      <Figure value={row.minutes} unit="m" approximate={isApproximate(row.source)} size="sm" />
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: '130px',
    render: (row) => <Status kind="recipe" value={row.status} size="sm" />,
  },
];

const PROMPT_BEFORE = `You are a Nigerian home cook.
Use only the ingredients given.
Keep steps under 10.
Return JSON.`;

const PROMPT_AFTER = `You are a Nigerian home cook.
Use only the ingredients given.
Keep steps under 8.
Pad the cook time by 30%.
Return JSON.`;

export function TablePart() {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });

  return (
    <Specimen
      title="Data table · Cursor pager"
      spec="91-table.html · 93-cursor-pager.html"
      description="The curator's missing primitives. The shipped app contains zero table markup."
    >
      <Rule>
        <b>The shipped app contains ZERO <code>&lt;table&gt;</code> markup.</b> Four admin record
        lists, all rendered as stacks of cards — so no column headers, no alignment, no scanning
        down a column, in an app whose entire job is comparing records.
      </Rule>

      <Section label="THE TABLE — at COUNTER density">
        <Demo tone="plain">
          <div className="counter rounded-blade border border-line-2 bg-white p-4">
            <Table
              columns={COLUMNS}
              rows={RECIPES}
              rowKey={(row) => row.id}
              sort={sort}
              onSortChange={(key, direction) => setSort({ key, direction })}
              onRowClick={() => {}}
              caption="Recipes"
            />
            <CursorPager rangeLabel="1–5 of many" hasPrev={false} hasMore onPrev={() => {}} onNext={() => {}} />
          </div>
        </Demo>
        <Note>
          Click a sortable head. Figures render through <code>Figure</code>, so the Time column
          aligns <b>by construction</b> rather than by every cell remembering to be monospace — and
          the AI row keeps its <code>≈</code>.
        </Note>
      </Section>

      <Section label="STATES">
        <Demo tone="plain">
          <div className="counter flex flex-col gap-5">
            <div className="rounded-blade border border-line-2 bg-white p-4">
              <p className="mb-3 font-mono text-xs font-bold uppercase">skeleton</p>
              <TableSkeleton columns={COLUMNS} rows={4} />
            </div>

            <div className="rounded-blade border border-line-2 bg-white p-4">
              <p className="mb-3 font-mono text-xs font-bold uppercase">loading (re-sorting)</p>
              <Table columns={COLUMNS} rows={RECIPES.slice(0, 3)} rowKey={(row) => row.id} loading />
            </div>

            <div className="rounded-blade border border-line-2 bg-white p-4">
              <p className="mb-3 font-mono text-xs font-bold uppercase">empty (filtered)</p>
              <EmptyFiltered filterCount={2} onClear={() => {}} />
            </div>

            <div className="rounded-blade border border-critical-border bg-critical-soft p-4">
              <p className="font-display text-md font-extrabold text-critical-onsoft">
                Could not load recipes
              </p>
              <p className="mt-1 text-sm text-ink-2">
                The server did not answer. Your filters are kept.
              </p>
              <Button variant="secondary" size="sm" className="mt-3">
                Try again
              </Button>
            </div>
          </div>
        </Demo>
        <Note>
          Re-sorting keeps the existing rows and dims them — a table that empties while it re-sorts
          loses the curator's place.
        </Note>
      </Section>

      <Section label="CURSOR PAGER">
        <Demo tone="plain">
          <div className="counter flex flex-col gap-2">
            <CursorPager rangeLabel="21–40" hasPrev hasMore onPrev={() => {}} onNext={() => {}} />
            <CursorPager rangeLabel="21–40" hasPrev hasMore loading onPrev={() => {}} onNext={() => {}} />
            <CursorPager rangeLabel="41–48" hasPrev hasMore={false} onPrev={() => {}} onNext={() => {}} />
          </div>
        </Demo>
        <Note>
          <b>The API is cursor-only</b> — no offset, no total count. A page-number control is
          literally unservable, so there is no <code>page</code> or <code>total</code> prop and the
          range is descriptive (“21–40”), never “page 2 of 9”.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<Table columns* rows* rowKey* sort? onSortChange? onRowClick?
       stickyHeader? loading? caption? />
<CursorPager rangeLabel* hasPrev* hasMore* onPrev* onNext* loading? />

// figures render through Figure so a column aligns by construction
// NO page-number pagination — the API is cursor-only
// there is NO \`page\` or \`total\` prop — the API cannot supply them`}</Api>
      </Section>
    </Specimen>
  );
}

export function AuditPart() {
  return (
    <Specimen
      title="JSON inspector · Diff view"
      spec="103-json-inspector.html · 104-diff-view.html"
      description="The AI audit trail's core surfaces — what went in, what came out, and what changed."
    >
      <Rule>
        The inspector <b>scrolls inside its own box and never widens its parent</b>. A large model
        payload is the single most reliable way to blow out a console layout, so the overflow is
        contained here rather than left to a page-level fix.
      </Rule>

      <Section label="WENT IN / CAME OUT">
        <Demo tone="plain">
          <div className="counter grid gap-4 md:grid-cols-2">
            <JsonInspector
              label="Went in"
              value={{
                model: 'gpt-4o',
                ingredients: ['rice', 'tomato', 'pepper'],
                prefs: { cuisines: ['Nigerian'], difficultyFloor: 'medium' },
              }}
            />
            <JsonInspector
              label="Came out"
              value={{
                name: 'Jollof Rice',
                minutes: 58,
                approximate: true,
                steps: ['Blend the peppers', 'Fry the paste', 'Add rice and stock'],
              }}
            />
          </div>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo tone="plain">
          <div className="counter grid gap-4 md:grid-cols-2">
            <JsonInspector label="Empty" value={null} />
            <JsonInspector label="Unparseable" value={'{"model": "gpt-4o", ingredients: [rice'} />
          </div>
        </Demo>
        <Note>
          An unparseable payload shows <b>raw</b> rather than nothing — the whole point of an audit
          trail is that you can see what actually happened, including when what happened was
          malformed.
        </Note>
      </Section>

      <Section label="DIFF — prompt versions">
        <Demo tone="plain">
          <div className="counter">
            <DiffView
              before={PROMPT_BEFORE}
              after={PROMPT_AFTER}
              beforeLabel="v3 (current)"
              afterLabel="v4 (draft)"
            />
          </div>
        </Demo>
        <Note>
          Deliberately line-level rather than word-level: a curator comparing two prompt versions
          needs to see <b>which instruction changed</b>, and a word-level diff scatters that across
          a paragraph.
        </Note>
      </Section>
    </Specimen>
  );
}

export function ConsolePart() {
  return (
    <Specimen
      title="The COUNTER register"
      spec="15-density.html · preview-admin/a01-shell.html"
      description="The curator's console — the same system at a different density, resolved by one wrapper class."
    >
      <Rule>
        <b>One wrapper class resolves the whole register.</b> No component takes a density prop.
        Colours, semantics, type families and the blade law are <i>identical</i> in both registers —
        only the box changes. That is what makes it one stance rather than two systems.
      </Rule>

      <Section label="THE SAME PANEL, BOTH REGISTERS">
        <Demo tone="plain">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase">KITCHEN — the cook</p>
              <Panel>
                <Panel.Header
                  title="Recipes"
                  action={<IconButton icon="plus" label="Add" size="sm" variant="tertiary" />}
                />
                <Panel.List>
                  <Row.Recipe name="Jollof Rice" source="seed" minutes={45} serves={4} status="published" />
                  <Row.Recipe name="Egusi Soup" source="ai" minutes={70} serves={6} status="draft" />
                </Panel.List>
              </Panel>
            </div>

            <div className="counter">
              <p className="mb-2 font-mono text-xs font-bold uppercase">COUNTER — the curator</p>
              <Panel>
                <Panel.Header
                  title="Recipes"
                  action={<IconButton icon="plus" label="Add" size="sm" variant="tertiary" />}
                />
                <Panel.List>
                  <Row.Recipe name="Jollof Rice" source="seed" minutes={45} serves={4} status="published" />
                  <Row.Recipe name="Egusi Soup" source="ai" minutes={70} serves={6} status="draft" />
                </Panel.List>
              </Panel>
            </div>
          </div>
        </Demo>
        <Note>
          Identical markup. The right column sits inside <code>.counter</code>, which re-resolves
          control heights, padding, row gap, control font size and the three larger blade radii at
          once.
        </Note>
      </Section>

      <Section label="THE CURATOR'S USER LIST">
        <Demo tone="plain">
          <div className="counter">
            <Panel>
              <Panel.Header title="Users" />
              <Panel.List>
                <Row.Person
                  name="Ada Obi"
                  email="ada@kinnijije.ng"
                  role="admin"
                  status="active"
                  avatar={<Blob name="ada@kinnijije.ng" size={30} />}
                  onPress={() => {}}
                />
                <Row.Person
                  name="Tunde Bello"
                  email="tunde@kinnijije.ng"
                  role="user"
                  status="active"
                  avatar={<Blob name="tunde@kinnijije.ng" size={30} />}
                  onPress={() => {}}
                />
                <Row.Person
                  name="Chidinma Eze"
                  email="chidinma@kinnijije.ng"
                  role="user"
                  status="suspended"
                  avatar={<Blob name="chidinma@kinnijije.ng" size={30} />}
                  onPress={() => {}}
                />
              </Panel.List>
              <CursorPager
                rangeLabel="1–3 of many"
                hasPrev={false}
                hasMore
                onPrev={() => {}}
                onNext={() => {}}
                className="px-3"
              />
            </Panel>
          </div>
        </Demo>
        <Note>
          Suspending is a consequential act on a person, so <code>suspended</code> is
          critical-toned — and in the app it sits behind{' '}
          <code>DrawerService.critical()</code>, the type-to-confirm modal.
        </Note>
      </Section>
    </Specimen>
  );
}
