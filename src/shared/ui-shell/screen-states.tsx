import type { ReactNode } from 'react';

import { Repeat } from 'meemaw';

import { KoboyoIcon } from '@icons';
import type { ApiError } from '@shared/services/api-client';
import { Button } from '@ui/primitives';
import { PanelSkeleton, SectionHeaderSkeleton } from '@ui/structure';
import { StatSkeleton } from '@ui/display';
import { StockItemSkeleton } from '@ui/stock';

/**
 * Loading and failure states, shaped like the content they stand in for.
 *
 * **No spinners.** A spinner says "something is happening"; a skeleton says
 * "four rows of stock are coming, here is where they will be" — so the layout
 * does not jump when the data lands, and the wait feels like the page rather
 * than an interruption.
 */

export function StatsSkeleton({ count = 4 }: { readonly count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Repeat each={Array.from({ length: count }, (_, index) => index)}>
        {(index: number) => <StatSkeleton key={index} weight="compact" />}
      </Repeat>
    </div>
  );
}

export function StockListSkeleton({ groups = 2, rows = 3 }: { readonly groups?: number; readonly rows?: number }) {
  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2">
      <Repeat each={Array.from({ length: groups }, (_, index) => index)}>
        {(group: number) => (
          <div key={group} className="overflow-hidden rounded-blade border border-line bg-white">
            <div className="border-b border-line px-4 py-3">
              <SectionHeaderSkeleton />
            </div>
            <Repeat each={Array.from({ length: rows }, (_, index) => index)}>
              {(row: number) => (
                <div key={row} className="border-b border-line last:border-0">
                  <StockItemSkeleton />
                </div>
              )}
            </Repeat>
          </div>
        )}
      </Repeat>
    </div>
  );
}

/** Cards that become meal suggestions. */
export function CardListSkeleton({ count = 3, height = 'h-32' }: { readonly count?: number; readonly height?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Repeat each={Array.from({ length: count }, (_, index) => index)}>
        {(index: number) => (
          <div
            key={index}
            aria-hidden="true"
            className={`${height} animate-shimmer rounded-blade bg-paper-2`}
          />
        )}
      </Repeat>
    </div>
  );
}

export function PanelListSkeleton({ count = 2, lines = 3 }: { readonly count?: number; readonly lines?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <Repeat each={Array.from({ length: count }, (_, index) => index)}>
        {(index: number) => <PanelSkeleton key={index} lines={lines} />}
      </Repeat>
    </div>
  );
}

/** The whole dashboard, held in place while it loads. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <StatsSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <PanelListSkeleton count={2} lines={3} />
        </div>
        <PanelSkeleton lines={4} />
      </div>
    </div>
  );
}

interface ScreenErrorProps {
  readonly error: ApiError | Error | null;
  readonly onRetry?: () => void;
  /** What the person was trying to see, for the sentence. */
  readonly what?: string;
}

/**
 * A failure somebody can act on.
 *
 * Shows the server's own message — it was resolved from the message registry
 * and says what actually went wrong. A generic "something went wrong" throws
 * that away and leaves the person with nothing to do.
 */
export function ScreenError({ error, onRetry, what = 'this' }: ScreenErrorProps) {
  const message =
    error === null
      ? `We could not load ${what}.`
      : error.message.length > 0
        ? error.message
        : `We could not load ${what}.`;

  return (
    <div className="rounded-blade border border-critical-border bg-critical-soft p-6 text-center">
      <KoboyoIcon name="error" size={32} className="text-critical-onsoft" alone />
      <p className="mt-3 text-sm font-extrabold text-critical-onsoft">{message}</p>
      {onRetry !== undefined ? (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Picks between skeleton, error and content.
 *
 * One place, so no screen can accidentally ship a spinner or forget the failure
 * branch — which is exactly how "it just hangs" bugs get shipped.
 */
export function ScreenState({
  isLoading,
  error,
  onRetry,
  skeleton,
  what,
  children,
}: {
  readonly isLoading: boolean;
  readonly error: ApiError | Error | null;
  readonly onRetry?: () => void;
  readonly skeleton: ReactNode;
  readonly what?: string;
  readonly children: ReactNode;
}) {
  if (isLoading) return <>{skeleton}</>;
  if (error !== null) {
    return (
      <ScreenError
        error={error}
        {...(onRetry !== undefined && { onRetry })}
        {...(what !== undefined && { what })}
      />
    );
  }
  return <>{children}</>;
}
