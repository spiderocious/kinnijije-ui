import { Repeat } from 'meemaw';

import { Blob, BlobThinking, type BlobExpression } from '@icons';

import { Api, Demo, Grid, Note, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/11-blobatar.html
 *                                                          12-blobatar-loading.html
 */

interface Pose {
  expression: BlobExpression;
  when: string;
}

const ROSTER: Pose[] = [
  { expression: 'idle', when: 'A resting avatar' },
  { expression: 'thinking', when: 'Every AI wait — extraction, suggestion, generation' },
  { expression: 'sleepy', when: 'Empty states — nothing here yet' },
  { expression: 'happy', when: 'Success — saved, published, cooked' },
  { expression: 'surprised', when: 'The first suggestion lands' },
  { expression: 'wink', when: 'A playful confirm' },
  { expression: 'unsure', when: 'A recoverable error' },
  { expression: 'sad', when: 'A hard failure' },
  { expression: 'love', when: 'A milestone' },
];

const PEOPLE = [
  'ada@kinnijije.ng',
  'tunde@kinnijije.ng',
  'chidinma@kinnijije.ng',
  'yemi@kinnijije.ng',
  'ngozi@kinnijije.ng',
  'segun@kinnijije.ng',
];

export function BlobatarPart() {
  return (
    <Specimen
      title="Blobatar"
      spec="11-blobatar.html · 12-blobatar-loading.html"
      description="A deterministic soft body and two capsule eyes drawn from any string — the same name always renders the same creature."
    >
      <Rule>
        <b>Hue is locked to 205 system-wide.</b> A screen may not pick its own. The name drives the
        shape, never the colour, so the creatures read as one family across the whole product. And{' '}
        <b><code>name</code> is WHO it stands for</b> — a username, an email, an id. Not a random
        seed.
      </Rule>

      <Section label="DETERMINISM — the same name, the same creature">
        <Demo>
          <div className="flex flex-wrap gap-5">
            <Repeat each={PEOPLE}>
              {(person: string) => (
                <div key={person} className="text-center">
                  <Blob name={person} size={56} />
                  <p className="mt-2 max-w-[110px] truncate font-mono text-xs text-ink-3">
                    {person.split('@')[0]}
                  </p>
                </div>
              )}
            </Repeat>
          </div>
        </Demo>
        <Note>
          Every blob here is genuine generated output, not an illustration style being reproduced.
          Reload and each person keeps their creature.
        </Note>
      </Section>

      <Section label="THE EXPRESSION ROSTER">
        <Demo>
          <Grid cols={3}>
            <Repeat each={ROSTER}>
              {(pose: Pose) => (
                <div
                  key={pose.expression}
                  className="rounded-blade-sm border border-line-2 bg-white p-4 text-center"
                >
                  <div className="mb-3 grid h-[72px] place-items-center">
                    <Blob name="chef" size={64} expression={pose.expression} />
                  </div>
                  <p className="font-mono text-xs font-bold">{pose.expression}</p>
                  <p className="mt-1 text-xs leading-snug text-ink-3">{pose.when}</p>
                </div>
              )}
            </Repeat>
          </Grid>
        </Demo>
        <Note>
          A pose is a state you hold — nothing returns to idle on its own, and there are no timers.
          A burst is setting the expression followed by your own timeout.
        </Note>
      </Section>

      <Section label="THINKING — the AI loader">
        <Demo>
          <div className="flex flex-wrap items-center gap-8">
            <div className="text-center">
              <BlobThinking size={64} label="Reading your photo" />
              <p className="mt-2 font-mono text-xs text-ink-3">extraction</p>
            </div>
            <div className="text-center">
              <BlobThinking size={64} label="Finding meals" />
              <p className="mt-2 font-mono text-xs text-ink-3">suggestion</p>
            </div>
            <div className="text-center">
              <BlobThinking size={64} label="Writing the answer" />
              <p className="mt-2 font-mono text-xs text-ink-3">generation</p>
            </div>
          </div>
        </Demo>
        <Note>
          One creature, one pose, everywhere the chef is working — so a machine wait always looks
          the same and never gets confused with a page load. It announces itself politely to screen
          readers.
        </Note>
      </Section>

      <Section label="COST — why animate is off by default">
        <Demo tone="plain">
          <p className="text-sm text-ink-2">
            A static blobatar is one <code className="font-mono text-xs">&lt;img&gt;</code>; an
            animated one is inline SVG at roughly a dozen DOM nodes. A list of 400 avatars is
            exactly the case the <code className="font-mono text-xs">&lt;img&gt;</code> default
            exists for.
          </p>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Blob name={user.email} size={44} />
<Blob name="chef" expression="thinking" animate="always" />
<BlobThinking size={64} label="Finding meals" />

// hue is locked to 205 by the wrapper — never passed by a screen
// name is WHO it stands for, not a random seed`}</Api>
      </Section>
    </Specimen>
  );
}
