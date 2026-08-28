import { useEffect } from 'react';

/**
 * Keeps the screen awake while cooking.
 *
 * A phone propped against a bag of rice that dims every thirty seconds is
 * useless, and wiping your hands to tap it is the whole problem.
 *
 * Wake Lock is not supported everywhere and can be revoked by the system at
 * any moment, so every call is guarded — an unsupported browser simply behaves
 * as it did before rather than throwing.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    if (!('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async (): Promise<void> => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel = lock;
      } catch {
        // Denied or unsupported. Cooking still works; the screen just sleeps.
      }
    };

    void request();

    // The system drops the lock whenever the tab is hidden — switching apps to
    // check a message would otherwise silently end it for the rest of the cook.
    const onVisibility = (): void => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release();
    };
  }, [active]);
}
