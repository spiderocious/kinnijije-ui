import { Repeat, Show } from 'meemaw';

import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';

import type { ToolResult } from '../services/chat.api';

/** Plain English for a tool name, so nobody reads `addToStock` in the UI. */
const TOOL_LABELS: Record<string, string> = {
  addToStock: 'Added to your kitchen',
  removeFromStock: 'Removed from your kitchen',
  addToMarket: 'Added to your market list',
  removeFromMarket: 'Removed from your market list',
  readStock: 'Checked your kitchen',
  readMarket: 'Checked your market list',
  suggestMeals: 'Looked for meals',
};

const TONE = {
  success: {
    box: 'border-success-border bg-success-soft',
    text: 'text-success-onsoft',
    icon: 'tick',
  },
  pending: {
    box: 'border-info-border bg-info-soft',
    text: 'text-info-onsoft',
    icon: 'cycle',
  },
  failed: {
    box: 'border-critical-border bg-critical-soft',
    text: 'text-critical-onsoft',
    icon: 'error',
  },
} as const;

/**
 * Receipts: what the assistant actually DID, not what it said it would do.
 *
 * By the time a reply reaches this screen the tools have already run, so there
 * is nothing to confirm — only an honest account to show. A failure names its
 * reason, because silence is how somebody comes to believe their kitchen
 * changed when it did not.
 */
export function ToolReceipts({ results }: { readonly results: readonly ToolResult[] }) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      <Repeat each={[...results]}>
        {(result: ToolResult, index: number) => {
          const tone = TONE[result.result];
          const label = TOOL_LABELS[result.tool] ?? result.tool;

          return (
            <div
              key={`${result.tool}-${String(index)}`}
              className={cn('flex items-start gap-2 rounded-blade-sm border px-3 py-2', tone.box)}
            >
              <KoboyoIcon name={tone.icon} size={14} className={cn('mt-0.5 shrink-0', tone.text)} alone />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-ink">
                  {result.result === 'failed' ? `Did not happen — ${label.toLowerCase()}` : label}
                </p>

                <Show when={result.error !== undefined}>
                  <p className={cn('text-[11px]', tone.text)}>{result.error}</p>
                </Show>

                {/* A batch that half-worked must say which half. */}
                <Show when={(result.partial?.length ?? 0) > 0}>
                  <p className="text-[11px] text-ink-3">
                    Skipped:{' '}
                    {(result.partial ?? [])
                      .map((entry) => `${entry.name} (${entry.reason})`)
                      .join(', ')}
                  </p>
                </Show>
              </div>
            </div>
          );
        }}
      </Repeat>
    </div>
  );
}
