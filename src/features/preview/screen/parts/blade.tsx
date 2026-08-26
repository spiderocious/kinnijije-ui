import { Repeat } from 'meemaw';

import { Demo, Grid, Note, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/04-blade.html
 *
 * THE LAW, rendered. Every surface has exactly one sharp corner and three
 * round, clockwise from top-left: round · sharp · round · sharp.
 */

interface BladeSize {
  name: string;
  token: string;
  value: string;
  use: string;
}

const SIZES: BladeSize[] = [
  { name: 'xs', token: '--blade-xs', value: '10px 3px 10px 3px', use: 'Chips, tags, small marks' },
  { name: 'sm', token: '--blade-sm', value: '16px 5px 16px 5px', use: 'Inputs, rows, tiles' },
  { name: 'md', token: '--blade-md', value: '20px 6px 20px 6px', use: 'Buttons, callouts' },
  { name: 'lg', token: '--blade-lg', value: '24px 6px 24px 6px', use: 'Cards, panels' },
  { name: 'xl', token: '--blade-xl', value: '28px 8px 28px 8px', use: 'Sheets, modals' },
];

export function BladePart() {
  return (
    <Specimen
      title="The blade"
      spec="04-blade.html"
      description="The one law of this system, rendered. Count the corners."
    >
      <Rule>
        <b>Every surface has exactly ONE sharp corner and THREE round</b>, clockwise from top-left:
        round · sharp · round · sharp. It reads as a knife edge, a chopping-board corner, a torn
        recipe card. <b>Falsifiable:</b> open any surface and count. Four round corners, or two
        sharp, is not in this system.
      </Rule>

      <Section label="THE FIVE SIZES">
        <Demo>
          <div className="flex flex-col gap-4">
            <Repeat each={SIZES}>
              {(size: BladeSize) => (
                <div key={size.name} className="flex items-center gap-4">
                  <div
                    className="h-[72px] w-[120px] shrink-0 border border-ink bg-sky-soft shadow-drop-sm"
                    style={{ borderRadius: `var(${size.token})` }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold">blade-{size.name}</p>
                    <code className="font-mono text-xs text-ink-3">{size.value}</code>
                    <p className="mt-1 text-sm text-ink-2">{size.use}</p>
                  </div>
                </div>
              )}
            </Repeat>
          </div>
        </Demo>
        <Note>
          The sharp corner stays small and constant across all five sizes, so the cut reads the
          same whether it is a 20px chip or a full-bleed sheet.
        </Note>
      </Section>

      <Section label="WHAT BREAKS IT">
        <Demo>
          <Grid cols={4}>
            <div>
              <div className="mb-2 h-[72px] rounded-blade border border-ink bg-success-soft shadow-drop-sm" />
              <p className="text-sm font-extrabold text-success-onsoft">✓ correct</p>
              <p className="text-xs text-ink-3">one sharp, three round</p>
            </div>
            <div>
              <div className="mb-2 h-[72px] rounded-[20px] border border-ink bg-critical-soft shadow-drop-sm" />
              <p className="text-sm font-extrabold text-critical-onsoft">✕ all round</p>
              <p className="text-xs text-ink-3">generic; any app</p>
            </div>
            <div>
              <div className="mb-2 h-[72px] rounded-[24px_6px_24px_24px] border border-ink bg-critical-soft shadow-drop-sm" />
              <p className="text-sm font-extrabold text-critical-onsoft">✕ two sharp</p>
              <p className="text-xs text-ink-3">reads as a mistake</p>
            </div>
            <div>
              <div className="mb-2 h-[72px] rounded-[4px] border border-ink bg-critical-soft shadow-drop-sm" />
              <p className="text-sm font-extrabold text-critical-onsoft">✕ all sharp</p>
              <p className="text-xs text-ink-3">loses the play</p>
            </div>
          </Grid>
        </Demo>
        <Note>
          The shorthand runs top-left · top-right · bottom-right · bottom-left, so the blade pairs
          a large radius on one diagonal with a small one on the other. What reads is the{' '}
          <i>contrast</i> between the two — which is why the third example, dropping one small
          corner back to full round, breaks it.
        </Note>
      </Section>

      <Section label="THE TWO EXCEPTIONS">
        <Demo>
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <div className="mb-2 h-11 w-[120px] rounded-pill border border-ink bg-sky shadow-drop-sm" />
              <p className="text-sm font-extrabold">pill</p>
            </div>
            <div className="text-center">
              <div className="mb-2 h-11 w-11 rounded-round border border-ink bg-sky shadow-drop-sm" />
              <p className="text-sm font-extrabold">circle</p>
            </div>
          </div>
        </Demo>
        <Note>
          Pills and circles only — a chip’s remove button, an avatar in round mode, a progress
          track, a toggle knob, the FAB. A blade on a 17px circle reads as damage.
        </Note>
      </Section>
    </Specimen>
  );
}
