import { useMemo, useRef, useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Textarea, type FieldTriad } from '@ui/inputs';
import { Tabs } from '@ui/navigation';

/**
 * The console's text editors.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview-admin/a04-recipe-editor.html
 *                                                                a06-prompts.html
 *              (Inputs — markdown editor, JSON editor, reason/rejection input)
 */

/* ---------- Markdown ---------- */

interface ToolbarAction {
  readonly id: string;
  readonly label: string;
  readonly icon: KoboyoIconName;
  readonly wrap: readonly [string, string];
}

const MARKDOWN_ACTIONS: ToolbarAction[] = [
  { id: 'bold', label: 'Bold', icon: 'editPencil', wrap: ['**', '**'] },
  { id: 'italic', label: 'Italic', icon: 'quote', wrap: ['_', '_'] },
  { id: 'heading', label: 'Heading', icon: 'listViewIcon', wrap: ['## ', ''] },
  { id: 'list', label: 'List', icon: 'checklistPaper', wrap: ['- ', ''] },
  { id: 'link', label: 'Link', icon: 'linkChain', wrap: ['[', '](url)'] },
];

export interface MarkdownEditorProps extends FieldTriad {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label: string;
  readonly placeholder?: string;
  readonly className?: string;
}

/**
 * A markdown field with a working toolbar and a preview.
 *
 * **The toolbar wraps the selection rather than appending** — a formatting
 * button that ignores what is selected is a button people press once.
 */
