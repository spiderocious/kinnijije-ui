import type { ReactNode } from 'react';

import { Demo, Grid, Note, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/15-density.html
 *
 * KITCHEN vs COUNTER — the two registers, rendered side by side.
 */

/** A miniature of the same surface, so only the register differs. */
function SampleSurface({ heading }: { readonly heading: string }) {
  return (
    <div className="rounded-blade-lg border border-ink bg-white p-pad shadow-drop">
      <p className="mb-gap font-display text-lg font-extrabold tracking-display">{heading}</p>

      <div className="mb-gap flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-line py-row-y">
          <span className="text-ctrl">Jollof Rice</span>
          <span className="font-mono text-sm tnum text-ink-3">45 min</span>
        </div>
        <div className="flex items-center justify-between border-b border-line py-row-y">
          <span className="text-ctrl">Egusi Soup</span>
          <span className="font-mono text-sm tnum text-ink-3">70 min</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          defaultValue="Rice"
          aria-label="Ingredient"
          className="h-ctrl min-w-0 flex-1 rounded-blade-sm border border-ink bg-white px-3 text-ctrl outline-none"
        />
        <button
          type="button"
          className="h-ctrl rounded-blade border border-ink bg-sky px-4 text-ctrl font-extrabold text-sky-onbase shadow-drop-sky"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function Register({
  name,
  tagline,
  children,
}: {
  readonly name: string;
  readonly tagline: string;
  readonly children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.06em]">{name}</p>
      <p className="mb-3 text-sm text-ink-3">{tagline}</p>
      {children}
    </div>
  );
}

export function DensityPart() {
  return (
    <Specimen
      title="Density"
      spec="15-density.html"
      description="Two registers, one stance. The same markup renders at two densities depending on one wrapper class."
    >
      <Rule>
        <b>One wrapper class resolves the whole register.</b> No component takes a density prop —
        that is what keeps two registers from drifting into two systems. Wrap a subtree in{' '}
        <code>.counter</code> and every control height, pad, row gap, control font size and the
        three larger blade radii re-resolve at once.
      </Rule>

      <Section label="THE TWO REGISTERS, SAME MARKUP">
        <Demo tone="plain">
          <Grid cols={2}>
            <Register name="KITCHEN" tagline="The cook. Thumb-sized, 46px controls, drop-edge everywhere.">
              <SampleSurface heading="Tonight" />
            </Register>

            <Register
              name="COUNTER"
              tagline="The curator. 34px controls, hairline structure, drop-edge on the one control that acts."
            >
              <div className="counter">
                <SampleSurface heading="Tonight" />
              </div>
            </Register>
          </Grid>
        </Demo>
        <Note>
          Same colours, same blade, same type. Only the box changes. The cook is holding a phone
          with one hand while stirring; the curator is at a desk reviewing four hundred recipes.
        </Note>
      </Section>

      <Section label="WHAT THE WRAPPER RE-RESOLVES">
        <Demo>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-ink pb-2 pr-3 text-left text-xs font-extrabold uppercase tracking-overline text-ink-3">
                  Token
                </th>
                <th className="border-b border-ink pb-2 pr-3 text-left text-xs font-extrabold uppercase tracking-overline text-ink-3">
                  KITCHEN
                </th>
                <th className="border-b border-ink pb-2 text-left text-xs font-extrabold uppercase tracking-overline text-ink-3">
                  COUNTER
                </th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              <tr>
                <td className="border-b border-line py-2 pr-3 font-bold">--h-sm / md / lg</td>
                <td className="border-b border-line py-2 pr-3 text-ink-2">38 / 46 / 56px</td>
                <td className="border-b border-line py-2 text-ink-2">28 / 34 / 40px</td>
              </tr>
              <tr>
                <td className="border-b border-line py-2 pr-3 font-bold">--pad</td>
                <td className="border-b border-line py-2 pr-3 text-ink-2">18px</td>
                <td className="border-b border-line py-2 text-ink-2">12px</td>
              </tr>
              <tr>
                <td className="border-b border-line py-2 pr-3 font-bold">--row-y</td>
                <td className="border-b border-line py-2 pr-3 text-ink-2">12px</td>
                <td className="border-b border-line py-2 text-ink-2">7px</td>
              </tr>
              <tr>
                <td className="border-b border-line py-2 pr-3 font-bold">--gap</td>
                <td className="border-b border-line py-2 pr-3 text-ink-2">14px</td>
                <td className="border-b border-line py-2 text-ink-2">10px</td>
              </tr>
              <tr>
                <td className="border-b border-line py-2 pr-3 font-bold">--fs-ctrl</td>
                <td className="border-b border-line py-2 pr-3 text-ink-2">14.5px</td>
                <td className="border-b border-line py-2 text-ink-2">13px</td>
              </tr>
              <tr>
                <td className="border-b border-line py-2 pr-3 font-bold">--blade-md / lg / xl</td>
                <td className="border-b border-line py-2 pr-3 text-ink-2">20 / 24 / 28px</td>
                <td className="border-b border-line py-2 text-ink-2">14 / 16 / 18px</td>
              </tr>
            </tbody>
          </table>
        </Demo>
        <Note>
          Colours, semantics, type families and the blade law are <b>not</b> in this table — they
          are identical in both registers. That is what makes it one stance rather than two.
        </Note>
      </Section>
    </Specimen>
  );
}
