import { useState } from 'react';

import { FilterChip, IconButton, PillButton, Segmented } from '@ui/primitives';

import { Api, Demo, Note, Row, Rule, Section, Specimen, StateCard, StateGrid } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/22-button-icon.html
 *                                                          23-button-pill.html
 *                                                          26-filter-chip.html
 *                                                          27-segmented.html
 */

export function IconButtonPart() {
  return (
    <Specimen
      title="Button — icon only"
      spec="22-button-icon.html"
      description="The icon-only action, with a mandatory accessible label and an optional count badge."
    >
      <Rule>
        Square by height, blade-cut, and it <b>must</b> carry an accessible label — there is no
        visible text to fall back on. <code>label</code> is a required prop, because a required
        prop beats a documented convention.
      </Rule>

      <Section label="SIZES">
        <Demo>
          <Row className="items-end">
            <IconButton icon="bookmark" label="Save" size="sm" />
            <IconButton icon="bookmark" label="Save" size="md" />
            <IconButton icon="bookmark" label="Save" size="lg" />
          </Row>
        </Demo>
      </Section>

      <Section label="VARIANTS">
        <Demo>
          <Row>
            <IconButton icon="plus" label="Add ingredient" variant="primary" />
            <IconButton icon="editPencil" label="Edit" variant="secondary" />
            <IconButton icon="settings" label="Settings" variant="tertiary" />
            <IconButton icon="trash" label="Delete" destructive />
            <IconButton icon="trash" label="Delete" variant="secondary" destructive />
          </Row>
        </Demo>
      </Section>

      <Section label="WITH A BADGE">
        <Demo>
          <Row>
            <IconButton icon="bellNotification" label="Notifications" badge={3} />
            <IconButton icon="inbox" label="Inbox" badge={12} variant="primary" />
            <IconButton icon="shoppingBasket" label="Market list" badge={128} />
          </Row>
        </Demo>
        <Note>The badge is decorative to assistive tech — the count belongs in the label.</Note>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Ready.">
              <IconButton icon="bookmarkSave" label="Save recipe" />
            </StateCard>
            <StateCard name="loading" when="Working.">
              <IconButton icon="bookmarkSave" label="Save recipe" loading />
            </StateCard>
            <StateCard name="disabled" when="Unavailable.">
              <IconButton icon="bookmarkSave" label="Save recipe" disabled />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<IconButton icon* label* size?="sm|md|lg" variant? destructive? badge? />

// \`label\` is REQUIRED — a required prop beats a documented convention
// \`icon\` takes a koboyo slug, never arbitrary markup`}</Api>
      </Section>
    </Specimen>
  );
}

export function PillButtonPart() {
  return (
    <Specimen
      title="Button — pill"
      spec="23-button-pill.html"
      description="The lightweight repeatable action. The only button shape that is not blade-cut, and the rule for when it is allowed."
    >
      <Rule>
        <b>The one place the blade yields.</b> A pill button is for floating actions — a
        chip-shaped filter, a re-suggest control — where the shape signals “lightweight,
        repeatable” rather than “commit”.
      </Rule>

      <Section label="VARIANTS">
        <Demo>
          <Row>
            <PillButton variant="primary" icon="cycle">
              Re-suggest
            </PillButton>
            <PillButton>Something else</PillButton>
            <PillButton icon="filter">Filter</PillButton>
            <PillButton size="sm">Clear all</PillButton>
          </Row>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Ready.">
              <PillButton icon="cycle">Re-suggest</PillButton>
            </StateCard>
            <StateCard name="loading" when="Fetching new suggestions.">
              <PillButton loading>Re-suggest</PillButton>
            </StateCard>
            <StateCard name="disabled" when="No more variations available.">
              <PillButton disabled>Re-suggest</PillButton>
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Rule tone="warn">
        <b>A pill is never the primary commit.</b> “Suggest meals”, “Start cooking” and “Publish”
        are blade-cut. If the action changes the screen, it wears the blade.
      </Rule>

      <Section label="API">
        <Api>{`<PillButton icon? size?="sm|md" variant? />

// no \`destructive\` — a destructive action always commits, so it is never a pill`}</Api>
      </Section>
    </Specimen>
  );
}

