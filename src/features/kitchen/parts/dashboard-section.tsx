import type { ReactNode } from 'react';

import { KoboyoIcon } from '@icons';
import { Button } from '@ui/primitives';
import { SectionHeader } from '@ui/structure';

interface DashboardSectionProps {
  readonly title: string;
  readonly action?: ReactNode;
  readonly isEmpty: boolean;
  readonly emptyIcon?: string;
  readonly emptyTitle?: string;
  readonly emptyBody?: string;
  readonly emptyAction?: { readonly label: string; readonly onClick: () => void };
  readonly children: ReactNode;
  /** Anchor for the product tour to point at. */
  readonly 'data-tour'?: string;
}

/**
 * One dashboard section, with its own empty state.
 *
 * Sections are shown even when they have nothing in them. A new cook seeing
 * five headings with "nothing yet, here is what fills this" learns the shape of
 * the product; a cook seeing a blank page learns nothing and assumes it is
 * broken.
 */
export function DashboardSection({
  title,
  action,
  isEmpty,
  emptyIcon = 'emptyBox',
  emptyTitle = 'Nothing here yet',
  emptyBody,
  emptyAction,
  children,
  'data-tour': dataTour,
}: DashboardSectionProps) {
  return (
    <section data-tour={dataTour}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionHeader title={title} />
        {action}
      </div>

      {isEmpty ? (
        <div className="rounded-blade border border-dashed border-line bg-white/50 px-4 py-8 text-center">
          <KoboyoIcon name={emptyIcon as never} size={28} className="text-ink-3" alone />
          <p className="mt-2 text-sm font-extrabold text-ink">{emptyTitle}</p>
          {emptyBody !== undefined ? (
            <p className="mt-1 text-xs text-ink-2">{emptyBody}</p>
          ) : null}
          {emptyAction !== undefined ? (
            <Button variant="secondary" size="sm" className="mt-3" onClick={emptyAction.onClick}>
              {emptyAction.label}
            </Button>
          ) : null}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
