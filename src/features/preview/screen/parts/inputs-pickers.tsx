import { useCallback, useState } from 'react';

import { ChipInput, Combobox, Select, Slider, Stepper, type ChipItem, type ComboboxOption } from '@ui/inputs';

import { Api, Demo, Note, Rule, Section, Specimen, StateCard, StateGrid } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/43-stepper.html
 *                                                          50-select.html
 *                                                          51-combobox.html
 *                                                          53-chip-input.html
 *                                                          65-slider.html
 */

const UNIT_OPTIONS = [
  { value: 'metric', label: 'Metric (g, ml)' },
  { value: 'imperial', label: 'Imperial (oz, cups)' },
  { value: 'local', label: 'Local (derica, paint rubber)' },
];

const INGREDIENTS: ComboboxOption[] = [
  { value: 'scotch-bonnet', label: 'Scotch bonnet', detail: 'Pepper' },
  { value: 'scotch-bonnet-dried', label: 'Scotch bonnet, dried', detail: 'Pepper' },
  { value: 'bell-pepper', label: 'Bell pepper', detail: 'Pepper' },
];

export function StepperPart() {
  const [serves, setServes] = useState(4);

  return (
    <Specimen
      title="Stepper"
      spec="43-stepper.html"
      description="For a number a user nudges rather than types. Both controls are always visible."
    >
      <Rule>
        <b>Both controls are always visible</b> — a stepper that hides its minus until hover is
        unusable on a phone with wet hands, which is the actual posture of the person using this.
        And <b>only the END that is reached disables</b>, never the whole control.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <Stepper value={serves} onChange={setServes} label="Serves" unit="serves" min={1} max={40} />
          <Note>
            Focus the number and press Shift+Arrow — <code>largeStep</code> jumps by 5, because a
            40-serving recipe should not need 36 taps.
          </Note>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Mid-range.">
              <Stepper value={4} onChange={() => {}} label="Serves" min={1} max={40} />
            </StateCard>
            <StateCard name="at minimum" when="Only that end disables.">
              <Stepper value={1} onChange={() => {}} label="Serves" min={1} max={40} />
            </StateCard>
            <StateCard name="at maximum" when="The other end stays live.">
              <Stepper value={40} onChange={() => {}} label="Serves" min={1} max={40} />
            </StateCard>
            <StateCard name="invalid" when="Out of range.">
              <Stepper value={0} onChange={() => {}} label="Serves" min={0} max={40} invalid />
            </StateCard>
            <StateCard name="disabled" when="Unavailable.">
              <Stepper value={4} onChange={() => {}} label="Serves" disabled />
            </StateCard>
            <StateCard name="readOnly" when="Fixed by the recipe.">
              <Stepper value={4} onChange={() => {}} label="Serves" readOnly />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Stepper value* onChange* label* min? max? step? largeStep? unit? />

// Shift+Arrow uses largeStep — a 40-serving recipe should not need 36 taps
// only the END that is reached disables, never the whole control
// the number never tweens; the digit swaps in place`}</Api>
      </Section>
    </Specimen>
  );
}

export function SelectPart() {
  const [units, setUnits] = useState<string | undefined>('metric');

  return (
    <Specimen
      title="Select"
      spec="50-select.html"
      description="A closed list the user picks from without typing. Under about seven options it beats a combobox."
    >
      <Rule>
        Under about <b>seven options</b> use Select; above it use Combobox. Opening a keyboard to
        choose from five things is friction.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <div className="max-w-[340px]">
            <Select value={units} onValueChange={setUnits} options={UNIT_OPTIONS} label="Measurement" />
          </div>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Closed with a value.">
              <Select value="metric" onValueChange={() => {}} options={UNIT_OPTIONS} label="Measurement" />
            </StateCard>
            <StateCard name="placeholder" when="Nothing chosen yet.">
              <Select value={undefined} onValueChange={() => {}} options={UNIT_OPTIONS} label="Measurement" />
            </StateCard>
            <StateCard name="empty" when="Open, no options.">
              <Select value={undefined} onValueChange={() => {}} options={[]} label="Measurement" />
            </StateCard>
            <StateCard name="loading" when="Fetching options.">
              <Select value={undefined} onValueChange={() => {}} options={[]} label="Measurement" loading />
            </StateCard>
            <StateCard name="error" when="Failed to load options.">
              <Select
                value={undefined}
                onValueChange={() => {}}
                options={[]}
                label="Measurement"
                loadError="Could not load options"
              />
            </StateCard>
            <StateCard name="disabled" when="Unavailable.">
              <Select value="metric" onValueChange={() => {}} options={UNIT_OPTIONS} label="Measurement" disabled />
            </StateCard>
            <StateCard name="readOnly" when="Fixed by policy — full ink.">
              <Select value="metric" onValueChange={() => {}} options={UNIT_OPTIONS} label="Measurement" readOnly />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>
    </Specimen>
  );
}

