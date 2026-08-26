import { useState } from 'react';

import { KoboyoIcon } from '@icons';
import { Checkbox, Field, Input, Radio, RadioGroup, Switch, Textarea, type CheckedState } from '@ui/inputs';

import { Api, Demo, Note, Rule, Section, Specimen, Stack, StateCard, StateGrid } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/40-input-text.html
 *                                                          42-textarea.html
 *                                                          45-checkbox.html
 *                                                          47-radio.html
 *                                                          49-switch.html
 *                                                          66-form-field.html
 */

export function InputPart() {
  const [value, setValue] = useState('Rice, tomato, onion');

  return (
    <Specimen
      title="Text input"
      spec="40-input-text.html"
      description="The base primitive. Everything else inherits this chrome — blade-cut, soft light border, sky focus glow."
    >
      <Rule>
        The base field carries <b>three independent booleans</b>: <code>disabled</code>,{' '}
        <code>readOnly</code> and <code>invalid</code>. They combine —{' '}
        <code>readOnly + invalid</code> is normal in any review flow.{' '}
        <b>The shipped library had no readOnly at all</b>, which forced locked-but-readable data
        to be faked with disabled, muting information the curator needs to read.
      </Rule>

      <Section label="VARIANTS">
        <Demo>
          <Stack>
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Type, or use voice / photo"
              aria-label="What is in your kitchen?"
            />
            <Input
              placeholder="With a leading mark"
              leading={<KoboyoIcon name="basket" size={17} />}
              aria-label="With a leading mark"
            />
            <Input
              placeholder="With a trailing action"
              trailing={<KoboyoIcon name="mic" size={17} />}
              aria-label="With a trailing action"
            />
          </Stack>
        </Demo>
      </Section>

      <Section label="SIZES">
        <Demo>
          <Stack>
            <Input size="sm" placeholder="Small" aria-label="Small" />
            <Input size="md" placeholder="Medium" aria-label="Medium" />
            <Input size="lg" placeholder="Large" aria-label="Large" />
          </Stack>
        </Demo>
      </Section>

      <Section label="THE TRIAD">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Editable, valid.">
              <Input placeholder="Type, or use voice / photo" aria-label="Default" />
            </StateCard>
            <StateCard name="invalid" when="Interactive and editable, currently invalid.">
              <Input invalid defaultValue="" placeholder="Must be at least 1" aria-label="Invalid" />
            </StateCard>
            <StateCard name="disabled" when="Cannot interact; the value may not matter.">
              <Input disabled placeholder="Type, or use voice / photo" aria-label="Disabled" />
            </StateCard>
            <StateCard name="readOnly" when="Real and current, but locked now — full ink retained.">
              <Input readOnly defaultValue="Rice, tomato, onion" aria-label="Read only" />
            </StateCard>
            <StateCard name="readOnly + invalid" when="Locked data that is also wrong. The combination a state enum cannot express.">
              <Input readOnly invalid defaultValue="480000 min" aria-label="Read only and invalid" />
            </StateCard>
            <StateCard name="loading" when="Validating against the server — it stays interactive.">
              <Input loading defaultValue="jollof-rice" aria-label="Loading" />
            </StateCard>
          </StateGrid>
        </Demo>
        <Note>
          <b>readOnly keeps full ink and takes a dashed edge.</b> It is real data — never dimmed
          like a disabled field.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<Input value onChange placeholder? disabled? readOnly? invalid? error?
       leading? trailing? loading? size?="sm|md|lg" />

// NOT this — the cross product spelled out by hand:
//   state: 'default' | 'disabled' | 'error'
// disabled / readOnly / invalid are THREE booleans and they COMBINE
// readOnly keeps full ink — it is real data, just not editable now
// \`error\` is the message; \`invalid\` is the state. A field can be
// invalid before it has a message`}</Api>
      </Section>
    </Specimen>
  );
}

