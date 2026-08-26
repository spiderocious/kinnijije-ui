import { useState, type ReactNode } from 'react';
import { Repeat, Show } from 'meemaw';

import { Blob, KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button, IconButton } from '@ui/primitives';
import { Field, Input, Switch, Textarea } from '@ui/inputs';
import { Callout, EmptyState } from '@ui/feedback';
import { CursorPager, DiffView, Figure, JsonInspector, Stat, Table, type TableColumn } from '@ui/display';
import { Status } from '@ui/status';
import { Sidebar, Tabs, type SidebarGroup } from '@ui/navigation';
import { Card, Panel, Row, SectionHeader, Avatar } from '@ui/structure';
import { DrawerService } from '@ui/drawer';
import { Provenance, isApproximate, type RecipeSource } from '@ui/domain';

import { SceneRoot } from '../parts/scene-frame';
import type { SceneFrame } from '../scenes.registry';

/**
 * The curator's console.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview-admin/a01-shell.html
 *                                                                … a09-flags.html
 *
 * Everything here runs at COUNTER density, resolved by the `.counter` wrapper
 * on the shell — no component takes a density prop.
 *
 * Each of these screens fixes a specific failure the shipped admin had, and the
 * fix is stated on the screen rather than left implicit.
 */

const CONSOLE_NAV: SidebarGroup[] = [
  {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'recipes', label: 'Recipes', icon: 'cookbook' },
      { id: 'users', label: 'Users', icon: 'contact' },
    ],
  },
  {
    label: 'The model',
    items: [
      { id: 'audit', label: 'AI audit', icon: 'robotForAi' },
      { id: 'prompts', label: 'Prompts', icon: 'editPencil' },
      { id: 'flags', label: 'Feature flags', icon: 'toggle' },
    ],
  },
  {
    label: 'From cooks',
    items: [{ id: 'feedback', label: 'Feedback', icon: 'reportFlag', count: 3 }],
  },
];

/** The console frame. One wrapper class resolves the whole register. */
export function ConsoleShell({
  active,
  title,
  actions,
  children,
}: {
  readonly active: string;
  readonly title: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="counter flex min-h-full bg-paper">
      <Sidebar
        value={active}
        onValueChange={() => {}}
        groups={CONSOLE_NAV}
        header={
          <span className="inline-flex items-center gap-2">
            <KoboyoIcon name="cookingPot" size={20} className="text-sky" />
            <span className="font-display text-md font-extrabold tracking-display">Kinnijije</span>
            <span className="font-mono text-xs text-ink-3">admin</span>
          </span>
        }
        footer={<Avatar name="ada@kinnijije.ng" size={26} label="Ada Obi" sublabel="Admin" />}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-6 py-3">
          <h1 className="min-w-0 truncate font-display text-lg font-extrabold tracking-display">
            {title}
          </h1>
          <Show when={actions !== undefined}>
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          </Show>
        </header>
        <div className="flex-1 px-6 py-5">{children}</div>
      </main>
    </div>
  );
}

/* ---------- a01 · The shell ---------- */

export function ConsoleShellScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <SceneRoot frame={frame}>
      <ConsoleShell active="dashboard" title="Dashboard" actions={<Button size="sm">New recipe</Button>}>
        <Callout
          tone="info"
          title="The COUNTER register"
          body="Same palette, same blade, same type as the cook's app — denser box, hairline structure, and the drop-edge reserved for the one control that acts."
        />
      </ConsoleShell>
    </SceneRoot>
  );
}

/* ---------- a02 · Dashboard ---------- */