export function ComboboxPart() {
  const [query, setQuery] = useState('scotch');
  const [picked, setPicked] = useState<string | undefined>();
  const noop = useCallback(() => {}, []);

  const filtered = INGREDIENTS.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Specimen
      title="Combobox"
      spec="51-combobox.html · 41-input-search.html"
      description="Type to narrow, then pick. The product's busiest input, and the one whose empty state cannot be a dead end."
    >
      <Rule>
        <b>The empty state is load-bearing.</b> “No match” must still let the ingredient through,
        or the whole funnel stops. <code>onCreate</code> and <code>onAbort</code> are both{' '}
        <b>required props</b> — the dictionary will never cover every Nigerian ingredient, and a
        result set that answers a query the user has already changed is worse than an empty one.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <div className="max-w-[420px]">
            <Combobox
              query={query}
              onQueryChange={setQuery}
              onSelect={(option) => setPicked(option.label)}
              options={filtered}
              onCreate={(label) => setPicked(`${label} (added anyway)`)}
              onAbort={noop}
              label="Add an ingredient"
            />
            {picked !== undefined && (
              <p className="mt-3 text-sm font-extrabold text-success-onsoft">Added: {picked}</p>
            )}
          </div>
          <Note>
            Try typing something the dictionary does not have — “ugu leaf” — and the empty state
            offers the way through instead of stopping you.
          </Note>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Filtered results.">
              <Combobox query="scotch" onQueryChange={() => {}} onSelect={() => {}}
                options={INGREDIENTS} onCreate={() => {}} onAbort={noop} label="Add an ingredient" />
            </StateCard>
            <StateCard name="loading" when="Querying.">
              <Combobox query="scotch" onQueryChange={() => {}} onSelect={() => {}}
                options={[]} onCreate={() => {}} onAbort={noop} label="Add an ingredient" loading />
            </StateCard>
            <StateCard name="skeleton" when="Dictionary loading on first open.">
              <Combobox query="" onQueryChange={() => {}} onSelect={() => {}}
                options={[]} onCreate={() => {}} onAbort={noop} label="Add an ingredient" initialising />
            </StateCard>
            <StateCard name="error" when="Lookup down; typing still works.">
              <Combobox query="ugu" onQueryChange={() => {}} onSelect={() => {}}
                options={[]} onCreate={() => {}} onAbort={noop} label="Add an ingredient"
                lookupError="Suggestions are down." />
            </StateCard>
            <StateCard name="disabled" when="Unavailable.">
              <Combobox query="" onQueryChange={() => {}} onSelect={() => {}}
                options={[]} onCreate={() => {}} onAbort={noop} label="Add an ingredient" disabled />
            </StateCard>
          </StateGrid>
        </Demo>
        <Note>Click into a field above to open its list.</Note>
      </Section>

      <Section label="API">
        <Api>{`<Combobox query* onQueryChange* onSelect* options*
          onCreate* onAbort* label* loading? initialising? lookupError? />

// onCreate is REQUIRED — the dictionary will never cover every
//   Nigerian ingredient; empty NEVER dead-ends
// onAbort is REQUIRED — a stale result set is worse than none`}</Api>
      </Section>
    </Specimen>
  );
}

