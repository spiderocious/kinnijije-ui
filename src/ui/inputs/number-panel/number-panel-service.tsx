import { DrawerService } from '@ui/drawer';

import { NumberPanelBody, type NumberPanelRequest } from './number-panel';

/**
 * `NumberPanel.ask()` — the imperative API from §03.
 *
 * WHY IMPERATIVE AND PROMISE-RETURNING: a caller awaits a value instead of
 * managing modal state. Without it every numeric row in the product would
 * need its own `open`/`onSubmit`/`onCancel` triple, and the configure screen
 * alone has five of them.
 *
 *   const n = await NumberPanel.ask({ title: 'Cooking for', … })
 *   // null when dismissed — the caller keeps its previous value
 *
 * RESPONSIVE BEHAVIOUR IS INHERITED, not reinvented: `DrawerService`'s store
 * already treats `position: 'bottom'` as a sheet on mobile and a centred panel
 * on wider screens, which is exactly what NP·1 and NP·3 describe.
 */
export const NumberPanel = {
  /**
   * Opens the panel and resolves with the value, or null if dismissed.
   *
   * Resolving null rather than rejecting on dismissal is deliberate:
   * cancelling is an ordinary outcome, not an error, and making callers wrap
   * every `ask` in try/catch to handle "they changed their mind" would be
   * noise at every call site.
   */
  ask(request: NumberPanelRequest): Promise<number | null> {
    return new Promise<number | null>((resolve) => {
      /**
       * Guards against resolving twice.
       *
       * Both the Done path and the dismiss path can fire — tapping Done closes
       * the modal, which triggers `onClose` as well. A promise resolved twice
       * is harmless but the second value would be a spurious null, so the
       * first answer wins.
       */
      let settled = false;
      const settle = (value: number | null): void => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      DrawerService.openModal(
        <NumberPanelBody
          request={request}
          onDone={(value) => {
            settle(value);
            DrawerService.closeModal();
          }}
          onCancel={() => {
            settle(null);
            DrawerService.closeModal();
          }}
        />,
        {
          // A sheet on phones, a centred modal on desktop — one position, the
          // host handles both.
          position: 'bottom',
          // The panel has its own Done and Cancel, so the service's corner X
          // would be a third way out of a two-answer control.
          hideCloseButton: true,
          // Dismissing is non-destructive by design: the caller keeps its
          // previous value, so an outside tap or Escape is safe.
          closeOnOutsideClick: true,
          closeOnEscape: true,
          onClose: () => {
            settle(null);
          },
        },
      );
    });
  },
} as const;

export type { NumberPanelRequest, NumberFormat } from './number-panel';
