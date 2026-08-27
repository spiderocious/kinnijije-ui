import { Show } from 'meemaw';

import { KoboyoIcon, X, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';

/**
 * The promotional slot.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/101-banner-data.html
 *
 * **`onDismiss` is REQUIRED — an undismissable promo is an advert.** The type
 * makes that structural rather than a review comment.
 *
 * **Empty collapses; it never renders a placeholder box.** A promo slot with
 * nothing to promote is not a loading state and not an empty state — it is
 * absence, and absence takes no space. That is why the caller passes
 * `title: undefined` and gets `null`, instead of the component offering an
 * `empty` variant that would tempt someone to fill it.
 *
 * This is a `quiet` Card on `sky-soft` — the one promotional use of the action
 * colour that is not itself an action.
 */

export interface PromoCardProps {
  /** Absent means nothing to promote — the slot collapses. */
  readonly title?: string;
  readonly body?: string;
  readonly icon?: KoboyoIconName;
  readonly action?: { readonly label: string; readonly onPress: () => void };
  /** REQUIRED. There is no such thing as a promo the reader cannot close. */
  readonly onDismiss: () => void;
  readonly className?: string;
}

export function PromoCard({
  title,
  body,
  icon = 'cookingPot',
  action,
  onDismiss,
  className,
}: PromoCardProps) {
  // The collapse. Not an empty state — no box, no placeholder, no height.
  if (title === undefined) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 overflow-hidden rounded-blade-lg bg-sky-soft px-4 py-3.5',
        className,
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center text-sky-deep">
        <KoboyoIcon name={icon} size={28} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-ink">{title}</p>
        <Show when={body !== undefined}>
          <p className="text-xs text-ink-2">{body}</p>
        </Show>
      </div>

      <Show when={action !== undefined}>
        <Button variant="secondary" size="sm" onClick={action?.onPress}>
          {action?.label}
        </Button>
      </Show>

      {/* Matches the banner's dismiss affordance — same glyph, same measure. */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-round transition-colors hover:bg-ink/10 focus-visible:shadow-[0_0_0_3px_var(--sky-glow)] focus-visible:outline-none"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
}

/** The skeleton sits in the same box as the loaded shape — nothing shifts. */
export function PromoCardSkeleton({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('h-[70px] w-full animate-shimmer rounded-blade-lg bg-paper-2', className)}
    />
  );
}
