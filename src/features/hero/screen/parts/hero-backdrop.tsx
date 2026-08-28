import { Repeat } from 'meemaw';

import { cn } from '@shared/utils/cn';

interface BackdropShape {
  readonly id: string;
  /** Tailwind position + size classes. Each shape hangs off a different edge. */
  readonly place: string;
  readonly rotate: number;
  /** Outline shapes echo Relay's faint strokes; fills are quieter still. */
  readonly kind: 'outline' | 'fill';
}

/**
 * Five oversized blade surfaces, mostly off-canvas, all near-white on the sky
 * ground. They are the same trick as the reference page's faint strokes: the
 * ground stops being a flat colour without a single pixel of it competing with
 * the headline. Every one obeys the blade — one sharp corner, three round —
 * because a decorative shape is still a surface.
 */
const SHAPES: readonly BackdropShape[] = [
  { id: 'tl', place: '-left-[12%] -top-[18%] h-[46vh] w-[34vw]', rotate: 14, kind: 'outline' },
  { id: 'tr', place: '-right-[10%] -top-[8%] h-[38vh] w-[26vw]', rotate: -11, kind: 'outline' },
  { id: 'mr', place: '-right-[16%] top-[42%] h-[42vh] w-[30vw]', rotate: 18, kind: 'fill' },
  { id: 'bl', place: '-left-[14%] bottom-[-16%] h-[44vh] w-[30vw]', rotate: -16, kind: 'fill' },
  { id: 'ml', place: 'left-[4%] top-[34%] h-[18vh] w-[10vw]', rotate: 24, kind: 'outline' },
];

export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <Repeat each={SHAPES as BackdropShape[]}>
        {(shape: BackdropShape) => (
          <span
            key={shape.id}
            data-backdrop-shape
            className={cn(
              'absolute rounded-blade-xl will-change-transform',
              shape.kind === 'outline' ? 'border-[3px] border-white/50' : 'bg-white/25',
              shape.place,
            )}
            style={{ transform: `rotate(${shape.rotate}deg)` }}
          />
        )}
      </Repeat>
    </div>
  );
}
