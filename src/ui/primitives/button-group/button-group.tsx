import type { ReactNode } from 'react';

import { cn } from '@shared/utils/cn';

/**
 * A cluster of related actions that share a single blade.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/24-button-group.html
 *
 * **The group owns the blade, not the children.** Leading corner round,
 * trailing corner sharp, everything between square — so the cluster reads as
 * one object rather than three buttons that happen to touch. Children render
 * square and inherit the group's cut.
 */

export interface ButtonGroupProps {
  readonly direction?: 'row' | 'column';
  /** Children share one edge with no gap. Unset, they sit apart. */
  readonly attached?: boolean;
  readonly disabled?: boolean;
  /** Announced to screen readers as the cluster's purpose. */
  readonly label?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

export function ButtonGroup({
  direction = 'row',
  attached = true,
  disabled = false,
  label,
  className,
  children,
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex',
        direction === 'row' ? 'flex-row' : 'flex-col',
        !attached && 'gap-3',
        // The group's own blade, imposed on the children's corners.
        attached &&
          direction === 'row' && [
            'rounded-blade-lg',
            '[&>*]:rounded-none [&>*]:shadow-none',
            '[&>*:first-child]:rounded-l-[var(--blade-lg)]',
            '[&>*:last-child]:rounded-r-[var(--blade-lg)]',
            '[&>*:not(:first-child)]:-ml-[2.5px]',
            '[&>*:active]:translate-x-0 [&>*:active]:translate-y-0',
          ],
        attached &&
          direction === 'column' && [
            'rounded-blade-lg',
            '[&>*]:rounded-none [&>*]:shadow-none [&>*]:w-full',
            '[&>*:first-child]:rounded-t-[var(--blade-lg)]',
            '[&>*:last-child]:rounded-b-[var(--blade-lg)]',
            '[&>*:not(:first-child)]:-mt-[2.5px]',
            '[&>*:active]:translate-x-0 [&>*:active]:translate-y-0',
          ],
        attached && 'shadow-drop',
        disabled && 'opacity-[0.42] pointer-events-none',
        className,
      )}
    >
      {children}
    </div>
  );
}
