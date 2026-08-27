import { useState } from 'react';

import {
  BoardRow,
  BulkActionBar,
  ColumnSettings,
  CostLedgerLine,
  DangerAction,
  ExportButton,
  FilterTabs,
  GlobalSearch,
  InfoCard,
  JsonEditor,
  MarkdownEditor,
  MetricTile,
  PageHeader,
  ReasonInput,
  SectionNav,
  SegmentedRange,
  Toolbar,
  type RangeKey,
} from '@ui/admin';

import { Demo, Grid, Note, Row, Rule, Section, Specimen, Stack } from './preview-canvas';

/**
 * Visual spec: preview-admin/a01-shell · a03-recipes · a04-recipe-editor
 *              a05-ai-audit · a07-users · a08-feedback · a09-flags
 *
 * The COUNTER register's own controls — the ones with no consumer equivalent.
 * A curator selects, filters, exports, compares and reverses; a cook does none
 * of those, which is why treating this register as "the app at 34px" missed
 * roughly a hundred components the first time.
 */

const TABS = [
  { id: 'all', label: 'All', count: 412 },
  { id: 'draft', label: 'Draft', count: 18 },
  { id: 'review', label: 'In review', count: 6 },
  { id: 'published', label: 'Published', count: 388 },
];

const COLUMNS = [
  { key: 'name', label: 'Recipe', visible: true, required: true },
  { key: 'source', label: 'Source', visible: true },
  { key: 'time', label: 'Time', visible: true },
  { key: 'updated', label: 'Updated', visible: false },
];

const SECTIONS = [
  { id: 'ingredients', label: 'Ingredients', count: 11 },
  { id: 'steps', label: 'Steps', count: 8 },
  { id: 'media', label: 'Media' },
];

export function CounterActionsPart() {
  const [range, setRange] = useState<RangeKey>('30d');
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState('');

  return (
    <Specimen
      title="Bulk actions · Filters · Export · Danger"
      spec="a03-recipes · a07-users · a09-flags"
      description="The controls an operator needs and a cook never sees."
    >
      <Rule>
        <b>A destructive bulk action requires a typed phrase, every time.</b> Suspending forty
        accounts at once is not forty times as reversible as suspending one — it is less
        reversible, because nobody remembers which forty.
      </Rule>

      <Section label="BULK ACTION BAR — APPEARS ON SELECTION">
        <Demo>
          <BulkActionBar
            count={12}
            onClear={() => {}}
            actions={[{ label: 'Publish', icon: 'tick', onSelect: () => {} }]}
            destructive={{ label: 'Delete', confirmPhrase: 'delete', onConfirm: () => {} }}
          />
        </Demo>
        <Note>
          The count is the subject of the sentence. "12 selected" tells an operator what a
          press is about to affect, which a checkbox column alone does not.
        </Note>
      </Section>

      <Section label="FILTERS AND RANGE">
        <Stack>
          <Demo>
            <FilterTabs tabs={TABS} value={tab} onValueChange={setTab} />
          </Demo>
          <Demo>
            <Row>
              <SegmentedRange value={range} onValueChange={setRange} />
              <ExportButton rowCount={412} onExport={() => {}} />
            </Row>
          </Demo>
          <Demo>
            <GlobalSearch value={query} onValueChange={setQuery} onSubmit={() => {}} />
          </Demo>
        </Stack>
        <Note>
          <code>ExportButton</code> states the row count it will export. An export that
          silently respects the current filter, or silently ignores it, is the same button —
          so it says which.
        </Note>
      </Section>

      <Section label="COLUMN SETTINGS">
        <Demo>
          <ColumnSettings columns={COLUMNS} onToggle={() => {}} />
        </Demo>
        <Note>
          A `required` column cannot be hidden. A table whose identifying column can be turned
          off produces rows nobody can act on.
        </Note>
      </Section>

      <Section label="DANGER — TYPED CONFIRM">
        <Demo>
          <DangerAction
            label="Suspend account"
            confirmPhrase="suspend"
            title="Suspend this account?"
            description="They lose access immediately. Their saved recipes are kept."
            onConfirm={() => {}}
          />
        </Demo>
      </Section>

      <Section label="REASON INPUT">
        <Demo>
          <ReasonInput
            value={reason}
            onChange={setReason}
            presets={['Duplicate', 'Wrong quantities', 'Unsafe method']}
            required
          />
        </Demo>
        <Note>
          <b>A rejection without a reason is not reviewable.</b> The presets are shortcuts, not
          a closed list — the free field stays, because the reason that matters is usually the
          one nobody predicted.
        </Note>
      </Section>
    </Specimen>
  );
}