export function FilterChipPart() {
  const [verified, setVerified] = useState(true);
  const [quick, setQuick] = useState(true);
  const [nigerian, setNigerian] = useState(false);
  const [veg, setVeg] = useState(false);

  return (
    <Specimen
      title="Filter chip"
      spec="26-filter-chip.html"
      description="The applied-filter toggle. It shows its own result count, so a short list always explains itself."
    >
      <Rule>
        A toggle that looks like a chip. It carries its own count when active, because “filtered”
        with no visible count is how a user loses track of why a list is short.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <Row>
            <FilterChip pressed={verified} onPressedChange={setVerified} count={12}>
              Verified
            </FilterChip>
            <FilterChip pressed={quick} onPressedChange={setQuick} count={5}>
              Under 30 min
            </FilterChip>
            <FilterChip pressed={nigerian} onPressedChange={setNigerian} count={31}>
              Nigerian
            </FilterChip>
            <FilterChip pressed={veg} onPressedChange={setVeg} count={0}>
              Vegetarian
            </FilterChip>
          </Row>
        </Demo>
        <Note>Toggle them — the count appears only once the filter is applied.</Note>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Not applied.">
              <FilterChip pressed={false} onPressedChange={() => {}}>
                Verified
              </FilterChip>
            </StateCard>
            <StateCard name="pressed" when="Applied, with its count.">
              <FilterChip pressed onPressedChange={() => {}} count={12}>
                Verified
              </FilterChip>
            </StateCard>
            <StateCard name="loading" when="Re-filtering.">
              <FilterChip pressed onPressedChange={() => {}} loading>
                Verified
              </FilterChip>
            </StateCard>
            <StateCard name="disabled" when="No results would match.">
              <FilterChip pressed={false} onPressedChange={() => {}} disabled>
                Vegetarian
              </FilterChip>
            </StateCard>
            <StateCard name="empty" when="Applied, zero results — the chip stays so it can be removed.">
              <FilterChip pressed onPressedChange={() => {}} count={0}>
                Vegetarian
              </FilterChip>
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<FilterChip pressed* onPressedChange* count? loading? disabled? />

// \`count\` renders only when pressed — an unapplied filter has no count to show`}</Api>
      </Section>
    </Specimen>
  );
}

export function SegmentedPart() {
  const [capture, setCapture] = useState('type');
  const [view, setView] = useState('ingredients');
  const [units, setUnits] = useState('metric');

  return (
    <Specimen
      title="Segmented control"
      spec="27-segmented.html"
      description="The view switch. Distinct from Tabs by what it does to the data, not by how it looks."
    >
      <Rule>
        A one-of-N switch for a view of the same thing — <b>not navigation</b>. If the options
        load different data, they are Tabs; if they reshape what is already loaded, they are a
        segmented control.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <Row className="mb-5">
            <Segmented value={capture} onValueChange={setCapture} label="Capture method">
              <Segmented.Item value="type" icon="editPencil">
                Type
              </Segmented.Item>
              <Segmented.Item value="voice" icon="mic">
                Voice
              </Segmented.Item>
              <Segmented.Item value="photo" icon="takingPhotoCamera">
                Photo
              </Segmented.Item>
            </Segmented>
          </Row>

          <Row>
            <Segmented value={view} onValueChange={setView} label="Recipe view">
              <Segmented.Item value="ingredients">Ingredients</Segmented.Item>
              <Segmented.Item value="steps">Steps</Segmented.Item>
            </Segmented>
          </Row>

          <div className="mt-4 rounded-blade-sm border border-line-2 bg-paper-2 p-4">
            <Segmented.Panel value="ingredients">
              <p className="text-sm text-ink-2">
                Rice · Tomato · Onion · Pepper · Stock cube · Groundnut oil
              </p>
            </Segmented.Panel>
            <Segmented.Panel value="steps">
              <p className="text-sm text-ink-2">
                The panel only renders while its value is selected.
              </p>
            </Segmented.Panel>
          </div>
        </Demo>
        <Note>
          Arrow keys move roving focus and wrap at both ends; Home and End jump to the ends.
        </Note>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="One selected.">
              <Segmented value={units} onValueChange={setUnits} label="Units">
                <Segmented.Item value="metric">Metric</Segmented.Item>
                <Segmented.Item value="imperial">Imperial</Segmented.Item>
              </Segmented>
            </StateCard>
            <StateCard name="item disabled" when="One option unavailable.">
              <Segmented value="metric" onValueChange={() => {}} label="Units">
                <Segmented.Item value="metric">Metric</Segmented.Item>
                <Segmented.Item value="imperial" disabled>
                  Imperial
                </Segmented.Item>
              </Segmented>
            </StateCard>
            <StateCard name="disabled" when="Whole control unavailable.">
              <Segmented value="metric" onValueChange={() => {}} label="Units" disabled>
                <Segmented.Item value="metric">Metric</Segmented.Item>
                <Segmented.Item value="imperial">Imperial</Segmented.Item>
              </Segmented>
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Segmented value* onValueChange* label? disabled?>
  <Segmented.Item value* icon? disabled? />   // required, at least two
  <Segmented.Panel value* />                  // optional
</Segmented>

// distinct from Tabs: segmented RESHAPES loaded data, tabs LOAD different data`}</Api>
      </Section>
    </Specimen>
  );
}
