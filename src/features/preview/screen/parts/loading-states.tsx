import { Card, CardError, ListAppending, ListSkeleton, ListStaleNote, PanelSkeleton, PromoCard, SectionHeaderSkeleton, AvatarSkeleton, RowSavedSkeleton } from '@ui/structure';
import { ChartEmpty, ChartError, ChartSkeleton, ChartStaleNote, CodeSurfaceSkeleton, Figure, FigureEmpty, FigureError, KeyValueEmpty, KeyValueSkeleton, PriceEmpty, PriceError, PriceStale, ProgressContentSkeleton, TableError } from '@ui/display';
import { CheckboxGroupEmpty, CheckboxGroupSkeleton, DurationInput, FieldSkeleton } from '@ui/inputs';
import { Caption, CaptionStale, Heading, HeadingSkeleton, Text, TextSkeleton } from '@ui/primitives';
import { EmptyStateChecking } from '@ui/feedback';
import { CellEmpty, CellSkeleton } from '@ui/admin';

import { Demo, Grid, Note, Row, Rule, Section, Specimen, Stack } from './preview-canvas';

/**
 * Visual spec: preview/17-heading · 18-text · 19-caption · 61-time
 *              101-banner-data (promo) · 196-card · 198-list-container
 *              94-chart-bar · 91-table · 92-table-cell · 46-checkbox-group
 *
 * The states a component reaches when its data is late, absent, cached or gone.
 * They live together here because the failure to get them right is systemic:
 * every one of them is a moment where a screen can assert something untrue.
 */

const COLUMNS = [
  { key: 'name', header: 'Recipe' },
  { key: 'source', header: 'Source' },
  { key: 'time', header: 'Time' },
];

export function TypographyPart() {
  return (
    <Specimen
      title="Heading · Text · Caption"
      spec="17-heading · 18-text · 19-caption"
      description="The display face doing structural work, the reading voice, and the quiet register beneath both."
    >
      <Rule>
        <b>Every axis is independent.</b> <code>level</code> sets the SIZE and{' '}
        <code>as</code> sets the TAG, so a page can render an <code>h1</code>-sized{' '}
        <code>h2</code> without choosing between a correct outline and correct typography.{' '}
        <code>Text</code> keeps <code>weight</code> separate from <code>size</code>, and{' '}
        <code>truncate</code> takes a LINE COUNT rather than a boolean.
      </Rule>

      <Section label="HEADING — SIX SIZES">
        <Demo>
          <Stack>
            <Heading level={1}>Your whole kitchen, planned</Heading>
            <Heading level={3}>What is in your kitchen?</Heading>
            <Heading level={5}>Tonight</Heading>
          </Stack>
        </Demo>
      </Section>

      <Section label="TEXT — WEIGHT IS ITS OWN AXIS">
        <Demo>
          <Stack>
            <Text size="lg">The reading voice at its largest.</Text>
            <Text weight="strong">The same size, emphasised — not a bigger size.</Text>
            <Text size="sm" color="muted">
              Smaller and quieter, which are two separate decisions.
            </Text>
            <Text truncate={2}>
              Truncation takes a line count, so a card that allows two lines and a row that
              allows one use the same prop rather than two different components. This sentence
              is long enough to prove it clamps where it says it will.
            </Text>
          </Stack>
        </Demo>
      </Section>

      <Section label="CAPTION — AND ITS STALE FORM">
        <Demo>
          <Stack>
            <Caption>Added on 12 August</Caption>
            <CaptionStale age="2 days ago" />
          </Stack>
        </Demo>
      </Section>

      <Section label="SKELETON">
        <Demo>
          <Stack>
            <HeadingSkeleton level={2} />
            <TextSkeleton lines={3} />
          </Stack>
        </Demo>
        <Note>
          The last skeleton line is short, like the last line of real prose. A stack of
          equal-width bars reads as a pattern rather than as text arriving.
        </Note>
      </Section>
    </Specimen>
  );
}

export function DurationInputPart() {
  return (
    <Specimen
      title="Duration input"
      spec="61-time"
      description="Minutes and seconds for a step timer. Mono and tabular, because a column of durations is read down."
    >
      <Rule>
        <b>A duration is not a clock time.</b> <code>TimeInput</code> holds{' '}
        <code>HH:MM</code>; this holds "20 minutes". <code>null</code> means the step has no
        timer — which is not zero, and only one of those is a mistake.
      </Rule>

      <Section label="STATES">
        <Grid>
          <Stack label="default">
            <DurationInput value={25} onChange={() => {}} />
          </Stack>
          <Stack label="empty — no timer">
            <DurationInput value={null} onChange={() => {}} />
          </Stack>
          <Stack label="error — out of range">
            <DurationInput value={900} max={240} onChange={() => {}} />
          </Stack>
          <Stack label="disabled">
            <DurationInput value={25} onChange={() => {}} disabled />
          </Stack>
        </Grid>
      </Section>
    </Specimen>
  );
}

