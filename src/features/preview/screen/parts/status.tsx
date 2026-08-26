import { Repeat } from 'meemaw';

import { Badge, Status, StatusSkeleton, Tag, TagSkeleton } from '@ui/status';
import {
  STATUS_KINDS,
  STATUS_REGISTRY,
  type StatusKind,
  type StatusValue,
} from '@ui/status/status-registry';

import { Api, Demo, Note, Row, Rule, Section, Specimen, StateCard, StateGrid } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/126-status-contract.html
 *              …through 143-status-measurement.html
 *                       146-badge.html · 147-tag.html
 */

interface Collision {
  tone: string;
  meanings: string;
}

const COLLISIONS: Collision[] = [
  { tone: 'easy', meanings: 'published · active user · AI call ok · feedback reviewed — 4 lifecycles' },
  { tone: 'warn', meanings: 'draft · suspended · AI error · feedback target kind — 4' },
  { tone: 'verified', meanings: 'seed recipe · admin role · current prompt version — 3' },
  { tone: 'medium', meanings: 'non-admin role · open feedback — 2, opposite valence' },
];

const FAMILY_TITLE: Record<StatusKind, string> = {
  'recipe-source': 'Recipe source — the trust proposition',
  recipe: 'Recipe status — the publish gate',
  'hero-image': 'Hero image kind',
  difficulty: 'Difficulty — the recipe’s effort',
  'difficulty-floor': 'Difficulty floor — the user’s preference',
  match: 'Match strength',
  approximate: 'Approximate marker',
  'have-need': 'Have / need',
  user: 'User status',
  role: 'User role',
  feedback: 'Feedback status',
  'feedback-target': 'Feedback target',
  'ai-kind': 'AI call kind',
  'ai-result': 'AI call status',
  extraction: 'Extraction kind',
  flag: 'Feature flag state',
  measurement: 'Measurement system',
};

function FamilyTable({ kind }: { readonly kind: StatusKind }) {
  const family = STATUS_REGISTRY[kind] as Record<string, StatusValue>;
  const rows = Object.entries(family);

  return (
    <div className="mb-6 last:mb-0">
      <p className="mb-2 text-sm font-extrabold text-ink">{FAMILY_TITLE[kind]}</p>
      <code className="mb-3 block font-mono text-xs text-ink-3">kind="{kind}"</code>
      <table className="w-full border-collapse text-sm">
        <tbody>
          <Repeat each={rows}>
            {([value, entry]: [string, StatusValue]) => (
              <tr key={value}>
                <td className="w-[160px] border-b border-line py-2 pr-3 align-top">
                  {/* Keys come back from Object.entries as plain strings, so this
                      loop takes the explicit opt-in even though every value is
                      in fact mapped. */}
                  <Status kind={kind} value={value} unmapped />
                </td>
                <td className="w-[150px] border-b border-line py-2 pr-3 align-top font-mono text-xs text-ink-3">
                  {value}
                </td>
                <td className="border-b border-line py-2 align-top text-sm text-ink-2">
                  {entry.when}
                </td>
              </tr>
            )}
          </Repeat>
        </tbody>
      </table>
    </div>
  );
}

export function StatusPart() {
  return (
    <Specimen
      title="The status contract"
      spec="126-status-contract.html … 143-status-measurement.html"
      description="How every lifecycle in this product is rendered — 17 families, 39 named states, one vocabulary."
    >
      <Rule>
        <b>Colour comes from the semantic enum. The word comes from the domain.</b> A recipe is{' '}
        <i>Published</i>, not <i>easy</i>. A user is <i>Suspended</i>, not <i>warn</i>. One entry
        per lifecycle family, every named state spelled out, so a mapping can never be invented at
        a call site again.
      </Rule>

      <Section label="THE FAILURE THIS REPLACES">
        <Demo>
          <p className="mb-4 max-w-[80ch] text-sm text-ink-2">
            The shipped app had <b>no status component at all</b> — 13 pill call-sites, 11 of them
            inline ternaries, mapping 39 named database states onto a 7-value trust and difficulty
            vocabulary. The result: <code>easy</code> meant <i>published</i>, <i>active</i>,{' '}
            <i>ok</i> and <i>reviewed</i> — four unrelated lifecycles wearing one word.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-ink pb-2 pr-3 text-left text-xs font-extrabold uppercase tracking-overline text-ink-3">
                  Old tone
                </th>
                <th className="border-b border-ink pb-2 text-left text-xs font-extrabold uppercase tracking-overline text-ink-3">
                  Meanings it carried
                </th>
              </tr>
            </thead>
            <tbody>
              <Repeat each={COLLISIONS}>
                {(row: Collision) => (
                  <tr key={row.tone}>
                    <td className="border-b border-line py-2 pr-3 font-mono text-xs font-bold text-critical-onsoft">
                      {row.tone}
                    </td>
                    <td className="border-b border-line py-2 text-sm text-ink-2">{row.meanings}</td>
                  </tr>
                )}
              </Repeat>
            </tbody>
          </table>
        </Demo>
      </Section>

      <Section label="THE FIVE TONES, PLUS PROVENANCE">
        <Demo>
          <Row>
            <Status kind="feedback-target" value="step" />
            <Status kind="feedback" value="open" />
            <Status kind="recipe" value="published" />
            <Status kind="recipe" value="draft" />
            <Status kind="user" value="suspended" />
          </Row>
          <Row label="Outside the enum — AI provenance is not a severity">
            <Status kind="recipe-source" value="seed" />
            <Status kind="recipe-source" value="ai" />
          </Row>
        </Demo>
        <Note>
          Grape sits outside the five tones so “made by a machine” can never be confused with
          “verified by a human”. It is not a severity and never a button.
        </Note>
      </Section>

      <Rule tone="warn">
        <b>Sky may never appear in a status.</b> Sky is the action colour; a blue badge invites a
        press. This is checkable: grep any status file for <code>sky</code>.
      </Rule>

      <Section label="EVERY FAMILY, EVERY NAMED STATE">
        <Demo>
          <Repeat each={[...STATUS_KINDS]}>
            {(kind: StatusKind) => <FamilyTable key={kind} kind={kind} />}
          </Repeat>
        </Demo>
      </Section>

      <Section label="STATES">
        <Demo>
          <StateGrid>
            <StateCard name="default" when="A mapped value.">
              <Status kind="recipe" value="published" />
            </StateCard>
            <StateCard name="with a dot" when="A dense list where the word is enough.">
              <Status kind="recipe" value="published" dot />
            </StateCard>
            <StateCard name="small" when="Inside a row.">
              <Status kind="recipe" value="published" size="sm" />
            </StateCard>
            <StateCard name="unmapped" when="No mapping — neutral plus the raw string, never a guessed colour. Requires the explicit opt-in.">
              <Status kind="recipe" value="archived_2019" unmapped />
            </StateCard>
            <StateCard name="skeleton" when="Loading, in the shape it will become.">
              <StatusSkeleton />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`<Status kind* value* size?="sm|md" dot? />

// \`kind\` selects the lifecycle FAMILY; \`value\` is that family's enum
// there is no \`tone\` prop — a call site may never choose the colour
// \`value\` is typed against the family, so a value from the WRONG
//   lifecycle is a COMPILE ERROR, not a silent neutral pill
// a genuinely unmapped value needs \`unmapped\` — it renders neutral
//   + the raw string, and the opt-in makes "not mapped yet" greppable`}</Api>
      </Section>
    </Specimen>
  );
}

