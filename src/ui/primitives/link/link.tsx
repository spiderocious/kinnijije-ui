import { useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Repeat, Show } from 'meemaw';

import { ChevronDown, ExternalLink, KoboyoIcon, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';

/**
 * The three links.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/28-link-nav.html
 *                                                          29-link-action.html
 *                                                          30-link-menu.html
 *
 * **The distinction is semantic, not visual.** `NavLink` is a real `<a href>`
 * that goes somewhere — it can be middle-clicked, copied and opened in a tab.
 * `ActionLink` borrows the styling but renders a real `<button>`, because it
 * does something in place and an anchor that goes nowhere is a lie to every
 * assistive technology and every "open in new tab".
 *
 * `MenuLink` flips its caret to say "this opens, it does not navigate".
 */

const weightMap = {
  loud: 'font-extrabold text-sky-on decoration-sky decoration-2',
  quiet: 'font-semibold text-ink-2 decoration-line-2 decoration-1 hover:text-ink hover:decoration-ink-3',
} as const;

export type LinkWeight = keyof typeof weightMap;

const SHARED =
  'inline-flex items-center gap-1 underline underline-offset-[3px] transition-colors duration-fast rounded-[3px] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]';

export interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  readonly weight?: LinkWeight;
  /** Marks an outbound link and appends the icon that says so. */
  readonly external?: boolean;
  readonly children: ReactNode;
}

/** Goes somewhere. A real anchor. */
export function NavLink({
  weight = 'loud',
  external = false,
  className,
  children,
  ...rest
}: NavLinkProps) {
  return (
    <a
      className={cn(SHARED, weightMap[weight], 'hover:decoration-sky-deep', className)}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      {...rest}
    >
      {children}
      <Show when={external}>
        <ExternalLink size={13} aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </Show>
    </a>
  );
}

export interface ActionLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly weight?: LinkWeight;
  readonly destructive?: boolean;
  readonly children: ReactNode;
}

/**
 * Looks like a link, IS a button.
 *
 * Used for an in-place action — "clear the filter", "show more". An `<a>` with
 * no href here would break the keyboard, the screen reader and middle-click all
 * at once.
 */
export function ActionLink({
  weight = 'loud',
  destructive = false,
  className,
  children,
  ...rest
}: ActionLinkProps) {
  return (
    <button
      type="button"
      className={cn(
        SHARED,
        weightMap[weight],
        destructive && 'text-critical-onsoft decoration-critical',
        'disabled:opacity-[0.42] disabled:cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: KoboyoIconName;
  readonly destructive?: boolean;
  readonly onSelect: () => void;
}

export interface MenuLinkProps {
  readonly label: string;
  readonly items: readonly MenuItem[];
  readonly weight?: LinkWeight;
  readonly className?: string;
}

/**
 * A trigger whose caret flips.
 *
 * Visual spec: 30-link-menu.html · 184-menu.html
 *
 * The caret is the whole point — it is what distinguishes "this opens something
 * here" from "this takes you elsewhere", which no amount of colour can say.
 */
export function MenuLink({ label, items, weight = 'quiet', className }: MenuLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((c) => !c)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setOpen(false);
        }}
        className={cn(SHARED, weightMap[weight], 'no-underline')}
      >
        {label}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn('transition-transform duration-fast', open && 'rotate-180')}
        />
      </button>

      <Show when={open}>
        <ul
          role="menu"
          className="absolute left-0 top-[calc(100%+6px)] z-dropdown min-w-[180px] rounded-blade-sm border-bold border-ink bg-white p-1 shadow-pop animate-slide-down"
        >
          <Repeat each={[...items]}>
            {(item: MenuItem) => (
              <li key={item.id} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.onSelect();
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-blade-xs px-3 py-2 text-left text-ctrl font-semibold',
                    'transition-colors duration-fast',
                    item.destructive === true
                      ? 'text-critical-onsoft hover:bg-critical-soft'
                      : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
                  )}
                >
                  <Show when={item.icon !== undefined}>
                    <KoboyoIcon name={item.icon ?? 'info'} size={15} className="shrink-0" />
                  </Show>
                  {item.label}
                </button>
              </li>
            )}
          </Repeat>
        </ul>
      </Show>
    </span>
  );
}

export interface QuickReplyProps {
  readonly replies: readonly string[];
  readonly onSelect: (reply: string) => void;
  readonly className?: string;
}

/**
 * Suggested answers, tappable.
 *
 * Visual spec: 32-quick-reply.html
 *
 * **They disappear once one is chosen** — a stale suggestion is worse than
 * none, because it invites a second answer to a question already answered.
 */
export function QuickReply({ replies, onSelect, className }: QuickReplyProps) {
  if (replies.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      <Repeat each={[...replies]}>
        {(reply: string) => (
          <li key={reply}>
            <button
              type="button"
              onClick={() => onSelect(reply)}
              className="rounded-pill border border-line-2 bg-white px-3 py-[6px] text-sm font-extrabold text-ink-2 transition-colors duration-fast hover:border-sky-edge hover:bg-sky-soft hover:text-sky-on focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
            >
              {reply}
            </button>
          </li>
        )}
      </Repeat>
    </ul>
  );
}
