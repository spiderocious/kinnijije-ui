import type { ReactNode } from 'react';

/**
 * The store backing the imperative `DrawerService`.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/150-toast.html
 *                                                          149-banner-system.html
 *                                                          163-modal-confirm.html
 *                                                          164-modal-critical.html
 *                                                          166-overlay-contract.html
 *
 * Three queues:
 *
 *   toasts  — auto-dismissing pills (or sticky ones) stacked in any of 6 zones
 *   banners — persistent strips at the top or bottom of the viewport
 *   modal   — at most ONE open at a time (standard / danger / critical / custom)
 *
 * Framework-free on purpose: a plain pub-sub that the host components read with
 * `useSyncExternalStore`. No Zustand, no Redux — reactivity is a React concern
 * and this layer has to be callable from anywhere, including outside a
 * component tree.
 */

/** The one semantic enum, reused verbatim. `ai` is provenance, not severity. */
export type FeedbackTone = 'neutral' | 'info' | 'success' | 'caution' | 'critical' | 'ai';

/* ============== Toast ============== */

/** Six zones cover every real toast position. */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastEntry {
  id: string;
  tone: FeedbackTone;
  message: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Auto-dismiss after this many ms. Ignored when `sticky`. */
  durationMs: number;
  /** Will not auto-dismiss and cannot be swiped away. */
  sticky: boolean;
  position: ToastPosition;
}

/* ============== Modal ============== */

/** 'center' is the canonical confirm; the edges become sheets and drawers. */
export type ModalPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

interface ModalEntryBase {
  position: ModalPosition;
  closeOnOutsideClick: boolean;
  closeOnEscape: boolean;
  /** Only confirm/cancel dismisses — no outside click, no escape. */
  sticky: boolean;
  onCancel?: () => void;
}

export interface StandardModalEntry extends ModalEntryBase {
  kind: 'standard' | 'danger';
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

/**
 * Irreversible. The user types the phrase before the commit unlocks — used for
 * suspending an account and deleting a recipe, both of which affect someone
 * other than the person clicking.
 */
export interface CriticalModalEntry extends ModalEntryBase {
  kind: 'critical';
  title: ReactNode;
  description?: ReactNode;
  /** The literal string the user must type. */
  confirmPhrase: string;
  confirmPrompt: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

export interface CustomModalEntry extends ModalEntryBase {
  kind: 'custom';
  /** Arbitrary body. The service still provides the scrim and the close control. */
  body: ReactNode;
  /** Hide the X when the body carries its own dismiss. */
  hideCloseButton: boolean;
}

export type ModalEntry = StandardModalEntry | CriticalModalEntry | CustomModalEntry;

/* ============== Banner ============== */

export type BannerPosition = 'top' | 'bottom';

export interface BannerEntry {
  id: string;
  tone: FeedbackTone;
  title: ReactNode;
  description?: ReactNode;
  cta?: {
    label: string;
    onClick: () => void;
  };
  position: BannerPosition;
  /** Banners default sticky; opt out with `sticky: false` + a duration. */
  sticky: boolean;
  durationMs: number;
}

/* ============== Store ============== */

interface DrawerState {
  toasts: readonly ToastEntry[];
  banners: readonly BannerEntry[];
  modal: ModalEntry | null;
}

type Listener = () => void;

class DrawerStore {
  private state: DrawerState = { toasts: [], banners: [], modal: null };
  private listeners = new Set<Listener>();
  private nextId = 0;
  private timers = new Map<string, number>();

  getState = (): DrawerState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private set(next: Partial<DrawerState>) {
    this.state = { ...this.state, ...next };
    this.emit();
  }

  /** Cancels a pending auto-dismiss so a manual dismiss cannot fire twice. */
  private clearTimer(id: string) {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  /* ----- Toasts ----- */
  pushToast = (entry: Omit<ToastEntry, 'id'>): string => {
    const id = `t-${this.nextId++}`;
    this.set({ toasts: [...this.state.toasts, { id, ...entry }] });
    if (!entry.sticky && entry.durationMs > 0) {
      this.timers.set(id, window.setTimeout(() => this.dismissToast(id), entry.durationMs));
    }
    return id;
  };

  dismissToast = (id: string): void => {
    this.clearTimer(id);
    this.set({ toasts: this.state.toasts.filter((toast) => toast.id !== id) });
  };

  /* ----- Banners ----- */
  pushBanner = (entry: Omit<BannerEntry, 'id'>): string => {
    const id = `b-${this.nextId++}`;
    this.set({ banners: [...this.state.banners, { id, ...entry }] });
    if (!entry.sticky && entry.durationMs > 0) {
      this.timers.set(id, window.setTimeout(() => this.dismissBanner(id), entry.durationMs));
    }
    return id;
  };

  dismissBanner = (id: string): void => {
    this.clearTimer(id);
    this.set({ banners: this.state.banners.filter((banner) => banner.id !== id) });
  };

  /* ----- Modal ----- */
  openModal = (entry: ModalEntry): void => {
    this.set({ modal: entry });
  };

  closeModal = (): void => {
    this.set({ modal: null });
  };
}

export const drawerStore = new DrawerStore();
