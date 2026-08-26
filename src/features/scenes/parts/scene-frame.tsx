import type { ReactNode } from 'react';

import { cn } from '@shared/utils/cn';

import type { SceneFrame } from '../scenes.registry';

/**
 * The device frames a scene renders inside.
 *
 * These exist only for REVIEW — at `/scenes/<id>` a scene renders full-bleed at
 * the real viewport, with no frame at all. A frame that is present in the
 * shipped app is a frame that lied during design.
 *
 * Widths come from the spec: phone 392, desktop 920.
 */

const FRAME_WIDTH: Record<SceneFrame, number> = {
  phone: 392,
  desktop: 920,
};

export interface DeviceFrameProps {
  readonly frame: SceneFrame;
  /** What the frame proves — shown as a caption beneath it. */
  readonly caption?: string;
  /** Constrains the scene's height so a long screen scrolls inside the frame. */
  readonly height?: number;
  readonly children: ReactNode;
}

export function DeviceFrame({ frame, caption, height = 720, children }: DeviceFrameProps) {
  return (
    <figure className="m-0 flex min-w-0 flex-col">
      <figcaption className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.06em] text-ink-3">
        {frame} · {FRAME_WIDTH[frame]}
      </figcaption>

      <div
        className={cn(
          'overflow-hidden border-bold border-ink bg-paper shadow-drop',
          frame === 'phone' ? 'rounded-blade-xl' : 'rounded-blade-lg',
        )}
        style={{ width: FRAME_WIDTH[frame], maxWidth: '100%' }}
      >
        {/* The scene's own scroll container — the frame does not scroll, the
            screen inside it does, exactly as a real device behaves. */}
        <div className="flex flex-col overflow-y-auto" style={{ height }}>
          {children}
        </div>
      </div>

      {caption !== undefined && (
        <p className="mt-2 max-w-[392px] text-sm text-ink-2">{caption}</p>
      )}
    </figure>
  );
}

/**
 * The scene's own root. Fills whatever it is given — a device frame in the
 * viewer, or the whole viewport on its own route.
 */
export function SceneRoot({
  frame,
  className,
  children,
}: {
  readonly frame: SceneFrame;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex min-h-full flex-1 flex-col bg-paper',
        // The curator's console runs at COUNTER density.
        className,
      )}
      data-frame={frame}
    >
      {children}
    </div>
  );
}

/** A scene's scrolling body, between a fixed app bar and a fixed dock. */
export function SceneBody({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return <div className={cn('flex-1 px-4 py-5', className)}>{children}</div>;
}
