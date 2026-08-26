import { Repeat } from 'meemaw';

import { Demo, Note, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/02-type.html
 */

interface Scale {
  token: string;
  size: string;
  use: string;
}

const SCALE: Scale[] = [
  { token: '--fs-6xl', size: '78px', use: 'Marketing hero only' },
  { token: '--fs-5xl', size: '60px', use: 'Site section opener' },
  { token: '--fs-4xl', size: '46px', use: 'Scene title, celebration' },
  { token: '--fs-3xl', size: '36px', use: 'Screen heading' },
  { token: '--fs-2xl', size: '28px', use: 'Card title, big number' },
  { token: '--fs-xl', size: '23px', use: 'Section heading' },
  { token: '--fs-lg', size: '19px', use: 'Subheading' },
  { token: '--fs-md', size: '16px', use: 'Lead body' },
  { token: '--fs-base', size: '14.5px', use: 'Body — the default' },
  { token: '--fs-sm', size: '12.5px', use: 'Caption, helper' },
  { token: '--fs-xs', size: '11px', use: 'Overline, mono meta' },
];

interface Role {
  family: string;
  css: string;
  job: string;
  sample: string;
  className: string;
}

const ROLES: Role[] = [
  {
    family: 'Baloo 2',
    css: '--display',
    job: 'Shouts. Dish names, screen titles, numbers that matter.',
    sample: 'Jollof Rice',
    className: 'font-display font-extrabold text-3xl tracking-display',
  },
  {
    family: 'Nunito',
    css: '--sans',
    job: 'Chrome. Everything that is not shouting or recording.',
    sample: 'You have 8 of 11 ingredients for this meal.',
    className: 'font-sans text-md',
  },
  {
    family: 'JetBrains Mono',
    css: '--mono',
    job: 'The record. Times, counts, quantities, ids, prices.',
    sample: '45 min · 4 servings · ₦3,200',
    className: 'font-mono text-md tnum',
  },
];

export function TypePart() {
  return (
    <Specimen
      title="Type"
      spec="02-type.html"
      description="Three families, three jobs. Baloo 2 shouts, Nunito is chrome, JetBrains Mono is the record."
    >
      <Rule>
        <b>Mono is record.</b> Any number a person could check against reality — a cook time, a
        count, a price, a quantity — is set in JetBrains Mono with tabular numerals, so it cannot
        shift width as it updates.
      </Rule>

      <Section label="THE THREE ROLES">
        <Demo>
          <div className="flex flex-col gap-6">
            <Repeat each={ROLES}>
              {(role: Role) => (
                <div key={role.family}>
                  <div className="mb-1 flex items-baseline gap-3">
                    <span className="text-sm font-extrabold">{role.family}</span>
                    <code className="font-mono text-xs text-ink-3">var({role.css})</code>
                  </div>
                  <p className={role.className}>{role.sample}</p>
                  <p className="mt-1 text-sm text-ink-2">{role.job}</p>
                </div>
              )}
            </Repeat>
          </div>
        </Demo>
      </Section>

      <Section label="THE SCALE">
        <Demo>
          <div className="flex flex-col gap-3">
            <Repeat each={SCALE}>
              {(step: Scale) => (
                <div key={step.token} className="flex items-baseline gap-4 border-b border-line pb-3">
                  <code className="w-[92px] shrink-0 font-mono text-xs text-ink-3">
                    {step.size}
                  </code>
                  <span
                    className="min-w-0 flex-1 truncate font-display font-extrabold tracking-display"
                    style={{ fontSize: `var(${step.token})` }}
                  >
                    Kinnijije
                  </span>
                  <span className="w-[180px] shrink-0 text-right text-sm text-ink-3">
                    {step.use}
                  </span>
                </div>
              )}
            </Repeat>
          </div>
        </Demo>
      </Section>

      <Section label="TABULAR NUMERALS — the proof">
        <Demo>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-2 text-sm font-extrabold text-ink-3">tabular (correct)</p>
              <p className="font-mono text-2xl tnum">1,111</p>
              <p className="font-mono text-2xl tnum">8,888</p>
              <Note>Columns line up. A count can tick without the layout jumping.</Note>
            </div>
            <div>
              <p className="mb-2 text-sm font-extrabold text-ink-3">proportional (wrong here)</p>
              <p
                className="font-mono text-2xl"
                style={{ fontVariantNumeric: 'proportional-nums' }}
              >
                1,111
              </p>
              <p
                className="font-mono text-2xl"
                style={{ fontVariantNumeric: 'proportional-nums' }}
              >
                8,888
              </p>
            </div>
          </div>
        </Demo>
      </Section>

      <Section label="TRACKING">
        <Demo>
          <div className="flex flex-col gap-4">
            <p className="font-display text-2xl font-extrabold tracking-display">
              Display — tightened, −0.015em
            </p>
            <p className="text-md tracking-body">Body — neutral, 0</p>
            <p className="text-sm font-extrabold tracking-label">Label — opened, +0.01em</p>
            <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
              Overline — wide, +0.14em
            </p>
          </div>
        </Demo>
      </Section>
    </Specimen>
  );
}
