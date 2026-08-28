import type { ReactNode } from 'react';

import { ArrowLeft } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The screen's top chrome.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/180-app-bar.html
 *                                                          186-back-link.html
 *
 * At most ONE trailing control. A second belongs in an action menu — a bar with
 * three icons on the right is a bar nobody reads.
 *
 * The back affordance is a real `<button>` with a label, not a bare chevron:
 * a chevron alone tells a screen-reader user nothing about where they are going.
 */

export interface AppBarProps {
  readonly title?: string;
  /** Renders the back control. Its label names the destination. */
  readonly onBack?: () => void;
  readonly backLabel?: string;
  /** At most ONE control. */
  readonly action?: ReactNode;
  /** Sticks to the top on scroll. */
  readonly sticky?: boolean;
  /** A ring of colour under the bar — used only in cook mode. */
  readonly onDark?: boolean;
  readonly className?: string;
}

export function AppBar({
  title,
  onBack,
  backLabel = 'Back',
  action,
  sticky = true,
  onDark = false,
  className,
}: AppBarProps) {
  return (
    <header
      className={cn(
        'flex items-center gap-3 border-b px-4 py-3',
        sticky && 'sticky top-0 z-sticky',
        onDark ? 'border-ink bg-ink text-ink-inv' : 'border-line bg-paper/95 backdrop-blur',
        className,
      )}
    >
      {onBack !== undefined && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          title={backLabel}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-blade-xs px-2 py-1 text-sm font-extrabold',
            'transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]',
            onDark ? 'text-ink-inv hover:bg-white/10' : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
          )}
        >
          <ArrowLeft size={19} strokeWidth={2.5} aria-hidden="true" />
        </button>
      )}

      {title !== undefined && (
        <h1 className="min-w-0 flex-1 truncate font-display text-lg font-extrabold tracking-display">
          {title}
        </h1>
      )}
      {title === undefined && <span className="flex-1" />}

      {action !== undefined && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/**
 * The bar while the session resolves.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/180-app-bar.html
 *
 * **The trailing slot shimmers; the title does not.** Which screen you are on
 * is known from the route before the session resolves, so blanking the title
 * throws away information the app already has — and makes every navigation look
 * like a cold start.
 *
 * Signed out is NOT this state: the slot then carries a sign-in control, which
 * the caller passes as `action`.
 */
export function AppBarSessionSkeleton({ className }: { readonly className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block h-8 w-8 animate-shimmer rounded-round bg-paper-2', className)}
    />
  );
}
