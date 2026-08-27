import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button, IconButton } from '@ui/primitives';
import { Input } from '../input/input';
import { Textarea } from '../textarea/textarea';
import { NumberInput } from '../number-input/number-input';

/**
 * The curator's row editors.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/70-ingredient-editor.html
 *                                                          71-step-editor.html
 *
 * Two rules that are easy to get wrong and expensive when wrong:
 *
 * 1. **`approximate` per row is an honesty control, not a nicety.** It drives
 *    the `≈` a cook sees. A curator marking one quantity as estimated is making
 *    a claim on the product's behalf.
 * 2. **The step index is DERIVED from order**, never a typed field — a typed
 *    index desyncs the moment anything is reordered.
 */

/* ---------- Ingredients ---------- */

export interface IngredientRow {
  readonly id: string;
  readonly name: string;
  readonly quantity: number | null;
  readonly unit: string;
  /** Drives the cook-side `≈`. An honesty control. */
  readonly approximate: boolean;
}

export interface IngredientEditorProps {
  readonly rows: readonly IngredientRow[];
  readonly onChange: (id: string, patch: Partial<IngredientRow>) => void;
  readonly onAdd: () => void;
  readonly onRemove: (id: string) => void;
  readonly className?: string;
}

export function IngredientEditor({
  rows,
  onChange,
  onAdd,
  onRemove,
  className,
}: IngredientEditorProps) {
  return (
    <div className={className}>
      <Show when={rows.length > 0}>
        <ul className="mb-3 flex flex-col gap-2">
          <Repeat each={[...rows]}>
            {(row: IngredientRow) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-2 rounded-blade-sm border border-line-2 bg-white p-2"
              >
                <Input
                  size="sm"
                  value={row.name}
                  aria-label="Ingredient"
                  placeholder="Ingredient"
                  onChange={(event) => onChange(row.id, { name: event.target.value })}
                  className="min-w-[140px] flex-1"
                />
                <NumberInput
                  size="sm"
                  value={row.quantity}
                  aria-label="Quantity"
                  onChange={(quantity) => onChange(row.id, { quantity })}
                  className="w-[92px]"
                />
                <Input
                  size="sm"
                  value={row.unit}
                  aria-label="Unit"
                  placeholder="unit"
                  onChange={(event) => onChange(row.id, { unit: event.target.value })}
                  className="w-[96px]"
                />

                {/* The honesty control. */}
                <button
                  type="button"
                  aria-pressed={row.approximate}
                  title="Mark this quantity as an estimate"
                  onClick={() => onChange(row.id, { approximate: !row.approximate })}
                  className={cn(
                    'grid h-ctrl-sm w-ctrl-sm shrink-0 place-items-center rounded-blade-xs border font-mono text-md font-bold',
                    'transition-colors duration-fast',
                    'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
                    row.approximate
                      ? 'border-caution bg-caution-soft text-caution-onsoft'
                      : 'border-line-2 bg-white text-ink-4 hover:border-ink hover:text-ink',
                  )}
                >
                  ≈
                </button>

                <IconButton
                  icon="trash"
                  label={`Remove ${row.name === '' ? 'this row' : row.name}`}
                  size="sm"
                  variant="tertiary"
                  destructive
                  onClick={() => onRemove(row.id)}
                />
              </li>
            )}
          </Repeat>
        </ul>
      </Show>

      {/* Removing the last row is allowed; the empty state offers the way back. */}
      <Show when={rows.length === 0}>
        <p className="mb-3 rounded-blade-sm border border-dashed border-line-2 bg-paper-2 px-4 py-5 text-center text-sm text-ink-3">
          No ingredients yet.
        </p>
      </Show>

      <Button variant="secondary" size="sm" icon="plus" onClick={onAdd}>
        Add an ingredient
      </Button>
    </div>
  );
}

/* ---------- Steps ---------- */

export interface StepRow {
  readonly id: string;
  readonly instruction: string;
  /** Minutes, when this step has a timer. */
  readonly minutes: number | null;
}

export interface StepEditorProps {
  readonly steps: readonly StepRow[];
  readonly onChange: (id: string, patch: Partial<StepRow>) => void;
  readonly onAdd: () => void;
  readonly onRemove: (id: string) => void;
  readonly onReorder?: (id: string, direction: -1 | 1) => void;
  readonly className?: string;
}

export function StepEditor({
  steps,
  onChange,
  onAdd,
  onRemove,
  onReorder,
  className,
}: StepEditorProps) {
  return (
    <div className={className}>
      <Show when={steps.length > 0}>
        <ol className="mb-3 flex flex-col gap-2">
          <Repeat each={[...steps]}>
            {(step: StepRow, index: number) => (
              <li
                key={step.id}
                className="flex items-start gap-2 rounded-blade-sm border border-line-2 bg-white p-2"
              >
                {/* Derived from order — never a typed field. */}
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-blade-xs border border-ink font-mono text-sm font-bold tnum">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <Textarea
                    value={step.instruction}
                    aria-label={`Step ${index + 1}`}
                    placeholder="What to do"
                    onChange={(event) => onChange(step.id, { instruction: event.target.value })}
                    className="min-h-[64px]"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <KoboyoIcon name="kitchenTimer" size={14} className="text-ink-3" />
                    <NumberInput
                      size="sm"
                      value={step.minutes}
                      unit="min"
                      aria-label={`Timer for step ${index + 1}`}
                      onChange={(minutes) => onChange(step.id, { minutes })}
                      className="w-[120px]"
                    />
                    <span className="text-xs text-ink-3">optional</span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <Show when={onReorder !== undefined}>
                    <IconButton
                      icon="arrowRight"
                      label={`Move step ${index + 1} up`}
                      size="sm"
                      variant="tertiary"
                      disabled={index === 0}
                      onClick={() => onReorder?.(step.id, -1)}
                      className="[&>svg]:-rotate-90"
                    />
                    <IconButton
                      icon="arrowRight"
                      label={`Move step ${index + 1} down`}
                      size="sm"
                      variant="tertiary"
                      disabled={index === steps.length - 1}
                      onClick={() => onReorder?.(step.id, 1)}
                      className="[&>svg]:rotate-90"
                    />
                  </Show>
                  <IconButton
                    icon="trash"
                    label={`Remove step ${index + 1}`}
                    size="sm"
                    variant="tertiary"
                    destructive
                    onClick={() => onRemove(step.id)}
                  />
                </div>
              </li>
            )}
          </Repeat>
        </ol>
      </Show>

      <Show when={steps.length === 0}>
        <p className="mb-3 rounded-blade-sm border border-dashed border-line-2 bg-paper-2 px-4 py-5 text-center text-sm text-ink-3">
          No method written yet.
        </p>
      </Show>

      <Button variant="secondary" size="sm" icon="plus" onClick={onAdd}>
        Add a step
      </Button>
    </div>
  );
}
