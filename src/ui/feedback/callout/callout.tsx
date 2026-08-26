import type { ReactNode } from 'react';

import { KoboyoIcon, Loader2, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The inline notice — ambient, persistent, non-blocking.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/148-callout.html
 *
 * Sits in the content and STAYS. Used for context a user should read but need
 * not act on. The shipped app never reached for this — eleven files hand-wrote
 * `<p role="alert">` instead, which announces to a screen reader that something
 * urgent happened every time a page renders.
 *
 * **A callout does not dismiss.** If it should vanish, it is a Toast. If it
 * should sit above the whole screen, it is a Banner.
 *
 * `tone` is the ONLY colour input — there is no `background` prop.
 */

const toneMap = {
  neutral: 'bg-neutral-soft text-neutral-onsoft border-neutral-border',
  info: 'bg-info-soft text-info-onsoft border-info-border',
  success: 'bg-success-soft text-success-onsoft border-success-border',
  caution: 'bg-caution-soft text-caution-onsoft border-caution-border',
  critical: 'bg-critical-soft text-critical-onsoft border-critical-border',
  /** AI provenance, not a severity. */
  ai: 'bg-grape-soft text-grape-onsoft border-grape-border',
} as const;

const toneIcon: Record<CalloutTone, KoboyoIconName> = {
  neutral: 'info',
  info: 'info',
  success: 'tick',
  caution: 'solidWarning',
  critical: 'error',
  ai: 'robotForAi',
};

export type CalloutTone = keyof typeof toneMap;

export interface CalloutProps {
  readonly tone: CalloutTone;
  readonly title: string;
  readonly body?: ReactNode;
  /** At most one control, and never a dismiss. */
  readonly action?: ReactNode;
  /** Waiting on something. */
  readonly loading?: boolean;
  readonly className?: string;
}

export function Callout({ tone, title, body, action, loading = false, className }: CalloutProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-blade border px-4 py-3',
        toneMap[tone],
        className,
      )}
    >
      {loading ? (
        <Loader2 size={17} className="mt-[2px] shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <KoboyoIcon name={toneIcon[tone]} size={17} className="mt-[2px] shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">{title}</p>
        {body !== undefined && <p className="mt-[2px] text-sm opacity-90">{body}</p>}
      </div>

      {action !== undefined && <div className="shrink-0">{action}</div>}
    </div>
  );
}
