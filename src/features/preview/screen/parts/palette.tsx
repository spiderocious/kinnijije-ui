import { Repeat } from 'meemaw';

import { Demo, Grid, Note, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/01-palette.html
 */

interface Swatch {
  name: string;
  token: string;
  hex: string;
  onDark?: boolean;
}

const SKY_RAMP: Swatch[] = [
  { name: '50', token: '--sky-50', hex: '#F2FAFE' },
  { name: '100', token: '--sky-100', hex: '#E4F4FE' },
  { name: '200', token: '--sky-200', hex: '#C6E9FC' },
  { name: '300', token: '--sky-300', hex: '#A8DCF7' },
  { name: '400', token: '--sky-400', hex: '#6BC8F4' },
  { name: '500 · base', token: '--sky-500', hex: '#38B6F0', onDark: true },
  { name: '600 · hover', token: '--sky-600', hex: '#1798D6', onDark: true },
  { name: '700 · press', token: '--sky-700', hex: '#127BAE', onDark: true },
  { name: '800', token: '--sky-800', hex: '#0E5F87', onDark: true },
  { name: '900', token: '--sky-900', hex: '#0B4E71', onDark: true },
];

const INK_LADDER: Swatch[] = [
  { name: 'ink · strong', token: '--ink', hex: '#132430', onDark: true },
  { name: 'ink-2 · body', token: '--ink-2', hex: '#3A5567', onDark: true },
  { name: 'ink-3 · muted', token: '--ink-3', hex: '#6E8798', onDark: true },
  { name: 'ink-4 · disabled', token: '--ink-4', hex: '#9CB0BD' },
];

const GROUND: Swatch[] = [
  { name: 'white', token: '--white', hex: '#FFFFFF' },
  { name: 'paper · canvas', token: '--paper', hex: '#F7FAFC' },
  { name: 'paper-2 · recessed', token: '--paper-2', hex: '#EEF4F8' },
  { name: 'paper-3 · sunken', token: '--paper-3', hex: '#E7EEF4' },
  { name: 'line', token: '--line', hex: '#E3ECF2' },
  { name: 'line-2', token: '--line-2', hex: '#CFDDE7' },
];

interface Semantic {
  name: string;
  base: string;
  soft: string;
  onSoft: string;
  border: string;
  on: string;
}

const SEMANTICS: Semantic[] = [
  {
    name: 'neutral',
    base: 'bg-neutral',
    soft: 'bg-neutral-soft',
    onSoft: 'text-neutral-onsoft',
    border: 'border-neutral-border',
    on: 'text-neutral-on',
  },
  {
    name: 'info',
    base: 'bg-info',
    soft: 'bg-info-soft',
    onSoft: 'text-info-onsoft',
    border: 'border-info-border',
    on: 'text-info-on',
  },
  {
    name: 'success',
    base: 'bg-success',
    soft: 'bg-success-soft',
    onSoft: 'text-success-onsoft',
    border: 'border-success-border',
    on: 'text-success-on',
  },
  {
    name: 'caution',
    base: 'bg-caution',
    soft: 'bg-caution-soft',
    onSoft: 'text-caution-onsoft',
    border: 'border-caution-border',
    on: 'text-caution-on',
  },
  {
    name: 'critical',
    base: 'bg-critical',
    soft: 'bg-critical-soft',
    onSoft: 'text-critical-onsoft',
    border: 'border-critical-border',
    on: 'text-critical-on',
  },
];

function SwatchRow({ items }: { readonly items: Swatch[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
      <Repeat each={items}>
        {(swatch: Swatch) => (
          <div
            key={swatch.token}
            className="overflow-hidden rounded-blade-sm border border-ink shadow-drop-sm"
          >
            <div className="h-14" style={{ background: `var(${swatch.token})` }} />
            <div className="bg-white px-3 py-2">
              <p className="text-sm font-extrabold">{swatch.name}</p>
              <p className="font-mono text-xs text-ink-3">{swatch.hex}</p>
            </div>
          </div>
        )}
      </Repeat>
    </div>
  );
}

export function PalettePart() {
  return (
    <Specimen
      title="Palette"
      spec="01-palette.html"
      description="Whitish ground, sky as the one action colour, five semantics each shipping a five-slot quintet, and grape held outside the enum for AI provenance."
    >
      <Rule>
        <b>Sky acts, it never reports.</b> #38B6F0 is the action colour and always carries white
        text. No status, no metric, no lifecycle state may be sky — a blue badge invites a press.
        Falsifiable: grep any status component for <code>--sky</code>.
      </Rule>

      <Section label="SKY — the one action colour">
        <Demo>
          <SwatchRow items={SKY_RAMP} />
        </Demo>
        <Note>
          500 is the base, 600 the hover, 700 the pressed edge. The ramp exists so a surface can
          tint without inventing a colour — not so a screen can pick a different blue.
        </Note>
      </Section>

      <Section label="GROUND">
        <Demo>
          <SwatchRow items={GROUND} />
        </Demo>
        <Note>Near-white. Not cream, not pastel — the food and the creatures carry the warmth.</Note>
      </Section>

      <Section label="INK LADDER">
        <Demo>
          <SwatchRow items={INK_LADDER} />
        </Demo>
      </Section>

      <Section label="THE SEMANTIC ENUM — 5 values × 5 slots">
        <Demo>
          <div className="flex flex-col gap-3">
            <Repeat each={SEMANTICS}>
              {(semantic: Semantic) => (
                <div key={semantic.name} className="flex flex-wrap items-center gap-3">
                  <span className="w-[76px] shrink-0 font-mono text-xs font-bold">
                    {semantic.name}
                  </span>
                  <span
                    className={`flex h-9 w-[92px] items-center justify-center rounded-blade-xs text-xs font-extrabold ${semantic.base} ${semantic.on}`}
                  >
                    base
                  </span>
                  <span
                    className={`flex h-9 w-[92px] items-center justify-center rounded-blade-xs border text-xs font-extrabold ${semantic.soft} ${semantic.onSoft} ${semantic.border}`}
                  >
                    soft
                  </span>
                  <span className={`text-xs font-extrabold ${semantic.onSoft}`}>onSoft text</span>
                </div>
              )}
            </Repeat>
          </div>
        </Demo>
        <Note>
          <code>onSoft</code> is the slot the shipped system lacked, which is why #2E5C2B was
          hand-mixed inside a pill component. Colour comes from the enum; the word comes from the
          domain — a recipe is <i>Published</i>, not <i>easy</i>.
        </Note>
      </Section>

      <Section label="OUTSIDE THE ENUM — AI provenance">
        <Demo>
          <Grid cols={4}>
            <div className="rounded-blade-sm bg-grape px-4 py-3 text-sm font-extrabold text-grape-on">
              grape · base
            </div>
            <div className="rounded-blade-sm border border-grape-border bg-grape-soft px-4 py-3 text-sm font-extrabold text-grape-onsoft">
              grape · soft
            </div>
          </Grid>
        </Demo>
        <Note>
          Grape exists so “made by a machine” can never be confused with “verified by a human”. It
          is not a severity, never a button, never a warning.
        </Note>
      </Section>

      <Section label="FOOD TINTS — dish marks only, never chrome">
        <Demo>
          <Grid cols={3}>
            <div
              className="rounded-blade-sm px-4 py-3 text-sm font-extrabold"
              style={{ background: 'var(--dish-fill)', color: 'var(--dish-line)' }}
            >
              dish
            </div>
            <div
              className="rounded-blade-sm px-4 py-3 text-sm font-extrabold"
              style={{ background: 'var(--greens-fill)', color: 'var(--greens-line)' }}
            >
              greens
            </div>
            <div
              className="rounded-blade-sm px-4 py-3 text-sm font-extrabold"
              style={{ background: 'var(--berry-fill)', color: 'var(--berry-line)' }}
            >
              berry
            </div>
          </Grid>
        </Demo>
      </Section>
    </Specimen>
  );
}
