import { useState } from 'react';

import { CuisinePicker, DateInput, DateRange, DifficultyPicker, FileUpload, IngredientEditor, MeasurementToggle, MultiSelect, NumberInput, OtpInput, PasswordInput, Rating, StepEditor, StrengthBar, TimeInput, type IngredientRow, type StepRow, type UploadFile } from '@ui/inputs';

import { Api, Demo, Grid, Note, Rule, Section, Specimen, Stack, StateCard, StateGrid } from './preview-canvas';

/**
 * Visual spec: preview/44-input-number · 52-multiselect · 57-file-upload
 *              58-rating · 59-date · 60-date-range · 61-time · 62-otp
 *              63-password · 64-strength-bar · 67-69 pickers · 70-71 editors
 */

const CATEGORIES = [
  { value: 'soup', label: 'Soup' },
  { value: 'rice', label: 'Rice' },
  { value: 'stew', label: 'Stew' },
  { value: 'grill', label: 'Grilled' },
  { value: 'snack', label: 'Snack' },
];

const FILES: UploadFile[] = [
  { id: '1', name: 'jollof-hero.jpg', size: 842_000 },
  { id: '2', name: 'egusi-hero.jpg', size: 1_240_000, progress: 62 },
  { id: '3', name: 'moimoi-hero.png', size: 9_800_000, error: 'Too large — 5 MB is the limit' },
];

export function InputsNumericPart() {
  const [serves, setServes] = useState<number | null>(4);
  const [cats, setCats] = useState<readonly string[]>(['rice']);
  const [stars, setStars] = useState<number | null>(null);

  return (
    <Specimen
      title="Number · Multi-select · Rating"
      spec="44-input-number.html · 52-multiselect.html · 58-rating.html"
      description="The three that each carry one rule worth stating out loud."
    >
      <Section label="NUMBER — clamps on blur, not on keystroke">
        <Demo>
          <Stack className="max-w-[280px]">
            <NumberInput value={serves} onChange={setServes} min={1} max={40} unit="serves" aria-label="Serves" />
            <NumberInput value={45} onChange={() => {}} unit="min" aria-label="Cook time" />
            <NumberInput value={null} onChange={() => {}} unit="g" aria-label="Weight" />
          </Stack>
          <Note>
            Type <code>100</code> into the first one. It passes through 1 and 10 on the way — a
            control that clamped on keystroke would make that impossible.
          </Note>
        </Demo>
      </Section>

      <Section label="MULTI-SELECT — chips live inside the control">
        <Demo>
          <div className="max-w-[420px]">
            <MultiSelect
              value={cats}
              onValueChange={setCats}
              options={CATEGORIES}
              label="Categories"
              max={3}
            />
          </div>
          <Note>
            A separate list below would make the control lie about its own height and shove
            everything beneath it around as selections change.
          </Note>
        </Demo>
      </Section>

      <Section label="RATING — null is not zero">
        <Demo>
          <StateGrid>
            <StateCard name="unrated" when="null — nobody has rated it.">
              <Rating value={null} onChange={setStars} />
            </StateCard>
            <StateCard name="rated" when="An interactive rating.">
              <Rating value={stars ?? 4} onChange={setStars} />
            </StateCard>
            <StateCard name="with a count" when="An average with no sample size is not a fact.">
              <Rating value={4.6} readOnly count={412} />
            </StateCard>
            <StateCard name="rated zero" when="0 — someone rated it and hated it. Different from null.">
              <Rating value={0} readOnly count={3} />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<NumberInput value* onChange* min? max? step? unit? />
<MultiSelect value* onValueChange* options* label* max? />
<Rating value* onChange? max? readOnly? count? />

// NumberInput clamps on BLUR, not on keystroke
// MultiSelect chips render INSIDE the control — never a list below it
// Rating value is NULLABLE: null means unrated, 0 means rated zero
// \`count\` renders beside it — an average with no sample size is not a fact`}</Api>
      </Section>
    </Specimen>
  );
}