export function ConsoleDashboardScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <SceneRoot frame={frame}>
      <ConsoleShell active="dashboard" title="Dashboard" actions={<Button size="sm">New recipe</Button>}>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Published" value={248} delta="+12 this week" deltaTone="success" weight="compact" />
          <Stat label="Drafts" value={12} delta="3 need review" weight="compact" />
          <Stat label="Users" value="1,204" delta="+3.2%" deltaTone="success" weight="compact" />
          <Stat label="Open feedback" value={3} weight="compact" />
          {/* The only figure here that is a real lever. */}
          <Stat
            label="AI spend, 30 days"
            value="41.80"
            unit="$"
            delta="1,204 calls"
            deltaTone="critical"
            weight="compact"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel>
            <Panel.Header title="Needs a look" />
            <Panel.List>
              <Row.Recipe name="Moi Moi" source="ai" minutes={90} serves={4} status="draft" onPress={() => {}} />
              <Row.Recipe name="Suya Skewers" source="ai" minutes={35} serves={6} status="draft" onPress={() => {}} />
            </Panel.List>
          </Panel>

          <Panel>
            <Panel.Header title="Recent AI calls" />
            <Panel.List>
              <li className="flex items-center justify-between gap-3 px-pad py-row-y">
                <span className="flex items-center gap-2">
                  <Status kind="ai-kind" value="generate" size="sm" />
                  <span className="text-ctrl text-ink-2">Wrote Moi Moi</span>
                </span>
                <Figure value="0.03" unit="$" size="sm" />
              </li>
              <li className="flex items-center justify-between gap-3 px-pad py-row-y">
                <span className="flex items-center gap-2">
                  <Status kind="ai-kind" value="vision" size="sm" />
                  <span className="text-ctrl text-ink-2">Read a shelf photo</span>
                </span>
                <Figure value="0.008" unit="$" size="sm" />
              </li>
              <li className="flex items-center justify-between gap-3 px-pad py-row-y">
                <span className="flex items-center gap-2">
                  <Status kind="ai-kind" value="parse" size="sm" />
                  <span className="text-ctrl text-ink-2">Parsed an ingredient list</span>
                </span>
                <Figure value="0.001" unit="$" size="sm" />
              </li>
            </Panel.List>
          </Panel>
        </div>
      </ConsoleShell>
    </SceneRoot>
  );
}

/* ---------- a03 · Recipes ---------- */

interface RecipeRecord {
  id: string;
  name: string;
  source: RecipeSource;
  minutes: number;
  status: 'published' | 'draft';
}

const RECIPES: RecipeRecord[] = [
  { id: '1', name: 'Jollof Rice, Party Style', source: 'seed', minutes: 45, status: 'published' },
  { id: '2', name: 'Egusi Soup & Pounded Yam', source: 'seed', minutes: 70, status: 'published' },
  { id: '3', name: 'Ewa Agoyin & Plantain', source: 'ai', minutes: 55, status: 'published' },
  { id: '4', name: 'Efo Riro', source: 'seed', minutes: 40, status: 'published' },
  { id: '5', name: 'Moi Moi', source: 'ai', minutes: 90, status: 'draft' },
  { id: '6', name: 'Suya Skewers', source: 'ai', minutes: 35, status: 'draft' },
];

const RECIPE_COLUMNS: TableColumn<RecipeRecord>[] = [
  { key: 'name', header: 'Recipe', sortable: true, render: (row) => row.name },
  { key: 'source', header: 'Source', width: '150px', render: (row) => <Provenance source={row.source} size="sm" /> },
  {
    key: 'minutes',
    header: 'Time',
    numeric: true,
    sortable: true,
    width: '90px',
    render: (row) => <Figure value={row.minutes} unit="m" approximate={isApproximate(row.source)} size="sm" />,
  },
  { key: 'status', header: 'Status', width: '120px', render: (row) => <Status kind="recipe" value={row.status} size="sm" /> },
];

export function ConsoleRecipesScene({ frame }: { readonly frame: SceneFrame }) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });

  return (
    <SceneRoot frame={frame}>
      <ConsoleShell
        active="recipes"
        title="Recipes"
        actions={
          <>
            <Button variant="secondary" size="sm" icon="filter">
              Filter
            </Button>
            <Button size="sm">New recipe</Button>
          </>
        }
      >
        <Card variant="quiet" padding="sm">
          <Table
            columns={RECIPE_COLUMNS}
            rows={RECIPES}
            rowKey={(row) => row.id}
            sort={sort}
            onSortChange={(key, direction) => setSort({ key, direction })}
            onRowClick={() => {}}
            caption="Recipes"
          />
          <CursorPager rangeLabel="1–6 of many" hasPrev={false} hasMore onPrev={() => {}} onNext={() => {}} />
        </Card>
      </ConsoleShell>
    </SceneRoot>
  );
}

/* ---------- a04 · Recipe editor ---------- */

export function ConsoleRecipeEditorScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <SceneRoot frame={frame}>
      <ConsoleShell
        active="recipes"
        title="Moi Moi"
        actions={
          <>
            <Status kind="recipe" value="draft" size="sm" />
            <Button variant="secondary" size="sm">
              Save draft
            </Button>
            <Button
              size="sm"
              onClick={() =>
                // Publishing is a platform-wide act — it pushes content to every
                // user. The shipped admin had no confirmation on it at all.
                DrawerService.confirm('Publish this recipe?', {
                  description:
                    'It becomes suggestable to all 1,204 cooks immediately. You can unpublish, but anyone who saved it keeps it.',
                  confirmLabel: 'Publish',
                  onConfirm: () => {},
                })
              }
            >
              Publish
            </Button>
          </>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-4">
            <Field label="Name">
              {({ id, describedBy }) => (
                <Input id={id} aria-describedby={describedBy} defaultValue="Moi Moi" />
              )}
            </Field>
            <Field label="Method" hint="One step per line">
              {({ id, describedBy }) => (
                <Textarea
                  id={id}
                  aria-describedby={describedBy}
                  defaultValue={'Soak the beans and peel them.\nBlend with pepper and onion.\nSteam in wraps for an hour.'}
                />
              )}
            </Field>
          </div>

          <aside className="flex flex-col gap-4">
            <Callout
              tone="ai"
              title="Written by a model"
              body="Quantities are estimates and the time is padded 30%. Check them before publishing."
            />
            <Panel>
              <Panel.Header title="Provenance" />
              <Panel.Body>
                <div className="flex flex-col gap-2">
                  <Provenance source="ai" size="sm" />
                  <Status kind="hero-image" value="placeholder" size="sm" />
                  <Status kind="approximate" value="approximate" size="sm" />
                </div>
              </Panel.Body>
            </Panel>
          </aside>
        </div>
      </ConsoleShell>
    </SceneRoot>
  );
}

/* ---------- a05 · AI audit ---------- */

interface AiCall {
  id: string;
  kind: 'vision' | 'whisper' | 'parse' | 'generate';
  result: 'ok' | 'error';
  latencyMs: number;
  cost: string;
  when: string;
}

const CALLS: AiCall[] = [
  { id: '1', kind: 'generate', result: 'ok', latencyMs: 4200, cost: '0.031', when: '12:04' },
  { id: '2', kind: 'vision', result: 'ok', latencyMs: 1800, cost: '0.008', when: '11:52' },
  { id: '3', kind: 'parse', result: 'error', latencyMs: 240, cost: '0.001', when: '11:51' },
  { id: '4', kind: 'whisper', result: 'ok', latencyMs: 900, cost: '0.004', when: '11:30' },
];

const CALL_COLUMNS: TableColumn<AiCall>[] = [
  { key: 'kind', header: 'Kind', width: '120px', render: (row) => <Status kind="ai-kind" value={row.kind} size="sm" /> },
  { key: 'result', header: 'Result', width: '110px', render: (row) => <Status kind="ai-result" value={row.result} size="sm" /> },
  { key: 'latency', header: 'Latency', numeric: true, sortable: true, width: '100px', render: (row) => <Figure value={row.latencyMs} unit="ms" size="sm" /> },
  { key: 'cost', header: 'Cost', numeric: true, sortable: true, width: '90px', render: (row) => <Figure value={row.cost} unit="$" size="sm" /> },
  { key: 'when', header: 'When', numeric: true, width: '80px', render: (row) => <span className="font-mono text-xs text-ink-3">{row.when}</span> },
];

export function ConsoleAuditScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <SceneRoot frame={frame}>
      <ConsoleShell active="audit" title="AI audit">
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Stat label="Calls, today" value={412} weight="compact" />
          <Stat label="Errors" value={6} weight="compact" deltaTone="critical" delta="1.4%" />
          <Stat label="Median latency" value="1,200" unit="ms" weight="compact" />
          <Stat label="Spend, today" value="1.42" unit="$" weight="compact" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <Card variant="quiet" padding="sm">
            <Table columns={CALL_COLUMNS} rows={CALLS} rowKey={(row) => row.id} onRowClick={() => {}} caption="AI calls" />
            <CursorPager rangeLabel="1–4 of many" hasPrev={false} hasMore onPrev={() => {}} onNext={() => {}} />
          </Card>

          {/* Both payloads — this is what makes the AI accountable rather than magic. */}
          <aside className="flex flex-col gap-4">
            <JsonInspector
              label="Went in"
              maxHeight={200}
              value={{
                model: 'gpt-4o',
                ingredients: ['beans', 'pepper', 'onion'],
                prefs: { cuisines: ['Nigerian'], difficultyFloor: 'medium' },
              }}
            />
            <JsonInspector
              label="Came out"
              maxHeight={200}
              value={{ name: 'Moi Moi', minutes: 90, approximate: true, steps: 3 }}
            />
          </aside>
        </div>
      </ConsoleShell>
    </SceneRoot>
  );
}

/* ---------- a06 · Prompt editor ---------- */

const PROMPT_V3 = `You are a Nigerian home cook.
Use only the ingredients given.
Keep steps under 10.
Return JSON.`;