export function MarkdownEditor({
  value,
  onChange,
  label,
  placeholder,
  disabled,
  readOnly,
  invalid,
  className,
}: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState('write');

  function apply(action: ToolbarAction) {
    const node = ref.current;
    if (node === null) return;

    const { selectionStart: start, selectionEnd: end } = node;
    const selected = value.slice(start, end);
    const [before, after] = action.wrap;

    // Wraps the selection — the whole point of a toolbar.
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);

    // Put the caret back where the writer expects it.
    requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  const preview = useMemo(
    () =>
      value
        .split('\n')
        .map((line) => {
          if (line.startsWith('## ')) return { kind: 'h' as const, text: line.slice(3) };
          if (line.startsWith('- ')) return { kind: 'li' as const, text: line.slice(2) };
          return { kind: 'p' as const, text: line };
        })
        .filter((line) => line.text !== ''),
    [value],
  );

  return (
    <div className={className}>
      <Tabs value={tab} onValueChange={setTab}>
        <Tabs.List label={label}>
          <Tabs.Tab value="write">Write</Tabs.Tab>
          <Tabs.Tab value="preview">Preview</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="write">
          <div className="mb-2 flex flex-wrap gap-1">
            <Repeat each={MARKDOWN_ACTIONS}>
              {(action: ToolbarAction) => (
                <button
                  key={action.id}
                  type="button"
                  aria-label={action.label}
                  title={action.label}
                  disabled={disabled === true || readOnly === true}
                  onClick={() => apply(action)}
                  className="grid h-ctrl-sm w-ctrl-sm place-items-center rounded-blade-xs border border-line-2 bg-white text-ink-3 transition-colors hover:border-ink hover:text-ink disabled:opacity-[0.42]"
                >
                  <KoboyoIcon name={action.icon} size={14} />
                </button>
              )}
            </Repeat>
          </div>

          <Textarea
            ref={ref}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label={label}
            disabled={disabled}
            readOnly={readOnly}
            invalid={invalid}
            className="min-h-[200px] font-mono"
          />
        </Tabs.Panel>

        <Tabs.Panel value="preview">
          <div className="min-h-[200px] rounded-blade border border-line-2 bg-white p-4">
            <Show when={preview.length === 0}>
              <p className="text-sm text-ink-4">Nothing written yet.</p>
            </Show>
            <Repeat each={preview}>
              {(line: { kind: 'h' | 'li' | 'p'; text: string }, index: number) =>
                line.kind === 'h' ? (
                  <p key={index} className="mb-2 font-display text-md font-extrabold tracking-display">
                    {line.text}
                  </p>
                ) : line.kind === 'li' ? (
                  <p key={index} className="mb-1 pl-4 text-ctrl text-ink-2">
                    · {line.text}
                  </p>
                ) : (
                  <p key={index} className="mb-2 text-ctrl text-ink-2">
                    {line.text}
                  </p>
                )
              }
            </Repeat>
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

/* ---------- JSON ---------- */

export interface JsonEditorProps extends FieldTriad {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label: string;
  readonly className?: string;
}

/**
 * A JSON field that validates as you type.
 *
 * **It reports the parse error but never blocks typing.** Refusing input on
 * malformed JSON makes it impossible to edit the middle of a document, since
 * every intermediate state is invalid.
 */
export function JsonEditor({
  value,
  onChange,
  label,
  disabled,
  readOnly,
  className,
}: JsonEditorProps) {
  const error = useMemo(() => {
    if (value.trim() === '') return null;
    try {
      JSON.parse(value);
      return null;
    } catch (parseError) {
      return parseError instanceof Error ? parseError.message : 'Not valid JSON';
    }
  }, [value]);

  function format() {
    try {
      onChange(JSON.stringify(JSON.parse(value), null, 2));
    } catch {
      // Malformed — leave it exactly as typed rather than mangling it.
    }
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
          {label}
        </span>
        <button
          type="button"
          onClick={format}
          disabled={error !== null || disabled === true || readOnly === true}
          className="text-xs font-extrabold text-sky-on underline decoration-2 underline-offset-2 disabled:opacity-[0.42] disabled:no-underline"
        >
          Format
        </button>
      </div>

      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        disabled={disabled}
        readOnly={readOnly}
        // Marked invalid, but never blocked — every mid-edit state is invalid.
        invalid={error !== null}
        className="min-h-[220px] font-mono text-xs"
      />

      <Show when={error !== null}>
        <p className="mt-2 flex items-start gap-2 text-xs font-extrabold text-critical-onsoft">
          <KoboyoIcon name="error" size={13} className="mt-[1px] shrink-0" />
          {error}
        </p>
      </Show>
    </div>
  );
}

/* ---------- Reason / rejection ---------- */

export interface ReasonInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Common reasons, one tap. */
  readonly presets?: readonly string[];
  readonly label?: string;
  /** A reason is required before the action commits. */
  readonly required?: boolean;
  readonly className?: string;
}

/**
 * Why a curator rejected something.
 *
 * **The reason goes back to the cook**, so the presets are written in the
 * second person and the field is required — a rejection with no explanation is
 * the fastest way to lose a contributor.
 */
export function ReasonInput({
  value,
  onChange,
  presets = [],
  label = 'Why?',
  required = true,
  className,
}: ReasonInputProps) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-extrabold text-ink-2">
        {label}
        {!required && <span className="ml-1 font-semibold text-ink-4">Optional</span>}
      </label>

      <Show when={presets.length > 0}>
        <ul className="mb-2 flex flex-wrap gap-2">
          <Repeat each={[...presets]}>
            {(preset: string) => (
              <li key={preset}>
                <button
                  type="button"
                  onClick={() => onChange(preset)}
                  className={cn(
                    'rounded-pill border px-3 py-[5px] text-xs font-extrabold transition-colors',
                    value === preset
                      ? 'border-ink bg-ink text-ink-inv'
                      : 'border-line-2 bg-white text-ink-2 hover:border-ink hover:text-ink',
                  )}
                >
                  {preset}
                </button>
              </li>
            )}
          </Repeat>
        </ul>
      </Show>

      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="The cook will see this."
        aria-label={label}
        invalid={required && value.trim() === ''}
      />

      <p className="mt-1 text-xs text-ink-3">This goes back to whoever submitted it.</p>
    </div>
  );
}

// `CodeSurfaceSkeleton` lives with the JSON inspector and diff view it serves.
export { CodeSurfaceSkeleton } from '@ui/display';