export function PromoCardPart() {
  return (
    <Specimen
      title="Promotional card"
      spec="101-banner-data"
      description="One message at a time, dismissible, and it never rotates."
    >
      <Rule>
        <b><code>onDismiss</code> is REQUIRED</b> — an undismissable promo is an advert. And
        the empty case COLLAPSES: no placeholder box, no reserved height, because a promo slot
        with nothing to promote is absence, not a loading state.
      </Rule>

      <Section label="DEFAULT">
        <Demo>
          <PromoCard
            title="Try a photo of your fridge"
            body="It reads what you have in about three seconds."
            icon="takingPhotoCamera"
            action={{ label: 'Try it', onPress: () => {} }}
            onDismiss={() => {}}
          />
        </Demo>
      </Section>

      <Section label="EMPTY — THE SLOT COLLAPSES">
        <Demo>
          <Stack>
            <PromoCard onDismiss={() => {}} />
            <Caption>Nothing rendered above this line. That is the state.</Caption>
          </Stack>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function LoadingStatesPart() {
  return (
    <Specimen
      title="Skeletons, empties and failures"
      spec="196-card · 198-list-container · 94-chart-bar · 91-table · 92-table-cell · 46-checkbox-group"
      description="What every component does while its data is late, missing, cached or gone."
    >
      <Rule>
        <b>An em dash is not a zero, and a skeleton is not a spinner.</b> "No value on the
        record" and "the value failed to load" are different claims; so are "nothing here" and
        "still checking whether there is anything here". Each has its own rendering, because
        collapsing them is how a screen states something untrue.
      </Rule>

      <Section label="FIGURES AND PRICES">
        <Grid>
          <Stack label="value">
            <Figure value={45} unit="min" />
          </Stack>
          <Stack label="empty — no value on the record">
            <FigureEmpty />
          </Stack>
          <Stack label="error — failed to load">
            <FigureError />
          </Stack>
          <Stack label="price · empty">
            <PriceEmpty />
          </Stack>
          <Stack label="price · cached">
            <PriceStale amount="8,400" age="2 days" />
          </Stack>
          <Stack label="price · error">
            <PriceError />
          </Stack>
        </Grid>
        <Note>
          <code>FigureEmpty</code> renders "—" and <code>FigureError</code> renders "?" —
          because an absence we established and a value we could not read are not the same
          fact.
        </Note>
      </Section>

      <Section label="FIELDS">
        <Grid>
          <Stack label="one field">
            <FieldSkeleton withHint />
          </Stack>
          <Stack label="a textarea">
            <FieldSkeleton rows={3} />
          </Stack>
          <Stack label="a checkbox group">
            <CheckboxGroupSkeleton />
          </Stack>
          <Stack label="no options came back">
            <CheckboxGroupEmpty />
          </Stack>
        </Grid>
        <Note>
          Every input in the library loads through the same <code>FieldSkeleton</code>. Its
          height reads <code>--h-md</code>, so it is 46px in the KITCHEN and 34px under{' '}
          <code>.counter</code> without taking a density prop.
        </Note>
      </Section>

      <Section label="LISTS AND ROWS">
        <Stack>
          <Demo>
            <ListStaleNote age="yesterday" onRefresh={() => {}} />
            <ListSkeleton rows={3} />
            <ListAppending />
          </Demo>
          <Demo>
            <RowSavedSkeleton />
            <RowSavedSkeleton />
          </Demo>
        </Stack>
        <Note>
          <b><code>loading</code> and <code>skeleton</code> are different states here.</b> The
          skeleton is a first load with nothing to show; <code>ListAppending</code> is a page
          arriving, and the existing rows stay put beneath it.
        </Note>
      </Section>

      <Section label="SURFACES">
        <Grid>
          <Stack label="panel">
            <PanelSkeleton />
          </Stack>
          <Stack label="card · error">
            <CardError onRetry={() => {}} />
          </Stack>
          <Stack label="section header">
            <SectionHeaderSkeleton />
          </Stack>
          <Stack label="avatar">
            <AvatarSkeleton withLabel />
          </Stack>
          <Stack label="key-value">
            <Stack>
              <KeyValueSkeleton label="Cook time" />
              <KeyValueEmpty label="Spend" />
            </Stack>
          </Stack>
          <Stack label="progress card">
            <ProgressContentSkeleton />
          </Stack>
        </Grid>
        <Note>
          A card with no content does not render at all — that is the caller's{' '}
          <code>return null</code>. <code>CardError</code> is the different case: the content
          was supposed to exist, so the card stays rather than leaving a hole in the grid.
        </Note>
      </Section>

      <Section label="CHARTS — THE FRAME IS THE INVARIANT">
        <Grid>
          <Stack label="skeleton">
            <ChartSkeleton height={120} />
          </Stack>
          <Stack label="empty">
            <ChartEmpty height={120} />
          </Stack>
          <Stack label="error">
            <ChartError height={120} onRetry={() => {}} />
          </Stack>
        </Grid>
        <Row>
          <ChartStaleNote age="3 hours ago" />
        </Row>
        <Note>
          All three keep the axis rule and the same height, so a dashboard of four panels does
          not reflow when one resolves differently from its neighbours.
        </Note>
      </Section>

      <Section label="TABLES AND CELLS">
        <Stack>
          <Demo>
            <TableError columns={COLUMNS} onRetry={() => {}} />
          </Demo>
          <Demo>
            <Row>
              <CellSkeleton shape="avatar" />
              <CellSkeleton shape="amount" />
              <CellSkeleton shape="date" />
              <CellEmpty />
            </Row>
          </Demo>
        </Stack>
        <Note>
          Each cell shimmers at its own width and alignment. A column of identical grey bars
          hides which column is which, exactly when an operator is scanning for one.
        </Note>
      </Section>

      <Section label="CODE SURFACES AND EMPTY CHECKS">
        <Grid>
          <Stack label="json / diff">
            <CodeSurfaceSkeleton lines={6} />
          </Stack>
          <Stack label="still checking whether it is empty">
            <Card variant="quiet">
              <EmptyStateChecking />
            </Card>
          </Stack>
        </Grid>
        <Note>
          <code>EmptyStateChecking</code> exists so an empty state is never a guess. Rendering
          "Nothing here" while the query runs tells the user something false, and they act on
          it.
        </Note>
      </Section>
    </Specimen>
  );
}