export function TextareaPart() {
  const [notes, setNotes] = useState('Add a pinch of curry at the end.');

  return (
    <Specimen
      title="Textarea"
      spec="42-textarea.html"
      description="The multi-line field. Same chrome, same triad — it only grows vertically."
    >
      <Section label="VARIANTS">
        <Demo>
          <Stack>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything worth remembering next time?"
              aria-label="Notes"
            />
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={280}
              showCount
              aria-label="Notes with a counter"
            />
          </Stack>
        </Demo>
        <Note>
          Vertical resize only — horizontal resize would break the blade’s proportions. The
          counter warns in caution once past 90% of the limit.
        </Note>
      </Section>

      <Section label="THE TRIAD">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Editable.">
              <Textarea placeholder="Notes" aria-label="Default" />
            </StateCard>
            <StateCard name="invalid" when="Too long, or empty when required.">
              <Textarea invalid defaultValue="…" aria-label="Invalid" />
            </StateCard>
            <StateCard name="readOnly" when="Published copy under review.">
              <Textarea readOnly defaultValue="Add a pinch of curry at the end." aria-label="Read only" />
            </StateCard>
            <StateCard name="disabled" when="Not available.">
              <Textarea disabled placeholder="Notes" aria-label="Disabled" />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function FieldPart() {
  const [name, setName] = useState('Jollof Rice');

  return (
    <Specimen
      title="Form field wrapper"
      spec="66-form-field.html"
      description="The wrapper every input sits in. It owns when validation runs, so twelve fields on one screen cannot each pick their own moment."
    >
      <Rule>
        <code>mode</code> is set <b>once on the form</b>, not per field. Server errors inject into
        the same slot as client errors — one error surface per field, so a user never has to look
        in two places.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <Stack>
            <Field label="Recipe name" hint="Shown on the card">
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              )}
            </Field>

            <Field label="Cook time" hint="Between 1 and 480 minutes">
              {({ id, describedBy }) => (
                <Input id={id} aria-describedby={describedBy} defaultValue="45" trailing="min" />
              )}
            </Field>

            <Field label="Notes" optional>
              {({ id, describedBy }) => <Textarea id={id} aria-describedby={describedBy} />}
            </Field>
          </Stack>
        </Demo>
        <Note>An unmarked field is required by default — only the optional ones are labelled.</Note>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Untouched.">
              <Field label="Recipe name" hint="Shown on the card">
                {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} />}
              </Field>
            </StateCard>
            <StateCard name="error" when="Invalid after blur — the error takes the hint's slot.">
              <Field label="Cook time" hint="Between 1 and 480 minutes" error="Between 1 and 480">
                {({ id, describedBy }) => (
                  <Input id={id} aria-describedby={describedBy} invalid defaultValue="900" />
                )}
              </Field>
            </StateCard>
            <StateCard name="readOnly" when="Read-only in review.">
              <Field label="Cook time">
                {({ id, describedBy }) => (
                  <Input id={id} aria-describedby={describedBy} readOnly defaultValue="45" />
                )}
              </Field>
            </StateCard>
            <StateCard name="disabled" when="Unavailable.">
              <Field label="Cook time" disabled>
                {({ id, describedBy }) => (
                  <Input id={id} aria-describedby={describedBy} disabled defaultValue="45" />
                )}
              </Field>
            </StateCard>
            <StateCard name="loading" when="Async validation in flight.">
              <Field label="Handle" loading>
                {({ id, describedBy }) => (
                  <Input id={id} aria-describedby={describedBy} loading defaultValue="jollof" />
                )}
              </Field>
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Field label* hint? error? optional? disabled? loading?>
  {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} />}
</Field>

// \`mode\` is set ONCE on the form, not per field
// server errors inject into the same slot as client errors — one error surface`}</Api>
      </Section>
    </Specimen>
  );
}

