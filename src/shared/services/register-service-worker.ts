/**
 * Registers the service worker that makes the app installable.
 *
 * The worker itself caches nothing — see `public/sw.js`. It exists because a
 * browser will not offer "Install app" without one, and nothing more.
 *
 * NEVER THROWS. A failed registration costs the install prompt; it must not
 * cost somebody the app. So every failure path is a log, never a rejection
 * that could surface as a blank screen.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  /**
   * Registered after `load` rather than during boot.
   *
   * Registration competes with the first render for the network, and the
   * install prompt is worth nothing if the app it is offering feels slow to
   * open.
   */
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /**
       * Swallowed deliberately. This fails legitimately in several ordinary
       * situations — an insecure origin during local development over plain
       * HTTP, a browser with workers disabled, a private window — and in all
       * of them the app itself is fine and only the install offer is lost.
       */
    });
  });
}
