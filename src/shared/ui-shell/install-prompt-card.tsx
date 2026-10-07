import { Show } from 'meemaw';

import { KoboyoIcon, X } from '@icons';
import { useInstallPrompt } from '@shared/hooks/use-install-prompt';
import { Button } from '@ui/primitives';

/**
 * Our own install offer, in place of the browser's mini-infobar.
 *
 * WHY A CARD AND NOT A MODAL: installing is an invitation, not a decision the
 * app needs before it can continue. A modal would block somebody from the
 * thing they actually opened the app to do, and the commonest result of that
 * is a reflexive dismissal — which costs the install permanently rather than
 * for now.
 *
 * WHY THE COPY IS ABOUT THE KITCHEN AND NOT ABOUT INSTALLING: "Add to home
 * screen" describes a mechanism. "Open your kitchen in one tap" describes what
 * somebody gets. The second is the only one worth interrupting them for.
 *
 * iOS GETS INSTRUCTIONS, NOT A BUTTON. Safari has no install API at all, so a
 * button there would do nothing — the card explains the Share-sheet route
 * instead. A dead button is worse than no button.
 */
export function InstallPromptCard() {
  const { shouldOffer, canInstall, needsManualSteps, prompting, install, dismiss } =
    useInstallPrompt();

  if (!shouldOffer) return null;

  return (
    /*
     * `z-toast`: above the nav and any sticky header, below a real modal — an
     * install offer must never cover a dialog somebody has to answer.
     *
     * `pointer-events-none` on the wrapper with `auto` on the card so the
     * empty space either side stays clickable; a full-width invisible layer
     * across the bottom of every screen would swallow taps on the nav.
     */
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-toast flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
      role="region"
      aria-label="Install KinniJije"
    >
      <div className="pointer-events-auto w-full max-w-[420px] rounded-blade border-2 border-ink bg-white p-4 shadow-drop-lg">
        <div className="flex items-start gap-3">
          {/* The real mark, not a generic download glyph — this is the one
              moment the app asks to live on somebody's home screen, so it
              should look like itself. */}
          <span className="shrink-0 rounded-blade-sm border-2 border-ink bg-sky-100 p-2 text-sky-on">
            <img src="/logo-mark.svg" alt="" width={28} height={28} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-extrabold tracking-display text-ink">
              Keep your kitchen one tap away
            </p>
            <p className="mt-0.5 text-sm text-ink-2">
              <Show
                when={needsManualSteps}
                fallback={
                  <>Install KinniJije and open it like any other app. It takes a second.</>
                }
              >
                <>
                  Tap <span className="font-extrabold">Share</span>, then{' '}
                  <span className="font-extrabold">Add to Home Screen</span>.
                </>
              </Show>
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Not now"
            className="shrink-0 rounded-blade-xs border border-line p-1 text-ink-3 hover:border-ink hover:text-ink"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        {/* Three honest reasons, not a feature list. Each is something that is
            actually true of the installed app and false of the tab. */}
        <ul className="mt-3 flex flex-col gap-1.5">
          <li className="flex items-center gap-2 text-xs text-ink-2">
            <KoboyoIcon name="potStew" size={14} alone />
            Your kitchen and your week, without finding the tab again
          </li>
          <li className="flex items-center gap-2 text-xs text-ink-2">
            <KoboyoIcon name="bellNotification" size={14} alone />
            Reminders before something runs out
          </li>
          <li className="flex items-center gap-2 text-xs text-ink-2">
            <KoboyoIcon name="sparkle" size={14} alone />
            Opens full screen, no browser bars
          </li>
        </ul>

        <Show when={canInstall}>
          <div className="mt-4 flex items-center gap-2">
            <Button
              className="flex-1"
              loading={prompting}
              onClick={() => {
                // `install()` must run inside this gesture — the browser
                // refuses a prompt raised from anywhere else.
                void install();
              }}
            >
              Install
            </Button>
            <Button variant="secondary" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </Show>

        {/* iOS: the card IS the instruction, so the only control is to close it. */}
        <Show when={needsManualSteps}>
          <div className="mt-4">
            <Button variant="secondary" className="w-full" onClick={dismiss}>
              Got it
            </Button>
          </div>
        </Show>
      </div>
    </div>
  );
}
