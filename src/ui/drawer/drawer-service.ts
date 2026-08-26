import type { ReactNode } from 'react';

import {
  drawerStore,
  type BannerPosition,
  type FeedbackTone,
  type ModalPosition,
  type ToastPosition,
} from './drawer-store';

/**
 * The imperative overlay API. Callable from anywhere — a query's `onError`, a
 * service module, an event handler — with no props threaded through the tree
 * and no context to be inside of.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/166-overlay-contract.html
 *
 * Mount `<ToastHost />`, `<BannerHost />` and `<ModalHost />` ONCE at the app
 * root. Everything else calls this singleton.
 *
 * ```ts
 * DrawerService.toast('Saved.', { tone: 'success' });
 * DrawerService.confirm('Delete this recipe?', {
 *   destructive: true,
 *   onConfirm: () => remove(id),
 * });
 * DrawerService.critical('Suspend this account?', {
 *   confirmPhrase: 'SUSPEND',
 *   onConfirm: () => suspend(id),
 * });
 * ```
 */

const DEFAULT_TOAST_MS = 4200;

export interface ToastOptions {
  readonly tone?: FeedbackTone;
  readonly durationMs?: number;
  /** Will not auto-dismiss. */
  readonly sticky?: boolean;
  readonly position?: ToastPosition;
  readonly action?: { readonly label: string; readonly onClick: () => void };
}

export interface BannerOptions {
  readonly tone?: FeedbackTone;
  readonly description?: ReactNode;
  readonly cta?: { readonly label: string; readonly onClick: () => void };
  readonly position?: BannerPosition;
  /** Banners default sticky. Pass `false` with a duration to auto-dismiss. */
  readonly sticky?: boolean;
  readonly durationMs?: number;
}

export interface ConfirmOptions {
  readonly onConfirm: () => void;
  readonly description?: ReactNode;
  /** Tones the confirm control critical. Not the same as `critical()`. */
  readonly destructive?: boolean;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly onCancel?: () => void;
  readonly position?: ModalPosition;
  readonly closeOnOutsideClick?: boolean;
  readonly closeOnEscape?: boolean;
  readonly sticky?: boolean;
}

export interface CriticalOptions {
  readonly onConfirm: () => void;
  readonly description?: ReactNode;
  /** The literal string the user must type. Defaults to the title's first word. */
  readonly confirmPhrase?: string;
  readonly confirmPrompt?: ReactNode;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly onCancel?: () => void;
}

export interface CustomModalOptions {
  readonly position?: ModalPosition;
  readonly closeOnOutsideClick?: boolean;
  readonly closeOnEscape?: boolean;
  readonly sticky?: boolean;
  readonly hideCloseButton?: boolean;
  readonly onClose?: () => void;
}

export const DrawerService = {
  /** A short confirmation. Auto-dismisses unless `sticky`. */
  toast(message: ReactNode, options: ToastOptions = {}): string {
    return drawerStore.pushToast({
      message,
      tone: options.tone ?? 'neutral',
      durationMs: options.durationMs ?? DEFAULT_TOAST_MS,
      sticky: options.sticky ?? false,
      position: options.position ?? 'bottom-center',
      ...(options.action !== undefined ? { action: options.action } : {}),
    });
  },

  dismissToast(id: string): void {
    drawerStore.dismissToast(id);
  },

  /** A persistent strip. Used for offline, a paused feature, a degraded state. */
  banner(title: ReactNode, options: BannerOptions = {}): string {
    return drawerStore.pushBanner({
      title,
      tone: options.tone ?? 'info',
      position: options.position ?? 'top',
      sticky: options.sticky ?? true,
      durationMs: options.durationMs ?? 0,
      ...(options.description !== undefined ? { description: options.description } : {}),
      ...(options.cta !== undefined ? { cta: options.cta } : {}),
    });
  },

  dismissBanner(id: string): void {
    drawerStore.dismissBanner(id);
  },

  /** A reversible decision. One question, two answers. */
  confirm(title: ReactNode, options: ConfirmOptions): void {
    drawerStore.openModal({
      kind: options.destructive === true ? 'danger' : 'standard',
      title,
      confirmLabel: options.confirmLabel ?? (options.destructive === true ? 'Delete' : 'Confirm'),
      cancelLabel: options.cancelLabel ?? 'Cancel',
      onConfirm: options.onConfirm,
      position: options.position ?? 'center',
      closeOnOutsideClick: options.closeOnOutsideClick ?? true,
      closeOnEscape: options.closeOnEscape ?? true,
      sticky: options.sticky ?? false,
      ...(options.description !== undefined ? { description: options.description } : {}),
      ...(options.onCancel !== undefined ? { onCancel: options.onCancel } : {}),
    });
  },

  /**
   * Irreversible, and it affects someone other than the person clicking. The
   * user types the phrase before the commit unlocks. Never closes on an outside
   * click — a stray tap must not be able to dismiss the one thing that made
   * them read.
   */
  critical(title: ReactNode, options: CriticalOptions): void {
    const phrase = options.confirmPhrase ?? 'CONFIRM';
    drawerStore.openModal({
      kind: 'critical',
      title,
      confirmPhrase: phrase,
      confirmPrompt: options.confirmPrompt ?? `Type ${phrase} to continue`,
      confirmLabel: options.confirmLabel ?? 'I understand, continue',
      cancelLabel: options.cancelLabel ?? 'Cancel',
      onConfirm: options.onConfirm,
      position: 'center',
      closeOnOutsideClick: false,
      closeOnEscape: true,
      sticky: false,
      ...(options.description !== undefined ? { description: options.description } : {}),
      ...(options.onCancel !== undefined ? { onCancel: options.onCancel } : {}),
    });
  },

  /** An arbitrary body. The service still provides the scrim and the close control. */
  openModal(body: ReactNode, options: CustomModalOptions = {}): void {
    drawerStore.openModal({
      kind: 'custom',
      body,
      position: options.position ?? 'center',
      closeOnOutsideClick: options.closeOnOutsideClick ?? true,
      closeOnEscape: options.closeOnEscape ?? true,
      sticky: options.sticky ?? false,
      hideCloseButton: options.hideCloseButton ?? false,
      ...(options.onClose !== undefined ? { onCancel: options.onClose } : {}),
    });
  },

  closeModal(): void {
    drawerStore.closeModal();
  },
} as const;