export function SelectionPart() {
  const [checked, setChecked] = useState<CheckedState>('mixed');
  const [nigerian, setNigerian] = useState(true);
  const [westAfrican, setWestAfrican] = useState(false);
  const [diet, setDiet] = useState<string | undefined>('none');
  const [metric, setMetric] = useState(true);
  const [notify, setNotify] = useState(false);

  return (
    <Specimen
      title="Checkbox · Radio · Switch"
      spec="45-checkbox.html · 47-radio.html · 49-switch.html"
      description="The three selection controls, and the rule that keeps them apart."
    >
      <Rule>
        <b>A switch commits immediately.</b> It is only correct where the change is instant and
        reversible — a measurement preference, a feature flag. Anything needing a Save button is a
        checkbox.
      </Rule>

      <Section label="CHECKBOX — including a real indeterminate">
        <Demo>
          <Stack>
            <Checkbox
              checked={checked}
              onCheckedChange={(next) => setChecked(next)}
            >
              Some selected
            </Checkbox>
            <Checkbox checked={nigerian} onCheckedChange={setNigerian}>
              Nigerian
            </Checkbox>
            <Checkbox checked={westAfrican} onCheckedChange={setWestAfrican}>
              West African
            </Checkbox>
          </Stack>
        </Demo>
        <Note>
          <code>'mixed'</code> is a real value, not a visual hack for a parent row — a header over
          a partly-selected group is genuinely not the same as unchecked.
        </Note>

        <Demo>
          <StateGrid>
            <StateCard name="unchecked / checked" when="The two ordinary values.">
              <div className="flex flex-col gap-2">
                <Checkbox checked={false} onCheckedChange={() => {}}>
                  Off
                </Checkbox>
                <Checkbox checked onCheckedChange={() => {}}>
                  On
                </Checkbox>
              </div>
            </StateCard>
            <StateCard name="mixed" when="A bulk-select header over a partial group.">
              <Checkbox checked="mixed" onCheckedChange={() => {}}>
                Some selected
              </Checkbox>
            </StateCard>
            <StateCard name="invalid" when="Required group, none chosen.">
              <Checkbox checked={false} invalid onCheckedChange={() => {}}>
                Choose at least one
              </Checkbox>
            </StateCard>
            <StateCard name="disabled" when="Not selectable.">
              <Checkbox checked={false} disabled onCheckedChange={() => {}}>
                Vegan
              </Checkbox>
            </StateCard>
            <StateCard name="readOnly" when="Fixed by policy — full ink, dashed edge.">
              <Checkbox checked readOnly onCheckedChange={() => {}}>
                Verified only
              </Checkbox>
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="RADIO — one of N">
        <Demo>
          <RadioGroup value={diet} onValueChange={setDiet} label="Dietary preference">
            <Radio value="none">No restriction</Radio>
            <Radio value="vegetarian">Vegetarian</Radio>
            <Radio value="pescatarian">Pescatarian</Radio>
            <Radio value="halal">Halal</Radio>
          </RadioGroup>
        </Demo>
        <Note>
          Circular by exception to the blade — the round shape is what tells a user at a glance
          this is exclusive where a checkbox is not.
        </Note>

        <Demo>
          <StateGrid>
            <StateCard name="horizontal" when="Two or three short options.">
              <RadioGroup value="metric" onValueChange={() => {}} label="Units" orientation="horizontal">
                <Radio value="metric">Metric</Radio>
                <Radio value="imperial">Imperial</Radio>
              </RadioGroup>
            </StateCard>
            <StateCard name="invalid" when="Required, nothing chosen.">
              <RadioGroup value={undefined} onValueChange={() => {}} label="Units" invalid>
                <Radio value="metric">Metric</Radio>
                <Radio value="imperial">Imperial</Radio>
              </RadioGroup>
            </StateCard>
            <StateCard name="disabled" when="Whole group unavailable.">
              <RadioGroup value="metric" onValueChange={() => {}} label="Units" disabled>
                <Radio value="metric">Metric</Radio>
                <Radio value="imperial">Imperial</Radio>
              </RadioGroup>
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="SWITCH — immediate, reversible">
        <Demo>
          <Stack>
            <Switch checked={metric} onCheckedChange={setMetric} label="Metric units" />
            <Switch checked={notify} onCheckedChange={setNotify} label="Notifications" />
          </Stack>
        </Demo>

        <Demo>
          <StateGrid>
            <StateCard name="on / off" when="The two values.">
              <div className="flex flex-col gap-3">
                <Switch checked onCheckedChange={() => {}} label="On" />
                <Switch checked={false} onCheckedChange={() => {}} label="Off" />
              </div>
            </StateCard>
            <StateCard name="locked" when="Policy-gated; the reason is never silent.">
              <Switch
                checked={false}
                onCheckedChange={() => {}}
                label="Auto-publish"
                lockReason="Admin only"
              />
            </StateCard>
            <StateCard name="error" when="The commit failed — it snaps back and says so.">
              <Switch
                checked={false}
                onCheckedChange={() => {}}
                label="Notifications"
                error="Could not save. Try again."
              />
            </StateCard>
            <StateCard name="disabled" when="Not available.">
              <Switch checked={false} onCheckedChange={() => {}} label="Beta features" disabled />
            </StateCard>
          </StateGrid>
        </Demo>
        <Note>
          There is deliberately no <code>loading</code> prop — a switch <b>stays interactive while
          committing</b> and reverts on failure. Disabling it mid-commit strands the user.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<Checkbox checked={true|false|"mixed"} onCheckedChange disabled? readOnly? invalid? />
<RadioGroup value onValueChange label* orientation?><Radio value* /></RadioGroup>
<Switch checked onCheckedChange label* disabled? lockReason? error? />

// 'mixed' is a real value, not a visual hack for a parent row
// no \`loading\` on Switch — it stays interactive and reverts on failure
// \`lockReason\` renders beside it; a silent locked switch is a bug report`}</Api>
      </Section>
    </Specimen>
  );
}