export function InputsSecurityPart() {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Specimen
      title="OTP · Password · Strength"
      spec="62-otp.html · 63-password.html · 64-strength-bar.html"
      description="One real input behind six cells, and a meter that cannot disagree with its validator."
    >
      <Rule>
        The OTP field is <b>one real input</b> — a visually-hidden field captures the keystrokes
        and the cells are pure presentation. Six separate inputs look identical and break paste,
        autofill and every password manager.
      </Rule>

      <Section label="OTP">
        <Demo>
          <Stack>
            <OtpInput value={code} onChange={setCode} onComplete={() => {}} />
            <OtpInput value="1234" onChange={() => {}} invalid />
            <OtpInput value="12" onChange={() => {}} disabled />
          </Stack>
          <Note>
            Try pasting a six-digit code into the first one. <code>inputMode="numeric"</code> means
            a phone shows the keypad.
          </Note>
        </Demo>
      </Section>

      <Section label="PASSWORD — the meter and the validator share one function">
        <Demo>
          <Stack className="max-w-[400px]">
            <PasswordInput
              value={password}
              onChange={setPassword}
              label="Password"
              autoComplete="new-password"
              showStrength
            />
          </Stack>
          <Note>
            Type into it. <b>Empty shows no meter</b> — a zero-strength bar reads as a failure the
            user has not earned yet.
          </Note>
        </Demo>
      </Section>

      <Section label="STRENGTH BAR — score 0 is empty, never red">
        <Demo>
          <Grid cols={3}>
            <StrengthBar score={0} />
            <StrengthBar score={1} />
            <StrengthBar score={2} />
            <StrengthBar score={3} />
            <StrengthBar score={4} />
          </Grid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<OtpInput value* onChange* onComplete? length={6} />
<PasswordInput value* onChange* label* showStrength? />
<StrengthBar score={0..4} labels? />
scorePassword(password): 0..4   // the shared source of truth

// the OTP cells are presentation — ONE hidden input takes the keystrokes
// the meter and the validator call scorePassword — they cannot disagree
// empty shows NO meter; score 0 renders EMPTY segments, never a red bar`}</Api>
      </Section>
    </Specimen>
  );
}

