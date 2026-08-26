/**
 * The imperative overlay layer.
 *
 * Mount the three hosts ONCE at the app root, then call `DrawerService` from
 * anywhere — no props threaded through the tree, no context to be inside of.
 */
export { DrawerService } from './drawer-service';
export type {
  ToastOptions,
  BannerOptions,
  ConfirmOptions,
  CriticalOptions,
  CustomModalOptions,
} from './drawer-service';

export { ToastHost } from './toast-host';
export { BannerHost } from './banner-host';
export { ModalHost } from './modal-host';

export type {
  FeedbackTone,
  ToastPosition,
  BannerPosition,
  ModalPosition,
} from './drawer-store';
