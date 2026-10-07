import { useState } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { formatDate } from '@shared/utils/format-date';
import { InfoCard, MetricTile } from '@ui/admin';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';
import { Tag } from '@ui/status';

import {
  useMatchRule,
  usePublishMatchRule,
  useRetireMatchRule,
  useSaveMatchRule,
} from '../hooks/use-matching';
import { narrowLayout, type RuleGraph } from '../matching/graph-model';
import { ReplayPanel } from '../matching/replay-panel';
import { RuleCanvas } from '../matching/rule-canvas';
import { RuleForm } from '../matching/rule-form';
import { ConsoleShell } from '../parts/console-shell';
import type { RuleThen, RuleWhen } from '../services/matching.api';

/**
 * One rule: its numbers, its overlaps, and the form to change it.
 *
 * The overlap list is the conflict detector, and it is the most important
 * thing on this page after the numbers. An invisible precedence order is how a
 * rules engine becomes unmaintainable — so "3 other rules also match this
 * configuration, this one wins on specificity" is stated outright.
 */
export default function AdminMatchingRuleScreen() {
  const navigate = useNavigate();
  const { ruleId } = useParams({ strict: false }) as { ruleId?: string };
  const id = ruleId ?? '';

  const { data: rule, isLoading, error } = useMatchRule(id);
  const save = useSaveMatchRule();
  const publish = usePublishMatchRule();
  const retire = useRetireMatchRule();

  const [editor, setEditor] = useState<'form' | 'canvas'>('form');
  /**
   * What the canvas handed back, before it is saved.
   *
   * Held here rather than written straight through, because the form owns
   * saving — one save path means the two editors cannot drift apart or
   * half-save a rule between them.
   */
  const [fromCanvas, setFromCanvas] = useState<{
    when: RuleWhen;
    then: RuleThen;
    layout: RuleGraph;
  } | null>(null);

  const back = (): void => {
    void navigate({ to: ROUTES.ADMIN_MATCHING });
  };

  const cookRate =
    rule !== undefined && rule.stats.served >= 10
      ? Math.round((rule.stats.cooked / rule.stats.served) * 100)
      : null;

  return (
    <ConsoleShell
      active="matching"
      title={rule?.name ?? 'Rule'}
      actions={
        <Button size="sm" variant="secondary" onClick={back}>
          Back
        </Button>
      }
    >
      <Show when={isLoading}>
        <p className="text-sm text-ink-3">Loading…</p>
      </Show>

      <Show when={error !== null && !isLoading}>
        <Callout
          tone="critical"
          title="Could not load this rule"
          body={error?.message ?? 'Something went wrong.'}
        />
      </Show>

      <Show when={rule !== undefined}>
        <Show when={rule?.status === 'pending'}>
          <div className="mb-4">
            <Callout
              tone="caution"
              title="A change to this rule is waiting for approval"
              body="The live version keeps serving until somebody approves it. Editing again is refused while a request is in flight."
            />
          </div>
        </Show>

        <Show when={rule?.shadow === true && rule?.status === 'live'}>
          <div className="mb-4">
            <Callout
              tone="info"
              title="This rule is in shadow mode"
              body="It records what it would have served and serves nothing. Turn shadow off and publish when the numbers justify it."
            />
          </div>
        </Show>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricTile label="Matched" value={rule?.stats.matched ?? 0} />
          <MetricTile label="Served" value={rule?.stats.served ?? 0} />
          <MetricTile label="Cooked" value={rule?.stats.cooked ?? 0} />
          <MetricTile
            label="Cook rate"
            value={cookRate === null ? 'too early' : `${String(cookRate)}%`}
          />
        </div>

        {/* The gap between matched and served is a rule being shadowed by a
            more specific one, which is worth saying rather than leaving as
            two numbers to subtract. */}
        <Show when={(rule?.stats.matched ?? 0) > (rule?.stats.served ?? 0) + 10}>
          <div className="mb-4">
            <Callout
              tone="info"
              title="This rule often matches without serving"
              body="Another rule is winning on specificity most of the time. The overlaps below say which."
            />
          </div>
        </Show>

        <Show when={cookRate !== null && (cookRate ?? 100) < 20}>
          <div className="mb-4">
            <Callout
              tone="caution"
              title="This rule serves a lot and is rarely cooked"
              body="A rule that fires often and is never cooked is worse than no rule. Worth reviewing whether it still earns its place."
            />
          </div>
        </Show>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-4">
            {/* Two editors, one document. The form is the reference: the
                canvas hands its version back into the form rather than saving
                separately, so there is exactly one save path and no way for
                the two to drift. */}
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant={editor === 'form' ? 'primary' : 'secondary'}
                onClick={() => {
                  setEditor('form');
                }}
              >
                Form
              </Button>
              <Button
                size="sm"
                variant={editor === 'canvas' ? 'primary' : 'secondary'}
                onClick={() => {
                  setEditor('canvas');
                }}
              >
                Canvas
              </Button>
            </div>

            <Show when={editor === 'canvas' && rule !== undefined}>
              <RuleCanvas
                when={fromCanvas?.when ?? rule?.when ?? {}}
                then={fromCanvas?.then ?? rule?.then ?? { meals: [], mode: 'replace' }}
                branches={rule?.branches ?? []}
                layout={narrowLayout(rule?.layout ?? null)}
                onApply={(next) => {
                  // Back to the form, which owns saving. The canvas never
                  // writes directly — that is what keeps the two in step.
                  setFromCanvas(next);
                  setEditor('form');
                }}
              />
            </Show>

            <Show when={editor === 'form'}>
            <RuleForm
              key={`${id}:${rule?.updatedAt ?? ''}:${fromCanvas === null ? 'own' : 'canvas'}`}
              initial={
                rule === undefined
                  ? undefined
                  : {
                      name: rule.name,
                      description: rule.description ?? '',
                      priority: rule.priority,
                      shadow: rule.shadow,
                      // Whatever the canvas handed back, when it did.
                      when: fromCanvas?.when ?? rule.when,
                      then: fromCanvas?.then ?? rule.then,
                      branches: rule.branches,
                    }
              }
              submitLabel={rule?.status === 'live' ? 'Submit change for approval' : 'Save draft'}
              pending={save.isPending}
              error={save.error}
              onSubmit={(payload) => {
                save.mutate({
                  ruleId: id,
                  // The canvas layout rides along so a curator's arrangement
                  // survives the save.
                  payload: {
                    ...payload,
                    ...(fromCanvas !== null && { layout: fromCanvas.layout }),
                  },
                });
              }}
              onCancel={back}
            />
            </Show>

            <Show when={fromCanvas !== null && editor === 'form'}>
              <Callout
                tone="info"
                title="These conditions came from the canvas"
                body="Nothing is saved yet. Check them over and save as you would any change."
              />
            </Show>
          </div>

          <div className="flex flex-col gap-4">
            <InfoCard title="Status">
              <div className="flex flex-col gap-2 text-sm">
                <Tag size="sm" tone={rule?.status === 'live' ? 'info' : 'neutral'}>
                  {rule?.status ?? ''}
                </Tag>
                <p className="text-xs text-ink-3">
                  Tests {rule?.specificity ?? 0} condition
                  {(rule?.specificity ?? 0) === 1 ? '' : 's'}. The rule testing more conditions
                  wins when several match.
                </p>
                <Show when={rule?.publishedAt !== null}>
                  <p className="text-xs text-ink-3">
                    Live since {formatDate(rule?.publishedAt ?? '')}
                  </p>
                </Show>
              </div>
            </InfoCard>

            {/* Measurement before publishing: what this rule would have done
                to traffic that has already happened. */}
            <Show when={rule !== undefined}>
              <ReplayPanel
                ruleId={id}
                hasWeatherClause={
                  rule?.when.weather !== undefined && rule?.when.weather !== null
                }
              />
            </Show>

            {/* The conflict detector. */}
            <InfoCard title="Overlapping rules">
              <Show
                when={(rule?.overlaps?.length ?? 0) > 0}
                fallback={
                  <p className="text-sm text-ink-3">
                    Nothing else matches the same configurations. This rule is unambiguous.
                  </p>
                }
              >
                <div className="flex flex-col gap-2">
                  {(rule?.overlaps ?? []).slice().map((overlap) => (
                    <button
                      key={overlap.id}
                      type="button"
                      className="flex items-center justify-between gap-2 rounded-blade-xs border border-line px-2 py-1.5 text-left text-sm hover:border-ink"
                      onClick={() => {
                        void navigate({ to: ROUTES.ADMIN_MATCHING_RULE(overlap.id) });
                      }}
                    >
                      <span className="min-w-0 truncate text-ink">{overlap.name}</span>
                      <span
                        className={`shrink-0 text-xs font-extrabold ${
                          overlap.winner ? 'text-ink-3' : 'text-sky-on'
                        }`}
                      >
                        {overlap.winner ? 'wins over this' : 'this one wins'}
                      </span>
                    </button>
                  ))}
                </div>
              </Show>
            </InfoCard>

            <Show when={rule?.status === 'draft'}>
              <InfoCard title="Put it live">
                <p className="mb-3 text-sm text-ink-2">
                  Publishing goes through approval. Somebody with the approval permission has to
                  agree before it serves anybody.
                </p>
                <Button
                  size="sm"
                  loading={publish.isPending}
                  onClick={() => {
                    publish.mutate(id, {
                      onSuccess: (workflow) => {
                        void navigate({ to: ROUTES.ADMIN_WORKFLOW(workflow.id) });
                      },
                    });
                  }}
                >
                  Submit for approval
                </Button>
                <Show when={publish.error !== null}>
                  <div className="mt-3">
                    <Callout
                      tone="critical"
                      title="Could not submit"
                      body={publish.error?.message ?? 'Something went wrong.'}
                    />
                  </div>
                </Show>
              </InfoCard>
            </Show>

            <Show when={rule?.status === 'live'}>
              <InfoCard title="Retire it">
                <p className="mb-3 text-sm text-ink-2">
                  Retiring is reviewed too. The rule stops serving and its history is kept, so
                  the verdicts it produced still make sense.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={retire.isPending}
                  onClick={() => {
                    retire.mutate(id, {
                      onSuccess: (workflow) => {
                        void navigate({ to: ROUTES.ADMIN_WORKFLOW(workflow.id) });
                      },
                    });
                  }}
                >
                  Submit retirement
                </Button>
              </InfoCard>
            </Show>
          </div>
        </div>
      </Show>
    </ConsoleShell>
  );
}