export function BadgeTagPart() {
  return (
    <Specimen
      title="Badge · Tag"
      spec="146-badge.html · 147-tag.html"
      description="A count on a thing, and a label for what a thing is — both kept distinct from Status."
    >
      <Rule>
        <b>A tag labels what something IS; a status says where it is in its LIFE.</b> Cuisines,
        dietary marks and categories are tags. Published / draft is not.
      </Rule>

      <Section label="BADGE">
        <Demo>
          <Row>
            <Badge count={3} label="3 unread" />
            <Badge count={12} label="12 pending" />
            <Badge count={128} label="128 items" />
            <Badge count={0} label="none" />
            <Badge count={0} loading label="Counting" />
          </Row>
          <Note>
            The fourth is a count of 0 and renders <b>nothing at all</b> — never a “0”. The fifth
            is the loading dot.
          </Note>
        </Demo>

        <Demo>
          <StateGrid>
            <StateCard name="default" when="A count.">
              <Badge count={3} />
            </StateCard>
            <StateCard name="over max" when="99+, never a four-digit badge.">
              <Badge count={1240} />
            </StateCard>
            <StateCard name="empty" when="Zero — the badge is absent, never a “0”.">
              <div className="flex items-center gap-2 text-sm text-ink-3">
                <Badge count={0} />
                <span>(nothing renders)</span>
              </div>
            </StateCard>
            <StateCard name="loading" when="Count not yet known — the dot, not a number.">
              <Badge count={0} loading />
            </StateCard>
          </StateGrid>
        </Demo>
      </Section>

      <Section label="TAG">
        <Demo>
          <Row>
            <Tag>Nigerian</Tag>
            <Tag>West African</Tag>
            <Tag tone="info">Soup</Tag>
            <Tag tone="info">Under 30 min</Tag>
            <Tag onRemove={() => {}}>Vegetarian</Tag>
          </Row>
        </Demo>

        <Demo>
          <StateGrid>
            <StateCard name="default" when="Tags.">
              <div className="flex flex-wrap gap-2">
                <Tag>Nigerian</Tag>
                <Tag tone="info">Soup</Tag>
              </div>
            </StateCard>
            <StateCard name="removable" when="A filter the user applied.">
              <Tag onRemove={() => {}}>Vegetarian</Tag>
            </StateCard>
            <StateCard name="small" when="Inside a dense row.">
              <Tag size="sm">Nigerian</Tag>
            </StateCard>
            <StateCard name="skeleton" when="Loading.">
              <div className="flex gap-2">
                <TagSkeleton width={72} />
                <TagSkeleton width={54} />
              </div>
            </StateCard>
          </StateGrid>
        </Demo>
        <Note>
          Tags use <code>neutral</code> or <code>info</code> only —{' '}
          <code>success</code>/<code>caution</code>/<code>critical</code> belong to Status. A green
          tag would read as a lifecycle claim.
        </Note>
      </Section>

      <Section label="API">
        <Api>{`<Badge count* max?={99} loading? label? />
<Tag tone?="neutral|info" size?="sm|md" onRemove? />

// a count of 0 renders NOTHING — never a zero badge
// over \`max\` renders '99+', never a four-digit badge
// tags use neutral or info ONLY — the other three belong to Status`}</Api>
      </Section>
    </Specimen>
  );
}