export function CounterBoardPart() {
  const [selected, setSelected] = useState<readonly string[]>(['a']);

  return (
    <Specimen
      title="Board rows"
      spec="a03-recipes · a05-ai-audit · a07-users · a08-feedback · a09-flags"
      description="Five row shapes, each carrying the columns its board is sorted and compared by."
    >
      <Rule>
        <b>A board row is not a consumer row at a different density.</b> It is selectable, it
        carries columns an operator sorts by, and the consumer app has nothing that needs a
        checkbox.
      </Rule>

      <Section label="THE FIVE SHAPES">
        <Demo>
          <table className="w-full border-collapse text-left text-sm">
            <tbody>
              <BoardRow.Recipe
                name="Jollof Rice, Party Style"
                source="seed"
                minutes={45}
                status="published"
                updated="12 Aug"
                selected={selected.includes('a')}
                onSelectedChange={(on) => setSelected(on ? ['a'] : [])}
              />
              <BoardRow.User
                name="Ada Okafor"
                email="ada@kinnijije.ng"
                role="user"
                status="active"
                cookedCount={38}
                joined="2 Jun"
              />
              <BoardRow.Audit
                kind="vision"
                result="ok"
                model="claude-opus-5"
                latencyMs={840}
                cost="0.021"
                when="14:02"
              />
              <BoardRow.Feedback
                quote="It says 12 minutes but mine took nearly 25."
                target="step"
                status="open"
                recipe="Egusi Soup"
                when="Yesterday"
              />
              <BoardRow.Flag
                flag="suggestions.paused"
                on={false}
                consequence="Suggestions stop for every cook."
                changedBy="feranmi"
                changedAt="3 Aug"
              />
            </tbody>
          </table>
        </Demo>
        <Note>
          <b>The flag row gives its consequence a column, not a tooltip.</b> "Suggestions stop
          for every cook" is the only fact that matters at the moment of the toggle.
        </Note>
      </Section>

      <Section label="LOADING AND CACHED">
        <Demo>
          <table className="w-full border-collapse text-left text-sm">
            <tbody>
              <BoardRow.Skeleton columns={[38, 18, 12, 16]} selectable />
              <BoardRow.Skeleton columns={[38, 18, 12, 16]} selectable />
            </tbody>
          </table>
        </Demo>
        <Row>
          <BoardRow.Stale age="6 minutes ago" />
        </Row>
        <Note>
          The skeleton takes column widths so the shimmer lands under the real headers. Evenly
          spaced grey bars slide sideways when the data arrives.
        </Note>
      </Section>
    </Specimen>
  );
}

export function CounterEditorsPart() {
  const [markdown, setMarkdown] = useState('## Method\n\nBring the stock to a boil.');
  const [json, setJson] = useState('{\n  "servings": 4\n}');
  const [section, setSection] = useState('ingredients');

  return (
    <Specimen
      title="Shell · Editors · Ledger"
      spec="a01-shell · a02-dashboard · a04-recipe-editor"
      description="The frame a curator works inside, and the two editors they work in."
    >
      <Section label="PAGE HEADER · SECTION NAV · TOOLBAR">
        <Stack>
          <Demo>
            <PageHeader
              title="Jollof Rice, Party Style"
              subtitle="Last published 12 August by feranmi"
            />
          </Demo>
          <Demo>
            <SectionNav items={SECTIONS} value={section} onValueChange={setSection} />
          </Demo>
          <Demo>
            <Toolbar>
              <ExportButton rowCount={412} onExport={() => {}} />
            </Toolbar>
          </Demo>
        </Stack>
      </Section>

      <Section label="EDITORS">
        <Stack>
          <Demo>
            <MarkdownEditor value={markdown} onChange={setMarkdown} label="Method" />
          </Demo>
          <Demo>
            <JsonEditor value={json} onChange={setJson} label="Overrides" />
          </Demo>
        </Stack>
        <Note>
          The markdown toolbar wraps the current selection rather than appending at the end —
          which is why <code>Textarea</code> takes a <code>ref</code>.
        </Note>
      </Section>

      <Section label="TILES AND THE COST LEDGER">
        <Grid>
          <Stack label="metric">
            <MetricTile label="Recipes published" value={388} icon="plateJollofRice" />
          </Stack>
          <Stack label="info card">
            <InfoCard title="Prompt version">v14 · in production since 3 Aug</InfoCard>
          </Stack>
        </Grid>
        <Demo>
          <Stack>
            <CostLedgerLine kind="vision" calls={1840} cost="38.60" share={0.62} />
            <CostLedgerLine kind="generate" calls={410} cost="18.20" share={0.29} />
            <CostLedgerLine kind="whisper" calls={220} cost="5.40" share={0.09} />
          </Stack>
        </Demo>
        <Note>
          <b>The one number on the console that costs money.</b> It gets its own line per call
          kind, because "AI spend" as a single figure cannot be acted on.
        </Note>
      </Section>
    </Specimen>
  );
}
