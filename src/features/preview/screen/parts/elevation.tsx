import { Repeat } from 'meemaw';

import { Demo, Grid, Note, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/06-elevation.html
 */

interface Drop {
  token: string;
  className: string;
  use: string;
}

const DROPS: Drop[] = [
  { token: '--drop-sm', className: 'shadow-drop-sm', use: 'Chips, small tiles, state cards' },
  { token: '--drop', className: 'shadow-drop', use: 'The default — buttons, cards, panels' },
  { token: '--drop-lg', className: 'shadow-drop-lg', use: 'The one thing that acts on a screen' },
  { token: '--drop-sky', className: 'shadow-drop-sky', use: 'A sky control presses onto sky-press' },
  { token: '--drop-crit', className: 'shadow-drop-crit', use: 'An irreversible control' },
];

const Z_SCALE = [
  { token: '--z-base', value: 1 },
  { token: '--z-sticky', value: 100 },
  { token: '--z-nav', value: 200 },
  { token: '--z-dropdown', value: 300 },
  { token: '--z-scrim', value: 400 },
  { token: '--z-modal', value: 500 },
  { token: '--z-toast', value: 600 },
  { token: '--z-tooltip', value: 700 },
];

export function ElevationPart() {
  return (
    <Specimen
      title="Elevation"
      spec="06-elevation.html"
      description="Depth is a solid drop-edge the control presses into, never a blur."
    >
      <Rule>
        <b>The object presses down onto its own edge.</b> Blur is reserved for the overlay layer
        only — a popover, a modal. Everything on the page plane gets a solid offset in ink.
      </Rule>

      <Section label="THE DROP-EDGE">
        <Demo>
          <div className="flex flex-col gap-5">
            <Repeat each={DROPS}>
              {(drop: Drop) => (
                <div key={drop.token} className="flex items-center gap-4">
                  <div
                    className={`h-14 w-[130px] shrink-0 rounded-blade border border-ink bg-white ${drop.className}`}
                  />
                  <div>
                    <code className="font-mono text-xs font-bold">{drop.token}</code>
                    <p className="text-sm text-ink-2">{drop.use}</p>
                  </div>
                </div>
              )}
            </Repeat>
          </div>
        </Demo>
      </Section>

      <Section label="THE PRESS — where the depth earns itself">
        <Demo>
          <Grid cols={2}>
            <div>
              <p className="mb-2 text-sm font-extrabold text-ink-3">rest</p>
              <span className="inline-flex h-ctrl items-center rounded-blade border border-ink bg-sky px-5 font-extrabold text-sky-onbase shadow-drop-sky">
                Suggest meals
              </span>
            </div>
            <div>
              <p className="mb-2 text-sm font-extrabold text-ink-3">pressed</p>
              <span className="inline-flex h-ctrl translate-x-[3px] translate-y-[4px] items-center rounded-blade border border-ink bg-sky-press px-5 font-extrabold text-sky-onbase shadow-none">
                Suggest meals
              </span>
            </div>
          </Grid>
        </Demo>
        <Note>
          The control travels exactly the offset of its own shadow and the shadow goes to zero — so
          it lands flush on the surface it was floating above. That is the one piece of physicality
          in the system.
        </Note>
      </Section>

      <Section label="BLUR — the overlay layer only">
        <Demo tone="plain">
          <Grid cols={2}>
            <div className="rounded-blade-lg bg-white p-5 shadow-pop">
              <p className="text-sm font-extrabold">shadow-pop</p>
              <p className="text-sm text-ink-2">Popover, dropdown, tooltip</p>
            </div>
            <div className="rounded-blade-lg bg-white p-5 shadow-modal">
              <p className="text-sm font-extrabold">shadow-modal</p>
              <p className="text-sm text-ink-2">Modal, sheet, takeover</p>
            </div>
          </Grid>
        </Demo>
      </Section>

      <Section label="NAMED Z-INDEX SCALE">
        <Demo>
          <div className="flex flex-col gap-2">
            <Repeat each={Z_SCALE}>
              {(step: { token: string; value: number }) => (
                <div key={step.token} className="flex items-center gap-3 border-b border-line pb-2">
                  <code className="w-[130px] shrink-0 font-mono text-xs font-bold">
                    {step.token}
                  </code>
                  <span className="font-mono text-xs tnum text-ink-2">{step.value}</span>
                </div>
              )}
            </Repeat>
          </div>
        </Demo>
        <Note>
          A raw z-index number anywhere in component code is a bug. The scale exists so stacking is
          argued once, here, and never re-litigated per component.
        </Note>
      </Section>
    </Specimen>
  );
}
