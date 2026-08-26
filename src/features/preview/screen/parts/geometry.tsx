import { Repeat } from 'meemaw';

import { Demo, Note, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/03-geometry.html
 */

interface Step {
  token: string;
  px: number;
}

const SPACING: Step[] = [
  { token: '--s-1', px: 4 },
  { token: '--s-2', px: 8 },
  { token: '--s-3', px: 12 },
  { token: '--s-4', px: 16 },
  { token: '--s-5', px: 20 },
  { token: '--s-6', px: 24 },
  { token: '--s-7', px: 32 },
  { token: '--s-8', px: 40 },
  { token: '--s-9', px: 48 },
  { token: '--s-10', px: 64 },
  { token: '--s-11', px: 80 },
];

const BORDERS = [
  { token: '--bw-hair', value: '1.5px', use: 'COUNTER structure, quiet dividers' },
  { token: '--bw', value: '2px', use: 'The default — every framed surface' },
  { token: '--bw-bold', value: '2.5px', use: 'Specimen stamps, emphasis rules' },
];

const HEIGHTS = [
  { token: '--h-sm', kitchen: '38px', counter: '28px' },
  { token: '--h-md', kitchen: '46px', counter: '34px' },
  { token: '--h-lg', kitchen: '56px', counter: '40px' },
];

export function GeometryPart() {
  return (
    <Specimen
      title="Geometry"
      spec="03-geometry.html"
      description="A 4px ruler, three border widths, and control heights that resolve per register."
    >
      <Section label="SPACING RULER — 4px">
        <Demo>
          <div className="flex flex-col gap-2">
            <Repeat each={SPACING}>
              {(step: Step) => (
                <div key={step.token} className="flex items-center gap-3">
                  <code className="w-[72px] shrink-0 font-mono text-xs text-ink-3">
                    {step.token}
                  </code>
                  <div
                    className="h-4 rounded-[2px] bg-sky"
                    style={{ width: `var(${step.token})` }}
                  />
                  <span className="font-mono text-xs text-ink-3">{step.px}px</span>
                </div>
              )}
            </Repeat>
          </div>
        </Demo>
      </Section>

      <Section label="BORDER WIDTHS">
        <Demo>
          <div className="flex flex-col gap-4">
            <Repeat each={BORDERS}>
              {(border: { token: string; value: string; use: string }) => (
                <div key={border.token} className="flex items-center gap-4">
                  <div
                    className="h-14 w-[120px] shrink-0 rounded-blade-sm border-ink bg-white"
                    style={{ borderWidth: `var(${border.token})`, borderStyle: 'solid' }}
                  />
                  <div>
                    <p className="text-sm font-extrabold">
                      {border.token} · {border.value}
                    </p>
                    <p className="text-sm text-ink-2">{border.use}</p>
                  </div>
                </div>
              )}
            </Repeat>
          </div>
        </Demo>
      </Section>

      <Section label="CONTROL HEIGHTS — resolve per register">
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
            <tbody>
              <Repeat each={HEIGHTS}>
                {(height: { token: string; kitchen: string; counter: string }) => (
                  <tr key={height.token}>
                    <td className="border-b border-line py-2 pr-3 font-mono text-xs font-bold">
                      {height.token}
                    </td>
                    <td className="border-b border-line py-2 pr-3 font-mono text-xs text-ink-2">
                      {height.kitchen}
                    </td>
                    <td className="border-b border-line py-2 font-mono text-xs text-ink-2">
                      {height.counter}
                    </td>
                  </tr>
                )}
              </Repeat>
            </tbody>
          </table>
        </Demo>
        <Note>
          One wrapper class (<code>.counter</code>) resolves the whole register. No component takes
          a density prop — that is what keeps two registers from becoming two systems.
        </Note>
      </Section>
    </Specimen>
  );
}
