import type { ReactNode } from 'react';

import { cn } from '@shared/utils/cn';

/**
 * The sticky bottom action bar.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/25-button-dock.html
 *
 * It holds the screen's ONE commit and at most one secondary, sits in the thumb
 * zone, and carries a top edge so it never floats ambiguously over content.
 *
 * `Dock.Primary` is required — a dock with no commit is just a bar. At most one
 * secondary; a third action belongs in a menu.
 *
 * **The dock never animates in and out on scroll.** Content scrolls under it and
 * the top edge does the separating; a bar that appears and disappears is a bar
 * the thumb cannot learn.
 */

export interface DockProps {
  readonly className?: string;
  readonly children: ReactNode;
}

function DockRoot({ className, children }: DockProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-sticky border-t border-ink bg-paper',
        // Thumb-zone padding, plus the iOS home indicator.
        'px-4 pb-[max(var(--s-4),env(safe-area-inset-bottom))] pt-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A callout above the bar, for a lock or a warning. */
function DockNotice({
  tone = 'neutral',
  children,
}: {
  readonly tone?: 'neutral' | 'caution' | 'critical';
  readonly children: ReactNode;
}) {
  return (
    <p
      className={cn(
        'mb-3 rounded-blade-xs border px-3 py-2 text-sm font-extrabold',
        tone === 'neutral' && 'border-neutral-border bg-neutral-soft text-neutral-onsoft',
        tone === 'caution' && 'border-caution-border bg-caution-soft text-caution-onsoft',
        tone === 'critical' && 'border-critical-border bg-critical-soft text-critical-onsoft',
      )}
    >
      {children}
    </p>
  );
}

/** The one commit. Full-width unless a secondary is present. */
function DockPrimary({ children }: { readonly children: ReactNode }) {
  return <div className="min-w-0 flex-1 [&>*]:w-full">{children}</div>;
}

/** At most one. A third action belongs in a menu. */
function DockSecondary({ children }: { readonly children: ReactNode }) {
  return <div className="shrink-0">{children}</div>;
}

/** The row the primary and secondary sit in. */
function DockActions({ children }: { readonly children: ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>;
}

export const Dock = Object.assign(DockRoot, {
  Notice: DockNotice,
  Actions: DockActions,
  Primary: DockPrimary,
  Secondary: DockSecondary,
});