const PROMPT_V4 = `You are a Nigerian home cook.
Use only the ingredients given.
Keep steps under 8.
Pad the cook time by 30%.
Return JSON.`;

export function ConsolePromptsScene({ frame }: { readonly frame: SceneFrame }) {
  const [tab, setTab] = useState('diff');

  return (
    <SceneRoot frame={frame}>
      <ConsoleShell
        active="prompts"
        title="Recipe-writing prompt"
        actions={
          <>
            <span className="font-mono text-xs text-ink-3">v3 live</span>
            <Button variant="secondary" size="sm">
              Save draft
            </Button>
            <Button
              size="sm"
              destructive
              onClick={() =>
                // Editing a prompt changes how every AI recipe is written, for
                // every user, immediately. The shipped admin let a curator save
                // a new version with no diff, no confirmation and no notice.
                DrawerService.critical('Make v4 live?', {
                  description:
                    'Every AI recipe written from now on uses this prompt. 1,204 cooks are affected immediately. Existing recipes are not rewritten.',
                  confirmPhrase: 'PUBLISH',
                  confirmLabel: 'Make it live',
                  onConfirm: () => {},
                })
              }
            >
              Make live
            </Button>
          </>
        }
      >
        {/* The guard the shipped admin never had. */}
        <Callout
          tone="critical"
          title="This changes every AI recipe, for every user, immediately"
          body="1,204 cooks. Read the diff before you make it live."
          className="mb-5"
        />

        <Tabs value={tab} onValueChange={setTab}>
          <Tabs.List label="Prompt views">
            <Tabs.Tab value="diff">What changed</Tabs.Tab>
            <Tabs.Tab value="edit">Edit</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="diff">
            <DiffView before={PROMPT_V3} after={PROMPT_V4} beforeLabel="v3 (live)" afterLabel="v4 (draft)" />
          </Tabs.Panel>

          <Tabs.Panel value="edit">
            <Field label="v4 draft">
              {({ id, describedBy }) => (
                <Textarea id={id} aria-describedby={describedBy} defaultValue={PROMPT_V4} className="min-h-[220px] font-mono" />
              )}
            </Field>
          </Tabs.Panel>
        </Tabs>
      </ConsoleShell>
    </SceneRoot>
  );
}

/* ---------- a07 · Users ---------- */

export function ConsoleUsersScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <SceneRoot frame={frame}>
      <ConsoleShell active="users" title="Users" actions={<Button variant="secondary" size="sm" icon="filter">Filter</Button>}>
        <Card variant="quiet" padding="none">
          <Panel.List>
            <Row.Person
              name="Ada Obi"
              email="ada@kinnijije.ng"
              role="admin"
              status="active"
              avatar={<Blob name="ada@kinnijije.ng" size={28} />}
              onPress={() => {}}
            />
            <Row.Person
              name="Tunde Bello"
              email="tunde@kinnijije.ng"
              role="user"
              status="active"
              avatar={<Blob name="tunde@kinnijije.ng" size={28} />}
              onPress={() => {}}
            />
            <Row.Person
              name="Chidinma Eze"
              email="chidinma@kinnijije.ng"
              role="user"
              status="suspended"
              avatar={<Blob name="chidinma@kinnijije.ng" size={28} />}
              trailing={
                <IconButton
                  icon="lockShownOpenClosed"
                  label="Suspend Chidinma Eze"
                  size="sm"
                  variant="tertiary"
                  destructive
                  onClick={() =>
                    // A consequential act on a person — hence a typed
                    // confirmation, where the shipped admin used a plain confirm.
                    DrawerService.critical('Suspend Chidinma Eze?', {
                      description:
                        'They will not be able to sign in. Their saved recipes are kept, and you can reverse this.',
                      confirmPhrase: 'SUSPEND',
                      onConfirm: () => {},
                    })
                  }
                />
              }
              onPress={() => {}}
            />
          </Panel.List>
          <CursorPager rangeLabel="1–3 of many" hasPrev={false} hasMore onPrev={() => {}} onNext={() => {}} className="px-3" />
        </Card>
      </ConsoleShell>
    </SceneRoot>
  );
}

/* ---------- a08 · Feedback queue ---------- */

