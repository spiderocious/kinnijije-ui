import { Blobatar as BaseBlobatar } from 'blobatar/react';
import {
  happy,
  idle,
  love,
  sad,
  sleepy,
  surprised,
  thinking,
  unsure,
  wink,
} from 'blobatar/expression';
import 'blobatar/motion.css';

/**
 * The creature system.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/11-blobatar.html
 *                                                          12-blobatar-loading.html
 *
 * `blobatar` is a real dependency — a deterministic soft body and two capsule
 * eyes drawn from any string, so the same name always renders the same creature.
 * Every blob in this system is genuine generated output, not an illustration
 * style being reproduced.
 *
 * Two rules this wrapper exists to enforce:
 *
 * 1. **Hue is locked to 205 system-wide.** A screen may not pick its own — the
 *    name drives the shape, never the colour, so the creatures read as one
 *    family across the whole product.
 * 2. **`name` is WHO it stands for** — a username, an email, an id. Not a random
 *    seed. Passing a random string per render defeats the determinism that makes
 *    a person's avatar recognisable.
 *
 * Turning on `animate` changes the rendering mode: a static blobatar is one
 * `<img>`, an animated one is inline SVG at roughly a dozen DOM nodes. A list of
 * 400 avatars is exactly the case the `<img>` default exists for, so `animate`
 * stays off unless a surface genuinely needs motion.
 */

/** Hue locked system-wide. Never overridden by a screen. */
const SYSTEM_HUE = 205;

/**
 * The expression roster. Each pose is a state you hold — nothing returns to
 * idle on its own, and there are no timers.
 */
export const BLOB_EXPRESSIONS = {
  /** A resting avatar. */
  idle,
  /** Every AI wait — extraction, suggestion, generation. */
  thinking,
  /** Empty states — nothing here yet. */
  sleepy,
  /** Success — saved, published, cooked. */
  happy,
  /** The first suggestion lands. */
  surprised,
  /** A playful confirm. */
  wink,
  /** A recoverable error. */
  unsure,
  /** A hard failure. */
  sad,
  /** A milestone. */
  love,
} as const;

export type BlobExpression = keyof typeof BLOB_EXPRESSIONS;

export interface BlobProps {
  /**
   * WHO the creature stands for — a username, an email, an id. The same name
   * always renders the same creature.
   */
  readonly name: string;
  /** Rendered size in pixels. */
  readonly size?: number;
  /** Which pose to hold. Defaults to `idle`. */
  readonly expression?: BlobExpression;
  /**
   * Idle animation. Off by default — switching it on moves the render from one
   * `<img>` to inline SVG, which a long list should not pay for.
   */
  readonly animate?: false | 'hover' | 'always';
  /** Backdrop shape. `false` renders transparent. */
  readonly background?: boolean | 'square' | 'circle' | 'squircle';
  readonly className?: string;
  /** Adds a `<title>` for screen readers. */
  readonly title?: string;
}

export function Blob({
  name,
  size = 44,
  expression = 'idle',
  animate = false,
  background,
  className,
  title,
}: BlobProps) {
  const pose = BLOB_EXPRESSIONS[expression];

  if (animate === false) {
    return (
      <BaseBlobatar
        name={name}
        size={size}
        hue={SYSTEM_HUE}
        expression={pose}
        background={background}
        className={className}
        title={title}
        alt={title ?? ''}
      />
    );
  }

  return (
    <BaseBlobatar
      name={name}
      size={size}
      hue={SYSTEM_HUE}
      expression={pose}
      animate={animate}
      background={background}
      className={className}
      title={title}
    />
  );
}

export interface BlobThinkingProps {
  readonly size?: number;
  readonly className?: string;
  /** What the chef is working on, announced to screen readers. */
  readonly label?: string;
}

/**
 * The AI loader. Used everywhere the chef is extracting, suggesting or
 * generating — one creature, one pose, so a machine wait always looks the same.
 */
export function BlobThinking({
  size = 44,
  className,
  label = 'Working on it',
}: BlobThinkingProps) {
  return (
    <span role="status" aria-live="polite" className={className}>
      <Blob name="chef" size={size} expression="thinking" animate="always" title={label} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
