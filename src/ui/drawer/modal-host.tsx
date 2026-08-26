import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Show } from 'meemaw';

import { X } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives/button/button';
import { Input } from '@ui/inputs/input/input';

import { drawerStore, type ModalEntry, type ModalPosition } from './drawer-store';

/**
 * Mounts ONCE at the app root. Renders the ONE open modal.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/163-modal-confirm.html
 *                                                          164-modal-critical.html
 *                                                          166-overlay-contract.html
 *                                                          167-bottom-sheet.html
 *                                                          168-side-sheet.html
 *
 * One store slot means one modal — a stack of modals is a flow that should have
 * been a screen.
 *
 * The same store backs centred confirms, bottom sheets and side drawers; only
 * `position` differs. That is why there is no separate Sheet service.
 */

const POSITION_CLASS: Record<ModalPosition, string> = {
  center: 'items-center justify-center p-4',
  top: 'items-start justify-center p-4',
  bottom: 'items-end justify-center p-0 sm:p-4',
  left: 'items-stretch justify-start p-0',
  right: 'items-stretch justify-end p-0',
};

const PANEL_CLASS: Record<ModalPosition, string> = {
  center: 'w-full max-w-[480px] rounded-blade-xl animate-pop',
  top: 'w-full max-w-[480px] rounded-blade-xl animate-slide-down',
  bottom: 'w-full max-w-[560px] rounded-blade-xl animate-slide-up',
  left: 'h-full w-full max-w-[400px] rounded-r-blade-xl animate-slide-right',
  right: 'h-full w-full max-w-[400px] rounded-l-blade-xl animate-slide-left',
};

function ModalFrame({
  entry,
  children,
  hideClose = false,
}: {
  readonly entry: ModalEntry;
  readonly children: ReactNode;
  readonly hideClose?: boolean;
}) {
  function close() {
    entry.onCancel?.();
    drawerStore.closeModal();
  }

  // Escape closes unless the modal is sticky or opts out. A critical modal
  // keeps escape — the user must always be able to back out of something
  // irreversible without committing.
  useEffect(() => {
    if (!entry.closeOnEscape || entry.sticky) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // The page beneath must not scroll while an overlay owns the screen.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const outsideClosable = entry.closeOnOutsideClick && !entry.sticky;

  return (
    <div
      className={cn('fixed inset-0 z-modal flex bg-scrim animate-fade', POSITION_CLASS[entry.position])}
      onPointerDown={(event) => {
        if (outsideClosable && event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative border-bold border-ink bg-white p-6 shadow-modal',
          PANEL_CLASS[entry.position],
        )}
      >
        <Show when={!hideClose && !entry.sticky}>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-round text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </Show>
        {children}
      </div>
    </div>
  );
}

function StandardBody({ entry }: { readonly entry: Extract<ModalEntry, { kind: 'standard' | 'danger' }> }) {
  return (
    <>
      <h2 className="pr-8 font-display text-xl font-extrabold tracking-display">{entry.title}</h2>
      <Show when={entry.description !== undefined}>
        <p className="mt-2 text-base text-ink-2">{entry.description}</p>
      </Show>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            entry.onCancel?.();
            drawerStore.closeModal();
          }}
        >
          {entry.cancelLabel ?? 'Cancel'}
        </Button>
        <Button
          destructive={entry.kind === 'danger'}
          onClick={() => {
            entry.onConfirm();
            drawerStore.closeModal();
          }}
        >
          {entry.confirmLabel}
        </Button>
      </div>
    </>
  );
}

function CriticalBody({ entry }: { readonly entry: Extract<ModalEntry, { kind: 'critical' }> }) {
  const [typed, setTyped] = useState('');
  // Case-insensitive, trimmed: the point is deliberate intent, not typing accuracy.
  const unlocked = typed.trim().toUpperCase() === entry.confirmPhrase.toUpperCase();

  return (
    <>
      <h2 className="pr-8 font-display text-xl font-extrabold tracking-display text-critical-onsoft">
        {entry.title}
      </h2>
      <Show when={entry.description !== undefined}>
        <p className="mt-2 text-base text-ink-2">{entry.description}</p>
      </Show>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-extrabold text-ink-2">{entry.confirmPrompt}</label>
        <Input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder={entry.confirmPhrase}
          aria-label={String(entry.confirmPrompt)}
          autoFocus
        />
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            entry.onCancel?.();
            drawerStore.closeModal();
          }}
        >
          {entry.cancelLabel ?? 'Cancel'}
        </Button>
        <Button
          destructive
          disabled={!unlocked}
          onClick={() => {
            entry.onConfirm();
            drawerStore.closeModal();
          }}
        >
          {entry.confirmLabel}
        </Button>
      </div>
    </>
  );
}

export function ModalHost() {
  const state = useSyncExternalStore(drawerStore.subscribe, drawerStore.getState, drawerStore.getState);
  const entry = state.modal;

  if (typeof document === 'undefined') return null;
  if (entry === null) return null;

  return createPortal(
    entry.kind === 'custom' ? (
      <ModalFrame entry={entry} hideClose={entry.hideCloseButton}>
        {entry.body}
      </ModalFrame>
    ) : entry.kind === 'critical' ? (
      <ModalFrame entry={entry}>
        <CriticalBody entry={entry} />
      </ModalFrame>
    ) : (
      <ModalFrame entry={entry}>
        <StandardBody entry={entry} />
      </ModalFrame>
    ),
    document.body,
  );
}
