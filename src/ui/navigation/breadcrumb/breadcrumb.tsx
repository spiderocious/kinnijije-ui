import { Repeat } from 'meemaw';

import { ChevronRight } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * Where you are, and the way back up.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/185-breadcrumb.html
 *
 * **The last crumb is the current page and is NOT a link** — it is marked
 * `aria-current="page"` and rendered as text. A breadcrumb whose last item
 * navigates to where you already are teaches people to distrust the whole
 * control.
 *
 * Long trails collapse in the MIDDLE, keeping the root and the parent — those
 * are the two anyone actually presses.
 */

export interface Crumb {
  readonly label: string;
  /** Omit on the last crumb. */
  readonly href?: string;
  readonly onNavigate?: () => void;
}

export interface BreadcrumbProps {
  readonly crumbs: readonly Crumb[];
  /** Collapse the middle past this many. */
  readonly maxVisible?: number;
  readonly className?: string;
}

export function Breadcrumb({ crumbs, maxVisible = 4, className }: BreadcrumbProps) {
  const collapsed = crumbs.length > maxVisible;
  // Keep the root and the last two — the ones anyone presses.
  const shown = collapsed
    ? [crumbs[0], null, ...crumbs.slice(-2)]
    : crumbs;

  // Top level — the trail collapses. A one-crumb breadcrumb is the page's own
  // title said twice, and it teaches the user that the control does nothing.
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        <Repeat each={[...shown]}>
          {(crumb: Crumb | null | undefined, index: number) => {
            const isLast = index === shown.length - 1;

            if (crumb === null || crumb === undefined) {
              return (
                <li key={`gap-${index}`} className="flex items-center gap-1">
                  <span aria-hidden="true" className="text-ink-4">
                    …
                  </span>
                  <ChevronRight size={13} aria-hidden="true" className="text-ink-4" />
                </li>
              );
            }

            return (
              <li key={crumb.label} className="flex items-center gap-1">
                {isLast ? (
                  // The current page. Text, not a link.
                  <span aria-current="page" className="font-extrabold text-ink">
                    {crumb.label}
                  </span>
                ) : (
                  <>
                    <a
                      href={crumb.href ?? '#'}
                      onClick={
                        crumb.onNavigate === undefined
                          ? undefined
                          : (event) => {
                              event.preventDefault();
                              crumb.onNavigate?.();
                            }
                      }
                      className="rounded-[3px] font-semibold text-ink-3 underline decoration-line-2 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink-3 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
                    >
                      {crumb.label}
                    </a>
                    <ChevronRight size={13} aria-hidden="true" className="text-ink-4" />
                  </>
                )}
              </li>
            );
          }}
        </Repeat>
      </ol>
    </nav>
  );
}

export interface PageControlProps {
  readonly total: number;
  /** 0-indexed. */
  readonly current: number;
  readonly onChange?: (index: number) => void;
  readonly label?: string;
  readonly className?: string;
}

/**
 * Dots — for a carousel or an onboarding run.
 *
 * Visual spec: 205-prompt-hero.html (page control)
 *
 * Capped at eight. Past that the dots stop being countable at a glance and a
 * "3 of 14" figure does the job the dots were doing.
 */
export function PageControl({
  total,
  current,
  onChange,
  label = 'Page',
  className,
}: PageControlProps) {
  const dots = Array.from({ length: total }, (_, index) => index);

  if (total > 8) {
    return (
      <p className={cn('font-mono text-xs tnum text-ink-3', className)}>
        {current + 1} of {total}
      </p>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Repeat each={dots}>
        {(index: number) => {
          const active = index === current;
          const shared = cn(
            'h-[7px] rounded-pill transition-all duration-fast',
            active ? 'w-5 bg-sky' : 'w-[7px] bg-line-2',
          );

          if (onChange === undefined) {
            return <span key={index} aria-hidden="true" className={shared} />;
          }

          return (
            <button
              key={index}
              type="button"
              aria-label={`${label} ${index + 1}`}
              aria-current={active ? 'true' : undefined}
              onClick={() => onChange(index)}
              className={cn(shared, 'cursor-pointer hover:bg-sky-edge focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]')}
            />
          );
        }}
      </Repeat>
    </div>
  );
}

export interface SkipLinkProps {
  readonly targetId: string;
  readonly label?: string;
}

/**
 * The keyboard escape from a nav.
 *
 * Visually hidden until focused — the first Tab on any page should offer a way
 * past the navigation, and a sighted mouse user never sees it.
 */
export function SkipLink({ targetId, label = 'Skip to content' }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-tooltip focus:rounded-blade-xs focus:border-bold focus:border-ink focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-extrabold focus:shadow-drop"
    >
      {label}
    </a>
  );
}

/**
 * The record name is still resolving.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/185-breadcrumb.html
 *
 * **Only the last crumb shimmers.** The ancestors come from the route and are
 * known immediately; blanking them would make a deep page look like a cold load
 * every time it opened.
 */
export function BreadcrumbSkeleton({
  ancestors,
  className,
}: {
  readonly ancestors: readonly string[];
  readonly className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        <Repeat each={[...ancestors]}>
          {(label: string) => (
            <li key={label} className="flex items-center gap-1">
              <span className="text-ink-3">{label}</span>
              <span aria-hidden="true" className="text-ink-4">
                /
              </span>
            </li>
          )}
        </Repeat>
        <li>
          <span
            aria-hidden="true"
            className="block h-[14px] w-28 animate-shimmer rounded-[3px] bg-paper-2"
          />
        </li>
      </ol>
    </nav>
  );
}