export function InputsDatePart() {
  const [date, setDate] = useState('2026-08-27');
  const [time, setTime] = useState('18:30');
  const [range, setRange] = useState({ from: '2026-08-24', to: '2026-08-31' });

  return (
    <Specimen
      title="Date · Time · Range"
      spec="59-date.html · 60-date-range.html · 61-time.html"
      description="Native pickers in our chrome — the platform wins on locale, keyboard and screen readers."
    >
      <Rule>
        These wrap the <b>native</b> pickers rather than re-implementing a calendar. A hand-rolled
        one has to re-solve locale, keyboard navigation, screen readers and every phone's own
        conventions — and loses to the platform on all four.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <Stack className="max-w-[420px]">
            <DateInput value={date} onChange={setDate} label="Cook on" />
            <TimeInput value={time} onChange={setTime} label="At" />
            <DateRange from={range.from} to={range.to} onChange={setRange} label="Report window" />
          </Stack>
          <Note>
            In the range, try setting the end before the start — the second field's{' '}
            <code>min</code> is bound to the first, so it is <b>unpickable</b> rather than merely
            invalid.
          </Note>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Editable.">
              <DateInput value="2026-08-27" onChange={() => {}} label="Date" />
            </StateCard>
            <StateCard name="invalid" when="Outside the allowed window.">
              <DateInput value="2020-01-01" onChange={() => {}} label="Date" invalid />
            </StateCard>
            <StateCard name="readOnly" when="Fixed by the record — full ink.">
              <DateInput value="2026-08-27" onChange={() => {}} label="Date" readOnly />
            </StateCard>
            <StateCard name="disabled" when="Unavailable.">
              <DateInput value="2026-08-27" onChange={() => {}} label="Date" disabled />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function InputsUploadPart() {
  return (
    <Specimen
      title="File upload"
      spec="57-file-upload.html"
      description="One row per file, each with its own progress and its own error."
    >
      <Rule>
        <b>Every file carries its OWN progress and its OWN error.</b> One aggregate bar across five
        uploads tells a user nothing about which failed. And{' '}
        <b>a failed file stays in the list with a retry</b> — a file that vanishes reads as a file
        that uploaded.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <div className="max-w-[520px]">
            <FileUpload
              files={FILES}
              onSelect={() => {}}
              onRemove={() => {}}
              onRetry={() => {}}
              accept="image/*"
              multiple
              maxSize={5 * 1024 * 1024}
              label="Hero images"
            />
          </div>
          <Note>
            Three files, three fates: settled, uploading, failed. The limit is stated in the prompt
            rather than discovered by failing.
          </Note>
        </Demo>
      </Section>

      <Section label="EMPTY">
        <Demo>
          <div className="max-w-[520px]">
            <FileUpload files={[]} onSelect={() => {}} onRemove={() => {}} label="Hero image" maxSize={5 * 1024 * 1024} />
          </div>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function InputsDomainPart() {
  const [cuisines, setCuisines] = useState<readonly string[]>(['Nigerian', 'West African']);
  const [floor, setFloor] = useState<'easy' | 'medium' | 'anything'>('medium');
  const [units, setUnits] = useState<'metric' | 'imperial' | 'as_we_measure'>('as_we_measure');

  return (
    <Specimen
      title="Domain pickers"
      spec="67-cuisine-picker.html · 68-difficulty-picker.html · 69-measurement-toggle.html"
      description="Three preferences that read their labels from the status registry, so a control and its pill cannot drift."
    >
      <Section label="CUISINE — deselecting everything is valid">
        <Demo>
          <CuisinePicker value={cuisines} onChange={setCuisines} />
          <Note>Clear them all — the copy says what that means rather than looking broken.</Note>
        </Demo>
      </Section>

      <Section label="DIFFICULTY FLOOR — not recipe difficulty">
        <Demo>
          <div className="max-w-[440px]">
            <DifficultyPicker value={floor} onChange={setFloor} />
          </div>
          <Note>
            This is <code>DifficultyFloor</code> (<code>easy|medium|anything</code>), <b>not</b>{' '}
            recipe <code>Difficulty</code> (<code>easy|medium|involved</code>). The two were never
            reconciled in the shipped system, and Settings leaked the raw <code>anything</code>
            straight to the user.
          </Note>
        </Demo>
      </Section>

      <Section label="MEASUREMENT — global, not per screen">
        <Demo>
          <MeasurementToggle value={units} onChange={setUnits} />
          <Note>
            The third value is the PRD's — <b>as Nigerians measure</b>: derica, cup, wrap, paint
            rubber. No generic recipe app offers it, and it is part of why this product is for this
            audience.
          </Note>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function InputsEditorsPart() {
  const [rows, setRows] = useState<IngredientRow[]>([
    { id: '1', name: 'Long-grain rice', quantity: 3, unit: 'cups', approximate: false },
    { id: '2', name: 'Palm oil', quantity: 0.5, unit: 'cup', approximate: true },
  ]);
  const [steps, setSteps] = useState<StepRow[]>([
    { id: '1', instruction: 'Blend the peppers, tomatoes and onion.', minutes: null },
    { id: '2', instruction: 'Fry until the oil floats to the top.', minutes: 12 },
  ]);

  return (
    <Specimen
      title="Ingredient · Step editors"
      spec="70-ingredient-editor.html · 71-step-editor.html"
      description="The curator's row editors — where a quantity is marked as an estimate."
    >
      <Rule>
        <b><code>approximate</code> per row is an honesty control, not a nicety.</b> It drives the{' '}
        <code>≈</code> a cook sees. A curator marking one quantity as estimated is making a claim
        on the product's behalf.
      </Rule>

      <Section label="INGREDIENTS">
        <Demo>
          <IngredientEditor
            rows={rows}
            onChange={(id, patch) =>
              setRows((current) => current.map((r) => (r.id === id ? { ...r, ...patch } : r)))
            }
            onAdd={() =>
              setRows((current) => [
                ...current,
                { id: String(Date.now()), name: '', quantity: null, unit: '', approximate: false },
              ])
            }
            onRemove={(id) => setRows((current) => current.filter((r) => r.id !== id))}
          />
          <Note>
            The <code>≈</code> button is the honesty control. Remove every row — the empty state
            offers the way back rather than leaving a blank panel.
          </Note>
        </Demo>
      </Section>

      <Section label="STEPS — the index is derived from order">
        <Demo>
          <StepEditor
            steps={steps}
            onChange={(id, patch) =>
              setSteps((current) => current.map((s) => (s.id === id ? { ...s, ...patch } : s)))
            }
            onAdd={() =>
              setSteps((current) => [
                ...current,
                { id: String(Date.now()), instruction: '', minutes: null },
              ])
            }
            onRemove={(id) => setSteps((current) => current.filter((s) => s.id !== id))}
            onReorder={(id, direction) =>
              setSteps((current) => {
                const index = current.findIndex((s) => s.id === id);
                const next = index + direction;
                if (index < 0 || next < 0 || next >= current.length) return current;
                const copy = [...current];
                const [moved] = copy.splice(index, 1);
                if (moved !== undefined) copy.splice(next, 0, moved);
                return copy;
              })
            }
          />
          <Note>
            Reorder them — the numbers follow, because the index is <b>derived from order</b> and
            never a typed field. A typed index desyncs the moment anything moves.
          </Note>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<IngredientEditor rows* onChange* onAdd* onRemove* />
<StepEditor steps* onChange* onAdd* onRemove* onReorder? />

// \`approximate\` per row drives the cook-side ≈ — an honesty control
// removing the last row is allowed; the empty state offers the way back
// step index is DERIVED from order — never a typed field`}</Api>
      </Section>
    </Specimen>
  );
}