export function ConsoleFeedbackScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <SceneRoot frame={frame}>
      <ConsoleShell active="feedback" title="Feedback">
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <Panel>
            <Panel.Header title="Open" action={<span className="font-mono text-xs text-ink-3">3</span>} />
            <Panel.List>
              <Row.Step index={1} instruction="Jollof Rice · step 3" done={false} />
              <Row.Step index={2} instruction="Efo Riro · palm oil quantity" done={false} />
              <Row.Step index={3} instruction="Moi Moi · step 2" done={false} />
            </Panel.List>
          </Panel>

          {/* The flag beside the step it is about — a correction with no context
              is unactionable, and the shipped queue showed only the note. */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Status kind="feedback" value="open" size="sm" />
              <Status kind="feedback-target" value="step" size="sm" />
              <span className="font-mono text-xs text-ink-3">Jollof Rice, Party Style · 2 days ago</span>
            </div>

            <Card variant="quiet">
              <SectionHeader title="What the cook said" level="group" className="mb-2" />
              <p className="text-ctrl text-ink">
                “Twelve minutes was not nearly enough for the oil to float. Took me closer to
                twenty on a gas ring.”
              </p>
            </Card>

            <Card variant="quiet">
              <SectionHeader title="The step they flagged" level="group" className="mb-2" />
              <Panel.List>
                <Row.Step
                  index={3}
                  instruction="Fry until the oil floats to the top. This is the step people rush."
                  minutes={12}
                />
              </Panel.List>
            </Card>

            <div className="flex flex-wrap gap-2">
              <Button size="sm">Fix the step</Button>
              <Button variant="secondary" size="sm">
                Mark reviewed
              </Button>
            </div>
          </div>
        </div>
      </ConsoleShell>
    </SceneRoot>
  );
}

/* ---------- a09 · Feature flags ---------- */

const FLAGS = [
  {
    id: 'input.photo',
    label: 'Photo capture',
    on: true,
    consequence: 'Cooks can photograph a shelf. Off, they type or use voice.',
  },
  {
    id: 'input.voice',
    label: 'Voice capture',
    on: true,
    consequence: 'Cooks can say what they have. Off, they type or use photo.',
  },
  {
    id: 'ai.generation',
    label: 'AI recipe writing',
    on: true,
    consequence: 'When nothing tested matches, a model writes one. Off, the cook sees only tested recipes.',
  },
  {
    id: 'signups',
    label: 'Signups',
    on: true,
    consequence: 'Off, nobody new can join. Existing cooks are unaffected.',
    grave: true,
  },
];

export function ConsoleFlagsScene({ frame }: { readonly frame: SceneFrame }) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(FLAGS.map((flag) => [flag.id, flag.on])),
  );

  return (
    <SceneRoot frame={frame}>
      <ConsoleShell active="flags" title="Feature flags">
        <div className="flex max-w-[720px] flex-col gap-4">
          <Repeat each={FLAGS}>
            {(flag: (typeof FLAGS)[number]) => {
              const on = state[flag.id] ?? false;
              return (
                <Card key={flag.id} variant="quiet">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-md font-extrabold tracking-display">
                          {flag.label}
                        </p>
                        {/* The state is SHOWN, not implied by a toggle position —
                            the shipped admin rendered no state badge at all. */}
                        <Status kind="flag" value={on ? 'on' : 'off'} size="sm" />
                      </div>
                      <code className="mt-1 block font-mono text-xs text-ink-3">{flag.id}</code>
                      {/* The blast radius, stated beside the switch. */}
                      <p
                        className={cn(
                          'mt-2 text-sm',
                          flag.grave === true ? 'font-extrabold text-critical-onsoft' : 'text-ink-2',
                        )}
                      >
                        {flag.consequence}
                      </p>
                    </div>

                    <Switch
                      checked={on}
                      label={flag.label}
                      hideLabel
                      onCheckedChange={(next) => {
                        if (!next && flag.grave === true) {
                          DrawerService.critical('Turn signups off?', {
                            description: 'Nobody new can join until it is turned back on.',
                            confirmPhrase: 'SIGNUPS',
                            onConfirm: () => setState((c) => ({ ...c, [flag.id]: false })),
                          });
                          return;
                        }
                        setState((c) => ({ ...c, [flag.id]: next }));
                      }}
                    />
                  </div>
                </Card>
              );
            }}
          </Repeat>
        </div>
      </ConsoleShell>
    </SceneRoot>
  );
}

/* ---------- Empty feedback queue ---------- */

export function ConsoleFeedbackEmptyScene({ frame }: { readonly frame: SceneFrame }) {
  return (
    <SceneRoot frame={frame}>
      <ConsoleShell active="feedback" title="Feedback">
        <div className="max-w-[520px]">
          <EmptyState kind="good" title="You are all caught up" body="No corrections waiting. Nice." />
        </div>
      </ConsoleShell>
    </SceneRoot>
  );
}
