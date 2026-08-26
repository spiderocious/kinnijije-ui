import { useMemo, useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { Copy, Check } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The payload viewer for the AI audit — went in / came out.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/103-json-inspector.html
 *
 * **It scrolls INSIDE its own box and never widens its parent.** A large model
 * payload is the single most reliable way to blow out a console layout, so the
 * horizontal overflow is contained here rather than left to a page-level fix.
 *
 * An unparseable payload shows RAW rather than nothing — the whole point of an
 * audit trail is that you can see what actually happened, including when what
 * happened was malformed.
 */

export interface JsonInspectorProps {
  /** A parsed value, or a raw string that may not be valid JSON. */
  readonly value: unknown;
  readonly label: string;
  /** Rows before the box scrolls. */
  readonly maxHeight?: number;
  readonly className?: string;
}

function syntaxColour(line: string): string {
  if (/^\s*[{}[\]],?$/.test(line)) return 'text-[#7E96A5]';
  return '';
}

export function JsonInspector({
  value,
  label,
  maxHeight = 320,
  className,
}: JsonInspectorProps) {
  const [copied, setCopied] = useState(false);

  const { text, parseFailed } = useMemo(() => {
    if (typeof value === 'string') {
      try {
        return { text: JSON.stringify(JSON.parse(value), null, 2), parseFailed: false };
      } catch {
        // Show it raw — an audit trail must not hide a malformed payload.
        return { text: value, parseFailed: true };
      }
    }
    try {
      return { text: JSON.stringify(value, null, 2), parseFailed: false };
    } catch {
      return { text: String(value), parseFailed: true };
    }
  }, [value]);

  const lines = text.split('\n');
  const empty = text === '' || text === 'null' || text === 'undefined';

  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">{label}</p>
        <Show when={!empty}>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              });
            }}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-ink-3 transition-colors hover:text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
          >
            {copied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </Show>
      </div>

      <Show when={parseFailed}>
        <p className="mb-2 rounded-blade-xs border border-caution-border bg-caution-soft px-3 py-2 text-xs font-extrabold text-caution-onsoft">
          The payload is not valid JSON. Showing it raw.
        </p>
      </Show>

      <Show when={empty}>
        <p className="rounded-blade-xs border border-dashed border-line-2 bg-paper-2 px-4 py-6 text-center text-sm text-ink-3">
          No payload recorded for this call
        </p>
      </Show>

      <Show when={!empty}>
        {/* Scrolls inside its own box; never widens the parent. */}
        <pre
          className="overflow-auto rounded-blade-sm bg-ink px-4 py-3 font-mono text-xs leading-relaxed text-[#DCE8EF]"
          style={{ maxHeight }}
        >
          <Repeat each={lines}>
            {(line: string, index: number) => (
              <div key={index} className={cn('whitespace-pre', syntaxColour(line))}>
                {line}
              </div>
            )}
          </Repeat>
        </pre>
      </Show>
    </div>
  );
}

export interface DiffViewProps {
  readonly before: string;
  readonly after: string;
  readonly beforeLabel?: string;
  readonly afterLabel?: string;
  readonly className?: string;
}

/**
 * A line-level diff, for prompt versions and recipe edits.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/104-diff-view.html
 *
 * Deliberately line-level rather than word-level: a curator comparing two
 * prompt versions needs to see WHICH INSTRUCTION changed, and a word-level diff
 * scatters that across a paragraph.
 */
export function DiffView({
  before,
  after,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className,
}: DiffViewProps) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const beforeSet = new Set(beforeLines);
  const afterSet = new Set(afterLines);

  return (
    <div className={cn('grid gap-3 md:grid-cols-2', className)}>
      <div className="min-w-0">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
          {beforeLabel}
        </p>
        <pre className="overflow-auto rounded-blade-sm border border-line-2 bg-white px-3 py-2 font-mono text-xs leading-relaxed">
          <Repeat each={beforeLines}>
            {(line: string, index: number) => (
              <div
                key={index}
                className={cn(
                  'whitespace-pre-wrap px-1',
                  !afterSet.has(line) && line.trim() !== '' && 'bg-critical-soft text-critical-onsoft',
                )}
              >
                {line || ' '}
              </div>
            )}
          </Repeat>
        </pre>
      </div>

      <div className="min-w-0">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-overline text-ink-3">
          {afterLabel}
        </p>
        <pre className="overflow-auto rounded-blade-sm border border-line-2 bg-white px-3 py-2 font-mono text-xs leading-relaxed">
          <Repeat each={afterLines}>
            {(line: string, index: number) => (
              <div
                key={index}
                className={cn(
                  'whitespace-pre-wrap px-1',
                  !beforeSet.has(line) && line.trim() !== '' && 'bg-success-soft text-success-onsoft',
                )}
              >
                {line || ' '}
              </div>
            )}
          </Repeat>
        </pre>
      </div>
    </div>
  );
}
