import type { ReactNode } from 'react';

import { cn } from '@shared/utils/cn';

/**
 * A card's quieter sibling, for grouping INSIDE a screen rather than standing
 * alone.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/197-panel.html
 *
 * **Console screens are made of panels; a phone screen is made of cards.** The
 * difference is not decoration — a panel assumes it sits among siblings and so
 * carries its own header, where a card assumes it is the object of attention.
 */

export interface PanelProps {
  readonly className?: string;
  readonly children: ReactNode;
}

function PanelRoot({ className, children }: PanelProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-blade border-hair border-line-2 bg-white',
        className,
      )}
    >
      {children}
    </section>
  );
}

export interface PanelHeaderProps {
  readonly title: ReactNode;
  /** At most one control. A second belongs in an action menu. */
  readonly action?: ReactNode;
  readonly className?: string;
}

function PanelHeader({ title, action, className }: PanelHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between gap-3 border-b border-line bg-paper-2 px-pad py-3',
        className,
      )}
    >
      <h3 className="min-w-0 truncate font-display text-md font-extrabold tracking-display">
        {title}
      </h3>
      {action !== undefined && <div className="shrink-0">{action}</div>}
    </header>
  );
}

function PanelBody({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return <div className={cn('p-pad', className)}>{children}</div>;
}

/** A row list with no padding — rows own their own inset. */
function PanelList({ children }: { readonly children: ReactNode }) {
  return <ul className="divide-y divide-line">{children}</ul>;
}

/** Nothing in the section. */
function PanelEmpty({ children }: { readonly children: ReactNode }) {
  return <p className="px-pad py-8 text-center text-sm text-ink-3">{children}</p>;
}

export const Panel = Object.assign(PanelRoot, {
  Header: PanelHeader,
  Body: PanelBody,
  List: PanelList,
  Empty: PanelEmpty,
});

/**
 * Same box, same padding — the panel's frame is real before its content is.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/197-panel.html
 */
export function PanelSkeleton({
  lines = 3,
  className,
}: {
  readonly lines?: number;
  readonly className?: string;
}) {
  const widths = ['88%', '96%', '72%', '84%'];
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-blade-lg border-hair border-line-2 p-pad', className)}
    >
      <span className="mb-3 block h-[15px] w-32 animate-shimmer rounded-[3px] bg-skeleton" />
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className="mt-2 block h-[13px] animate-shimmer rounded-[3px] bg-skeleton"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}
