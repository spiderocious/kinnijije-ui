import { ActionMenu, ActionLink, MenuLink, NavLink, QuickReply } from '@ui/primitives';
import {
  Accordion,
  BarChart,
  DataBanner,
  DataSplit,
  DataValue,
  KeyValue,
  LastRefreshed,
  LineChart,
  Media,
  MediaContainer,
  MetadataGroup,
  PriceDisplay,
  ProgressContent,
  Sparkline,
  Timeline,
} from '@ui/display';
import { Figure } from '@ui/display';
import { Provenance } from '@ui/domain';
import { Status } from '@ui/status';

import { Api, Demo, Grid, Note, Row, Rule, Section, Specimen, Stack } from './preview-canvas';

/**
 * Visual spec: preview/28-30 links · 32-quick-reply · 38-action-menu
 *              85-88 value pairs · 94-96 charts · 97-102 content
 */

const WEEK = [
  { label: 'Mon', value: 2 },
  { label: 'Tue', value: 1 },
  { label: 'Wed', value: 0 },
  { label: 'Thu', value: 3 },
  { label: 'Fri', value: 1 },
  { label: 'Sat', value: 4 },
  { label: 'Sun', value: 2 },
];

const SPEND = [
  { label: 'Wk 1', value: 8400 },
  { label: 'Wk 2', value: 9100 },
  { label: 'Wk 3', value: 7200 },
  { label: 'Wk 4', value: 12400 },
];

