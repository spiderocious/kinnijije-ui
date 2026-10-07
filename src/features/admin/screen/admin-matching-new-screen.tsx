import { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { Show } from 'meemaw';

import { ROUTES } from '@shared/constants/routes';
import { Callout } from '@ui/feedback';
import { Button } from '@ui/primitives';

import { useCreateMatchRule } from '../hooks/use-matching';
import type { RuleGraph } from '../matching/graph-model';
import { RuleCanvas } from '../matching/rule-canvas';
import { RuleForm } from '../matching/rule-form';
import { ConsoleShell } from '../parts/console-shell';
import type { RuleThen, RuleWhen } from '../services/matching.api';

/**
 * A new rule.
 *
 * Always saved as a DRAFT, whatever the form says: going live is a workflow,
 * never a side effect of pressing save. The curator then measures it in
 * shadow and asks for approval when the numbers justify it.
 */
export default function AdminMatchingNewScreen() {
  const navigate = useNavigate();
  const create = useCreateMatchRule();

  const [editor, setEditor] = useState<'form' | 'canvas'>('form');
  /**
   * What the canvas handed back, before it is saved.
   *
   * The form owns saving here exactly as it does on the rule page — one save
   * path means the two editors cannot drift apart or half-save a rule.
   */
  const [fromCanvas, setFromCanvas] = useState<{
    when: RuleWhen;
    then: RuleThen;
    layout: RuleGraph;
  } | null>(null);

  const back = (): void => {
    void navigate({ to: ROUTES.ADMIN_MATCHING });
  };

  return (
    <ConsoleShell
      active="matching"
      title="New rule"
      actions={
        <Button size="sm" variant="secondary" onClick={back}>
          Back
        </Button>
      }
    >
      {/* Both editors are available from the start: a branching rule is
          easier to draw than to describe, and making somebody save a draft
          first just to reach the canvas is a detour with no purpose. */}
      <div className="mb-4 flex gap-1.5">
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

      <Show when={editor === 'canvas'}>
        <RuleCanvas
          when={fromCanvas?.when ?? {}}
          then={fromCanvas?.then ?? { meals: [], mode: 'replace' }}
          branches={[]}
          layout={fromCanvas?.layout ?? null}
          onApply={(next) => {
            setFromCanvas(next);
            setEditor('form');
          }}
        />
      </Show>

      <Show when={editor === 'form'}>
        <Show when={fromCanvas !== null}>
          <div className="mb-4">
            <Callout
              tone="info"
              title="These conditions came from the canvas"
              body="Nothing is saved yet. Give the rule a name, check the conditions over, and save it as a draft."
            />
          </div>
        </Show>

        <RuleForm
          // Re-seeded when the canvas hands something back, or the form would
          // keep showing its own earlier state.
          key={fromCanvas === null ? 'own' : 'canvas'}
          initial={
            fromCanvas === null
              ? undefined
              : { when: fromCanvas.when, then: fromCanvas.then }
          }
          submitLabel="Save as draft"
          pending={create.isPending}
          error={create.error}
          onSubmit={(payload) => {
            create.mutate(
              {
                ...payload,
                // The layout rides along so a canvas arrangement survives the
                // first save and reopens as it was drawn.
                ...(fromCanvas !== null && { layout: fromCanvas.layout }),
              },
              {
                onSuccess: (rule) => {
                  void navigate({ to: ROUTES.ADMIN_MATCHING_RULE(rule.id) });
                },
              },
            );
          }}
          onCancel={back}
        />
      </Show>
    </ConsoleShell>
  );
}
