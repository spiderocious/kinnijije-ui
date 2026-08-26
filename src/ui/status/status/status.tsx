import { cn } from '@shared/utils/cn';
import {
  STATUS_DOT_CLASS,
  STATUS_REGISTRY,
  STATUS_TONE_CLASS,
  type StatusKind,
  type StatusValueOf,
} from '../status-registry';

/**
 * One pill for every lifecycle in the product.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/126-status-contract.html
 *
 * `kind` selects the lifecycle FAMILY; `value` is that family's enum. The
 * label and the colour both come from the registry, so:
 *
 * - **There is no `tone` prop.** A call site may never choose the colour — that
 *   is exactly how the shipped app ended up with `easy` meaning four unrelated
 *   things.
 * - **The label is owned by the registry.** No screen renders the raw enum, so
 *   one recipe cannot read three different ways on three consecutive screens.
 * - **An unknown value renders `neutral` plus the raw string**, never a guessed
 *   colour. A missing mapping should look like a missing mapping.
 *
 * `value` is typed against the chosen family, so a typo or a value from the
 * WRONG lifecycle is a compile error rather than a silent neutral pill. A value
 * that genuinely comes from outside the registry — a legacy row, a new database
 * enum not yet mapped — must opt in through `unmapped`, which makes "we have not
 * mapped this yet" a deliberate, greppable statement rather than a typo that
 * renders grey.
 */

interface StatusBase {
  readonly size?: 'sm' | 'md';
  /** Adds a leading dot. Useful in a dense list where the word is enough. */
  readonly dot?: boolean;
  readonly className?: string;
}

interface StatusMapped<K extends StatusKind> extends StatusBase {
  readonly kind: K;
  /** Must be a value this family declares. */
  readonly value: StatusValueOf<K>;
  readonly unmapped?: false;
}

interface StatusUnmapped<K extends StatusKind> extends StatusBase {
  readonly kind: K;
  /** A raw value from outside the registry. Renders neutral + the raw string. */
  readonly value: string;
  /** Explicit opt-in. Without it, an unknown value is a compile error. */
  readonly unmapped: true;
}

export type StatusProps<K extends StatusKind> = StatusMapped<K> | StatusUnmapped<K>;

export function Status<K extends StatusKind>({
  kind,
  value,
  size = 'md',
  dot = false,
  className,
}: StatusProps<K>) {
  const family: Record<string, { label: string; tone: keyof typeof STATUS_TONE_CLASS }> =
    STATUS_REGISTRY[kind];
  const entry = family[value];

  // An unmapped value never guesses a colour — it says so in neutral.
  const label = entry?.label ?? value;
  const tone = entry?.tone ?? 'neutral';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-[6px] whitespace-nowrap rounded-blade-xs border font-extrabold',
        'transition-colors duration-fast ease-kj',
        size === 'sm' ? 'px-2 py-[2px] text-xs' : 'px-[10px] py-1 text-sm',
        STATUS_TONE_CLASS[tone],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn('h-[6px] w-[6px] shrink-0 rounded-round', STATUS_DOT_CLASS[tone])}
        />
      )}
      {label}
    </span>
  );
}

/** A skeleton in the shape a status will become. */
export function StatusSkeleton({ size = 'md' }: { readonly size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block animate-shimmer rounded-blade-xs bg-paper-2',
        size === 'sm' ? 'h-[20px] w-[62px]' : 'h-[26px] w-[78px]',
      )}
    />
  );
}