export function ChipInputPart() {
  const [items, setItems] = useState<ChipItem[]>([
    { id: '1', label: 'Rice', source: 'typed' },
    { id: '2', label: 'Tomatoes', source: 'typed' },
    { id: '3', label: 'Scotch bonnet', source: 'voice' },
    { id: '4', label: 'Half a yam', source: 'photo', uncertain: true },
  ]);

  return (
    <Specimen
      title="Chip input"
      spec="53-chip-input.html"
      description="The kitchen basket — the product's signature input. Three sources, one chip set, provenance kept on each chip."
    >
      <Rule>
        The chip <b>carries which source it came from</b>, because an AI-extracted guess and a
        typed certainty are not the same claim. A photo guess renders dashed in grape and awaits
        confirmation; a typed chip is solid.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <div className="max-w-[520px]">
            <ChipInput
              items={items}
              label="Your kitchen"
              onAdd={(label) =>
                setItems((current) => [
                  ...current,
                  { id: String(Date.now()), label, source: 'typed' },
                ])
              }
              onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
            />
          </div>
          <Note>
            Type and press Enter to add. Backspace on an empty field removes the last chip. Remove
            them all — the empty state explains the next step rather than leaving a blank box.
          </Note>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Chips from typing.">
              <ChipInput
                items={[
                  { id: 'a', label: 'Rice', source: 'typed' },
                  { id: 'b', label: 'Tomatoes', source: 'typed' },
                ]}
                label="Basket"
                onAdd={() => {}}
                onRemove={() => {}}
              />
            </StateCard>
            <StateCard name="loading" when="Extraction running; existing chips stay.">
              <ChipInput
                items={[{ id: 'a', label: 'Rice', source: 'typed' }]}
                label="Basket"
                onAdd={() => {}}
                onRemove={() => {}}
                loading
              />
            </StateCard>
            <StateCard name="empty" when="Nothing added yet — the CTA above is disabled and says why.">
              <ChipInput items={[]} label="Basket" onAdd={() => {}} onRemove={() => {}} />
            </StateCard>
            <StateCard name="error" when="Extraction failed — typed chips are kept.">
              <ChipInput
                items={[{ id: 'a', label: 'Rice', source: 'typed' }]}
                label="Basket"
                onAdd={() => {}}
                onRemove={() => {}}
                error="We could not read that photo. Try another, or type it."
              />
            </StateCard>
            <StateCard name="disabled" when="Basket locked while suggesting.">
              <ChipInput
                items={[
                  { id: 'a', label: 'Rice', source: 'typed' },
                  { id: 'b', label: 'Tomatoes', source: 'typed' },
                ]}
                label="Basket"
                onAdd={() => {}}
                onRemove={() => {}}
                disabled
              />
            </StateCard>
          </StateGrid>
        </Demo>
        <Note>
          <b>Existing chips are never cleared by a new extraction.</b> A failed photo read must not
          cost the user the six things they already typed.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<ChipInput items* onAdd* onRemove* label* loading? error? disabled? />

// each item carries source?="typed|voice|photo" and uncertain?
// \`uncertain\` drives the dashed grape treatment — a photo guess
// removing the last chip does NOT clear the screen; the empty state
//   explains the next step`}</Api>
      </Section>
    </Specimen>
  );
}

export function SliderPart() {
  const [serves, setServes] = useState(4);
  const [time, setTime] = useState(45);

  return (
    <Specimen
      title="Slider"
      spec="65-slider.html"
      description="For a value where the approximate position matters more than the exact number."
    >
      <Rule>
        <b>It always shows its value as a figure.</b> A handle position alone is not a fact — a
        user cannot report “about two-thirds” to anyone.
      </Rule>

      <Section label="LIVE">
        <Demo>
          <div className="flex max-w-[420px] flex-col gap-6">
            <Slider value={serves} onChange={setServes} label="Serves" min={1} max={12} />
            <Slider
              value={time}
              onChange={setTime}
              label="Maximum cook time"
              min={10}
              max={180}
              step={5}
              unit="min"
            />
          </div>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="Mid-range.">
              <Slider value={45} onChange={() => {}} label="Cook time" min={10} max={180} unit="min" />
            </StateCard>
            <StateCard name="at minimum" when="The fill is empty but the figure is not.">
              <Slider value={10} onChange={() => {}} label="Cook time" min={10} max={180} unit="min" />
            </StateCard>
            <StateCard name="invalid" when="Out of the allowed band.">
              <Slider value={180} onChange={() => {}} label="Cook time" min={10} max={180} unit="min" invalid />
            </StateCard>
            <StateCard name="disabled" when="Unavailable.">
              <Slider value={45} onChange={() => {}} label="Cook time" min={10} max={180} unit="min" disabled />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>
    </Specimen>
  );
}
