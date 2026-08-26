import { useState } from 'react';
import { Repeat } from 'meemaw';

import { Button } from '@ui/primitives';
import { DrawerService, type FeedbackTone, type ToastPosition } from '@ui/drawer';
import { Input } from '@ui/inputs';

import { Api, Demo, Note, Row, Rule, Section, Specimen } from './preview-canvas';

/**
 * Visual spec: design-system/projects/kinnijije-v2/preview/150-toast.html
 *                                                          149-banner-system.html
 *                                                          163-modal-confirm.html
 *                                                          164-modal-critical.html
 *                                                          166-overlay-contract.html
 */

const TONES: FeedbackTone[] = ['neutral', 'info', 'success', 'caution', 'critical', 'ai'];

const POSITIONS: ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const TONE_MESSAGE: Record<FeedbackTone, string> = {
  neutral: 'Draft saved.',
  info: 'Three meals ready.',
  success: 'Added to your favourites.',
  caution: 'Two ingredients are running low.',
  critical: 'Could not reach the kitchen.',
  ai: 'The chef wrote this one.',
};

export function DrawerPart() {
  const [log, setLog] = useState<string[]>([]);

  function record(entry: string) {
    setLog((current) => [entry, ...current].slice(0, 6));
  }

  return (
    <Specimen
      title="DrawerService"
      spec="150-toast · 149-banner-system · 163-modal-confirm · 164-modal-critical · 166-overlay-contract"
      description="The imperative overlay layer — toasts, banners and modals callable from anywhere, with no props threaded through the tree."
    >
      <Rule>
        Mount <code>&lt;ToastHost /&gt;</code>, <code>&lt;BannerHost /&gt;</code> and{' '}
        <code>&lt;ModalHost /&gt;</code> <b>once</b> at the app root — they already are, in{' '}
        <code>app.tsx</code>. Everything else calls the singleton. The store is a plain pub-sub
        read through <code>useSyncExternalStore</code>: no Zustand, no Redux, and callable from
        outside a component tree entirely.
      </Rule>

      <Section label="TOASTS — every tone">
        <Demo>
          <Row>
            <Repeat each={TONES}>
              {(tone: FeedbackTone) => (
                <Button
                  key={tone}
                  variant="secondary"
                  size="sm"
                  onClick={() => DrawerService.toast(TONE_MESSAGE[tone], { tone })}
                >
                  {tone}
                </Button>
              )}
            </Repeat>
          </Row>
          <Note>
            Drag a toast sideways to dismiss it. <code>ai</code> is grape — provenance, not
            severity.
          </Note>
        </Demo>
      </Section>

      <Section label="TOASTS — all six zones">
        <Demo>
          <Row>
            <Repeat each={POSITIONS}>
              {(position: ToastPosition) => (
                <Button
                  key={position}
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    DrawerService.toast(position, { position, tone: 'info' })
                  }
                >
                  {position}
                </Button>
              )}
            </Repeat>
          </Row>
        </Demo>
      </Section>

      <Section label="TOASTS — with an action, and sticky">
        <Demo>
          <Row>
            <Button
              variant="secondary"
              onClick={() =>
                DrawerService.toast('Removed from favourites.', {
                  tone: 'neutral',
                  action: { label: 'Undo', onClick: () => record('Undo pressed') },
                })
              }
            >
              With an undo
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                DrawerService.toast('Suggestions are paused.', { tone: 'caution', sticky: true })
              }
            >
              Sticky (no auto-dismiss)
            </Button>
          </Row>
          <Note>A sticky toast cannot be swiped away — only its own control dismisses it.</Note>
        </Demo>
      </Section>

      <Section label="BANNERS — a state, not an event">
        <Demo>
          <Row>
            <Button
              variant="secondary"
              onClick={() =>
                DrawerService.banner('You are offline', {
                  tone: 'caution',
                  description: 'Your saved recipes still work. New suggestions need a connection.',
                })
              }
            >
              Offline
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                DrawerService.banner('Suggestions are paused', {
                  tone: 'info',
                  description: 'We have turned this off briefly.',
                  cta: { label: 'Learn why', onClick: () => record('Banner CTA pressed') },
                })
              }
            >
              With a CTA
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                DrawerService.banner('Saved to your kitchen', {
                  tone: 'success',
                  position: 'bottom',
                  sticky: false,
                  durationMs: 3200,
                })
              }
            >
              Bottom, auto-dismiss
            </Button>
          </Row>
          <Note>
            A banner is for a state that <b>persists</b> — offline, a paused feature. A toast is
            for something that just happened. Using a toast for a persistent state means the user
            misses it if they look away for four seconds.
          </Note>
        </Demo>
      </Section>

      <Section label="MODALS — confirm, destructive, critical">
        <Demo>
          <Row>
            <Button
              variant="secondary"
              onClick={() =>
                DrawerService.confirm('Replace your basket?', {
                  description: 'The six things you added will be cleared.',
                  confirmLabel: 'Replace',
                  onConfirm: () => record('Basket replaced'),
                })
              }
            >
              Confirm
            </Button>

            <Button
              variant="secondary"
              destructive
              onClick={() =>
                DrawerService.confirm('Delete this recipe?', {
                  description: 'It will be removed from every cook’s favourites.',
                  destructive: true,
                  onConfirm: () => record('Recipe deleted'),
                })
              }
            >
              Destructive confirm
            </Button>

            <Button
              destructive
              onClick={() =>
                DrawerService.critical('Suspend this account?', {
                  description:
                    'They will not be able to sign in. Their saved recipes are kept.',
                  confirmPhrase: 'SUSPEND',
                  onConfirm: () => record('Account suspended'),
                })
              }
            >
              Critical (type to confirm)
            </Button>
          </Row>
          <Note>
            The critical modal never closes on an outside click — a stray tap must not be able to
            dismiss the one thing that made the user read. Escape still works, because backing out
            of something irreversible must always be possible.
          </Note>
        </Demo>
      </Section>

      <Section label="MODALS — the same store backs sheets and drawers">
        <Demo>
          <Row>
            <Repeat each={['bottom', 'left', 'right', 'top'] as const}>
              {(position: 'bottom' | 'left' | 'right' | 'top') => (
                <Button
                  key={position}
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    DrawerService.openModal(
                      <div>
                        <h2 className="font-display text-xl font-extrabold tracking-display">
                          {position} sheet
                        </h2>
                        <p className="mt-2 text-base text-ink-2">
                          Only <code>position</code> differs from a centred confirm. That is why
                          there is no separate Sheet service.
                        </p>
                        <div className="mt-5">
                          <Input placeholder="Anything can go in here" aria-label="Demo field" />
                        </div>
                      </div>,
                      { position },
                    )
                  }
                >
                  {position}
                </Button>
              )}
            </Repeat>
          </Row>
        </Demo>
      </Section>

      <Section label="WHAT FIRED">
        <Demo tone="plain">
          {log.length === 0 ? (
            <p className="text-sm text-ink-3">Nothing yet — press something above.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              <Repeat each={log}>
                {(entry: string, index: number) => (
                  <li key={`${entry}-${index}`} className="font-mono text-xs text-ink-2">
                    {entry}
                  </li>
                )}
              </Repeat>
            </ul>
          )}
        </Demo>
      </Section>

      <Section label="API">
        <Api>{`DrawerService.toast(message, { tone, durationMs, sticky, position, action })
DrawerService.banner(title, { tone, description, cta, position, sticky, durationMs })
DrawerService.confirm(title, { onConfirm, description, destructive, confirmLabel, ... })
DrawerService.critical(title, { onConfirm, confirmPhrase, confirmPrompt, ... })
DrawerService.openModal(<body/>, { position, closeOnOutsideClick, closeOnEscape, ... })
DrawerService.closeModal() / .dismissToast(id) / .dismissBanner(id)

// mount <ToastHost/> <BannerHost/> <ModalHost/> ONCE at the app root
// ONE modal at a time — a stack of modals is a flow that should be a screen
// critical defaults closeOnOutsideClick: false`}</Api>
      </Section>
    </Specimen>
  );
}