export function LinksPart() {
  return (
    <Specimen
      title="Links · Action menu · Quick reply"
      spec="28-link-nav · 29-link-action · 30-link-menu · 32-quick-reply · 38-action-menu"
      description="Three links that look alike and are semantically different, plus the place a second control goes."
    >
      <Rule>
        <b>The distinction is semantic, not visual.</b> <code>NavLink</code> is a real{' '}
        <code>&lt;a href&gt;</code> — middle-clickable, copyable, openable in a tab.{' '}
        <code>ActionLink</code> borrows the styling but renders a real{' '}
        <code>&lt;button&gt;</code>, because an anchor that goes nowhere lies to every assistive
        technology.
      </Rule>

      <Section label="THE THREE LINKS">
        <Demo>
          <Stack>
            <Row>
              <NavLink href="#">Open the recipe</NavLink>
              <NavLink href="#" weight="quiet">
                How we test recipes
              </NavLink>
              <NavLink href="https://example.com" external>
                Read the PRD
              </NavLink>
            </Row>
            <Row>
              <ActionLink onClick={() => {}}>Clear the filter</ActionLink>
              <ActionLink weight="quiet" onClick={() => {}}>
                Show more
              </ActionLink>
              <ActionLink destructive onClick={() => {}}>
                Remove from saved
              </ActionLink>
            </Row>
            <Row>
              <MenuLink
                label="Sort by"
                items={[
                  { id: 'name', label: 'Name', onSelect: () => {} },
                  { id: 'time', label: 'Cook time', onSelect: () => {} },
                  { id: 'new', label: 'Newest', onSelect: () => {} },
                ]}
              />
            </Row>
          </Stack>
          <Note>
            The menu's caret flips — that is what distinguishes “this opens something here” from
            “this takes you elsewhere”, which no amount of colour can say.
          </Note>
        </Demo>
      </Section>

      <Section label="ACTION MENU — where the second control goes">
        <Demo>
          <Row>
            <ActionMenu
              label="More actions for Jollof Rice"
              items={[
                { id: 'share', label: 'Share', icon: 'share', onSelect: () => {} },
                { id: 'plan', label: 'Add to plan', icon: 'calendarCircledDate', onSelect: () => {} },
                { id: 'flag', label: 'Flag a step', icon: 'reportFlag', onSelect: () => {} },
                { id: 'remove', label: 'Remove from saved', icon: 'trash', destructive: true, onSelect: () => {} },
              ]}
            />
            <ActionMenu
              label="Row actions"
              orientation="horizontal"
              items={[
                { id: 'edit', label: 'Edit', icon: 'editPencil', onSelect: () => {} },
                { id: 'dup', label: 'Duplicate', icon: 'cycle', onSelect: () => {} },
                { id: 'del', label: 'Delete', icon: 'trash', destructive: true, onSelect: () => {} },
              ]}
            />
          </Row>
          <Note>
            <b>Destructive items sit at the bottom, separated</b> — so the muscle memory for “the
            last item” is never “the dangerous one” on a menu that grows.
          </Note>
        </Demo>
      </Section>

      <Section label="QUICK REPLY">
        <Demo>
          <QuickReply
            replies={['Something quick', 'Use up the spinach', 'Nigerian only']}
            onSelect={() => {}}
          />
          <Note>
            They disappear once one is chosen — a stale suggestion invites a second answer to a
            question already answered.
          </Note>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function ValuePairsPart() {
  return (
    <Specimen
      title="Value pairs"
      spec="85-key-value · 86-data-split · 87-data-value · 88-price-display"
      description="Four shapes that look mergeable and are not."
    >
      <Rule>
        <code>KeyValue</code> is a key and value inline. <code>DataSplit</code> puts them on{' '}
        <b>opposite edges</b> so a column can be read down. <code>DataValue</code> has{' '}
        <b>no key at all</b> — only a title and a figure, for where the context already says what
        the number is. <code>PriceDisplay</code> needs its own alignment because a ₦ and a digit
        are not the same width.
      </Rule>

      <Section label="KEY-VALUE — a dense run of facts">
        <Demo>
          <dl className="flex flex-col gap-2">
            <KeyValue label="Cook time" value={<Figure value={45} unit="min" size="sm" />} icon="alarmClock" />
            <KeyValue label="Serves" value={<Figure value={4} size="sm" />} icon="contact" />
            <KeyValue label="Source" value={<Provenance source="seed" size="sm" />} />
            <KeyValue label="Difficulty" value={<Status kind="difficulty" value="medium" size="sm" />} />
          </dl>
        </Demo>
      </Section>

      <Section label="DATA SPLIT — a receipt reads down">
        <Demo>
          <div className="max-w-[380px]">
            <DataSplit label="Long-grain rice" value={<PriceDisplay amount="3,200" size="sm" />} />
            <DataSplit label="Scotch bonnet" value={<PriceDisplay amount="800" size="sm" />} />
            <DataSplit label="Palm oil" value={<PriceDisplay amount="1,400" size="sm" />} />
            <DataSplit label="Roughly" value={<PriceDisplay amount="5,400" approximate />} total />
          </div>
        </Demo>
      </Section>

      <Section label="DATA VALUE — no key">
        <Demo>
          <Grid cols={3}>
            <DataValue title="Cooked this month" value={12} caption="up from 9" />
            <DataValue title="Roughly spent" value="12,400" unit="₦" approximate />
            <DataValue title="Meals you could make" value={11} caption="from what is in now" />
          </Grid>
        </Demo>
      </Section>

      <Section label="PRICE · METADATA · LAST REFRESHED">
        <Demo>
          <Stack>
            <Row className="items-baseline">
              <PriceDisplay amount="3,200" size="sm" />
              <PriceDisplay amount="3,200" />
              <PriceDisplay amount="3,200" size="lg" />
              <PriceDisplay amount="2,400" was="3,200" />
              <PriceDisplay amount="8,400" approximate size="lg" />
            </Row>
            <MetadataGroup
              items={[
                { label: 'Time', value: '45 min' },
                { label: 'Serves', value: '4' },
                { label: 'Cuisine', value: 'Nigerian' },
              ]}
            />
            <LastRefreshed at="counted 41 minutes ago" onRefresh={() => {}} />
          </Stack>
          <Note>
            The currency mark sits before the figure and smaller — a ₦ at digit size reads as
            another digit.
          </Note>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function ChartsPart() {
  return (
    <Specimen
      title="Charts"
      spec="94-chart-bar · 95-chart-line · 96-sparkline"
      description="Three shapes, hand-rolled, each stating its own numbers."
    >
      <Rule>
        Hand-rolled SVG rather than a charting library — these three shapes are all the product
        needs, and a library brings a second design system with it: its own colours, its own type,
        its own tooltip. <b>Every chart states its own numbers</b>, because a shape without figures
        is a picture.
      </Rule>

      <Section label="BAR">
        <Demo>
          <div className="max-w-[480px]">
            <BarChart data={WEEK} label="Meals cooked this week" unit="meals cooked" />
          </div>
        </Demo>
      </Section>

      <Section label="LINE">
        <Demo>
          <Grid cols={2}>
            <LineChart data={SPEND} label="Weekly spend" />
            <LineChart data={SPEND} label="Weekly spend" area tone="caution" />
          </Grid>
          <Note>
            The area fill is off by default — a fill implies a cumulative total, which a weekly
            figure is not.
          </Note>
        </Demo>
      </Section>

      <Section label="SPARKLINE — the figure is not optional">
        <Demo>
          <Stack>
            <Row>
              <Sparkline data={[2, 1, 0, 3, 1, 4, 2]} label="Meals trend" value={2} unit="today" />
              <Sparkline data={[8400, 9100, 7200, 12400]} label="Spend trend" value="12,400" unit="₦" tone="caution" />
              <Sparkline data={[1, 2, 2, 3, 4, 4, 5]} label="Streak" value={5} unit="days" tone="success" />
            </Row>
          </Stack>
          <Note>
            A sparkline alone says “it went up” without saying from what to what — which is the
            whole reason a reader would look.
          </Note>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function ContentPart() {
  return (
    <Specimen
      title="Accordion · Media · Timeline"
      spec="97-progress-content · 98-accordion · 99-media · 100-media-container · 101-banner-data · 102-timeline"
      description="The content-shaped pieces every screen reaches for."
    >
      <Section label="ACCORDION">
        <Demo>
          <div className="max-w-[560px]">
            <Accordion
              defaultOpen={['a']}
              items={[
                {
                  id: 'a',
                  title: 'How do I know a recipe is any good?',
                  meta: <Provenance source="seed" size="sm" />,
                  body: 'Every recipe says who wrote it. ✓ Verified means a person wrote and tested it.',
                },
                {
                  id: 'b',
                  title: 'Do I have to keep a list of what is in my kitchen?',
                  body: 'No. The standing kitchen is optional and only ever topped up by things you already do.',
                },
              ]}
            />
          </div>
        </Demo>
      </Section>

      <Section label="MEDIA · MEDIA CONTAINER">
        <Demo>
          <Grid cols={2}>
            <Media
              media={<MediaContainer ratio="1/1" className="w-16" />}
              title="Jollof Rice, Party Style"
              body="Uses 6 of your 6 things"
              meta={<MetadataGroup items={[{ label: 'Time', value: '45 min' }, { label: 'Serves', value: '4' }]} />}
            />
            <MediaContainer
              ratio="4/3"
              badge={
                <span className="rounded-blade-xs border border-grape-border bg-grape-soft px-2 py-[2px] text-xs font-extrabold text-grape-onsoft">
                  AI image
                </span>
              }
            />
          </Grid>
          <Note>
            The container holds its ratio whether or not an image loads, so a grid never reflows
            as photography arrives.
          </Note>
        </Demo>
      </Section>

      <Section label="DATA BANNER · PROGRESS WITH CONTENT">
        <Demo>
          <Stack>
            <DataBanner
              label="From your kitchen"
              icon="cookingPot"
              value={
                <span className="flex items-baseline gap-2">
                  <Figure value={11} size="2xl" />
                  <span className="text-sm text-ink-2">meals you could make right now</span>
                </span>
              }
            />
            <ProgressContent
              value={62}
              title="Reading your shelf photos"
              detail="2 of 3 done. The third is a wide shot, which takes longer."
              tone="ai"
            />
          </Stack>
        </Demo>
      </Section>

      <Section label="TIMELINE">
        <Demo>
          <div className="max-w-[520px]">
            <Timeline
              entries={[
                { id: '1', title: 'Cooked Jollof Rice', when: 'Today', tone: 'success', icon: 'cookingPot', body: 'Rice, tomatoes and onion came out of your kitchen.' },
                { id: '2', title: 'Ticked 9 things off the market list', when: 'Saturday', icon: 'shoppingBasket' },
                { id: '3', title: 'Read a shelf photo', when: 'Saturday', tone: 'ai', icon: 'takingPhotoCamera', body: '14 things seeded.' },
                { id: '4', title: 'Could not read a photo', when: 'Friday', tone: 'critical', icon: 'error' },
              ]}
            />
          </div>
          <Note>
            One continuous rule runs behind the marks — a gap between segments makes each entry
            look unrelated to the next.
          </Note>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Accordion items* exclusive? defaultOpen? />
<Media media* title* body? meta? action? align? />
<MediaContainer ratio? src? alt? fallbackIcon? badge? />
<DataBanner label* value* icon? tone? action? />
<Timeline entries* />
<ProgressContent value* title* detail? tone? action? />

// MediaContainer holds its ratio whether or not an image loads
// Timeline's rule is continuous — segments would read as unrelated`}</Api>
      </Section>
    </Specimen>
  );
}
