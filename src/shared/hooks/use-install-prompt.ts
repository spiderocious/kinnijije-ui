import { useCallback, useEffect, useState } from 'react';

/**
 * The install prompt, captured so it can be offered on our own terms.
 *
 * HOW THE BROWSER EVENT WORKS, because it is unusual: Chrome fires
 * `beforeinstallprompt` when the app becomes installable. Calling
 * `preventDefault()` suppresses the browser's own mini-infobar and hands us
 * the event, which we may then `prompt()` exactly ONCE, and only from a user
 * gesture. After that the event is spent — so it is held in state rather than
 * re-derived, and dropped once used.
 *
 * SAFARI AND FIREFOX NEVER FIRE IT. On iOS, installing is Share → Add to Home
 * Screen and there is no API for it at all. So `canInstall` is false there and
 * the UI says what to do instead rather than showing a button that cannot
 * work — a dead install button is worse than no install button.
 */

/** The event is not in TypeScript's DOM lib, so it is described here. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

/** Remembers a dismissal so the prompt is not shown on every visit. */
const DISMISSED_KEY = 'kj.install.dismissed';
/**
 * How long a "not now" lasts.
 *
 * Two weeks: long enough not to nag, short enough that somebody who declined
 * before trying the app properly gets asked again. Permanent suppression would
 * mean a single reflexive dismissal costs the install forever.
 */
const DISMISSED_FOR_MS = 14 * 24 * 60 * 60 * 1000;

function dismissedRecently(): boolean {
  try {
    const stored = window.localStorage.getItem(DISMISSED_KEY);
    if (stored === null) return false;
    const at = Number(stored);
    if (Number.isNaN(at)) return false;
    return Date.now() - at < DISMISSED_FOR_MS;
  } catch {
    // Private mode, or storage blocked. Treat as "not dismissed" and let the
    // prompt show — the alternative is suppressing it for the people whose
    // browsers we can read least about.
    return false;
  }
}

/** Already installed? Then there is nothing to offer. */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // The standard check, plus iOS Safari's own non-standard one.
  const displayMode = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone =
    'standalone' in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return displayMode || iosStandalone;
}

/** iOS has no install API — it needs instructions, not a button. */
function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent;
  const iosDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as a Mac, so touch points are the giveaway.
  const iPadOs = ua.includes('Macintosh') && window.navigator.maxTouchPoints > 1;
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);

  return (iosDevice || iPadOs) && webkit;
}

export interface InstallPrompt {
  /** A real prompt is available and `install()` will work. */
  readonly canInstall: boolean;
  /** Running as an installed app already. */
  readonly installed: boolean;
  /** iOS: no API, so show the Share-sheet instructions instead. */
  readonly needsManualSteps: boolean;
  /** True once the browser dialog is open, so the UI can wait. */
  readonly prompting: boolean;
  /** Fires the browser's dialog. Must be called from a user gesture. */
  readonly install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  /** Hides our UI and remembers not to ask again for a fortnight. */
  readonly dismiss: () => void;
  /** Our own UI should be visible. */
  readonly shouldOffer: boolean;
}

export function useInstallPrompt(): InstallPrompt {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [dismissed, setDismissed] = useState(() => dismissedRecently());
  const [prompting, setPrompting] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (raw: Event): void => {
      // Suppress the browser's mini-infobar so our own UI is the only offer —
      // two prompts competing is worse than either alone.
      raw.preventDefault();
      setEvent(raw as BeforeInstallPromptEvent);
    };

    /**
     * `appinstalled` fires however the install happened, including through the
     * browser's own menu. Listening means our UI disappears even when it was
     * not the thing that triggered the install.
     */
    const onInstalled = (): void => {
      setInstalled(true);
      setEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (event === null) return 'unavailable';

    setPrompting(true);
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;

      /**
       * The event is spent either way — it cannot be prompted twice. Dropping
       * it is what stops a second click firing nothing and looking broken.
       */
      setEvent(null);

      // A decline is remembered, so the banner does not reappear immediately
      // after somebody said no in the browser's own dialog.
      if (outcome === 'dismissed') {
        try {
          window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        } catch {
          // Storage unavailable; the banner will return next visit. Acceptable.
        }
        setDismissed(true);
      }

      return outcome;
    } catch {
      // The browser refused the prompt — usually because the call was not
      // inside a user gesture. Keep the event so a real click can retry.
      return 'unavailable';
    } finally {
      setPrompting(false);
    }
  }, [event]);

  const dismiss = useCallback((): void => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Nothing to do. The banner returns next visit.
    }
    setDismissed(true);
  }, []);

  const needsManualSteps = !installed && event === null && isIosSafari();
  const canInstall = !installed && event !== null;

  return {
    canInstall,
    installed,
    needsManualSteps,
    prompting,
    install,
    dismiss,
    // Never offered to somebody already running the installed app, and not
    // again for a fortnight after a decline.
    shouldOffer: !installed && !dismissed && (canInstall || needsManualSteps),
  };
}
