import { Repeat, Show } from 'meemaw';

import { BlobThinking, KoboyoIcon, X, type KoboyoIconName } from '@icons';
import { cn } from '@shared/utils/cn';
import { Button } from '@ui/primitives';
import { Callout } from '@ui/feedback';

/**
 * Capture — the three ways into the kitchen.
 *
 * Visual spec: design-system/projects/kinnijije-v2/preview/54-voice-capture.html
 *                                                          55-photo-capture.html
 *                                                          56-multi-shot.html
 *                                                          237-capture-methods.html
 *                                                          238-extraction-result.html
 *                                                          240-permission-prompt.html
 *
 * **Typing always works.** Voice and photo are accelerants, never the only
 * door — if the mic is blocked, the camera is broken or the model is down, the
 * cook can still type and the product still functions. Every state here keeps
 * that escape hatch visible.
 */

export type CaptureMethod = 'type' | 'voice' | 'photo';

const METHOD_ICON: Record<CaptureMethod, KoboyoIconName> = {
  type: 'editPencil',
  voice: 'mic',
  photo: 'takingPhotoCamera',
};

const METHOD_LABEL: Record<CaptureMethod, string> = {
  type: 'Type',
  voice: 'Voice',
  photo: 'Photo',
};

export interface CaptureMethodsProps {
  readonly value: CaptureMethod;
  readonly onValueChange: (method: CaptureMethod) => void;
  /** Methods turned off by a feature flag. Typing can never be here. */
  readonly disabled?: readonly Exclude<CaptureMethod, 'type'>[];
  readonly className?: string;
}

/** The three doors. Typing is never disableable. */
export function CaptureMethods({
  value,
  onValueChange,
  disabled = [],
  className,
}: CaptureMethodsProps) {
  const methods: CaptureMethod[] = ['type', 'voice', 'photo'];

  return (
    <div className={className}>
      <div
        role="radiogroup"
        aria-label="How to add ingredients"
        className="inline-flex items-center gap-1 rounded-blade-sm border border-ink bg-paper-2 p-1"
      >
        <Repeat each={methods}>
          {(method: CaptureMethod) => {
            const off = method !== 'type' && disabled.includes(method as 'voice' | 'photo');
            const selected = value === method;
            return (
              <button
                key={method}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={off}
                onClick={() => onValueChange(method)}
                className={cn(
                  'inline-flex h-ctrl-sm items-center gap-2 rounded-blade-xs px-4 text-ctrl font-extrabold',
                  'transition-colors duration-fast',
                  'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--sky-glow)]',
                  'disabled:opacity-[0.42] disabled:cursor-not-allowed',
                  selected
                    ? 'bg-sky text-sky-onbase shadow-drop-sm'
                    : 'text-ink-2 hover:bg-white hover:text-ink',
                )}
              >
                <KoboyoIcon name={METHOD_ICON[method]} size={15} />
                {METHOD_LABEL[method]}
              </button>
            );
          }}
        </Repeat>
      </div>

      <Show when={disabled.length > 0}>
        <p className="mt-2 text-xs text-ink-3">
          {disabled.length === 2 ? 'Photo and voice are paused' : `${METHOD_LABEL[disabled[0] ?? 'voice']} is paused`}
          . Typing still works.
        </p>
      </Show>
    </div>
  );
}

export interface VoiceCaptureProps {
  readonly recording: boolean;
  readonly onStart: () => void;
  readonly onStop: () => void;
  /** What has been heard so far. */
  readonly transcript?: string;
  /** Mic blocked or unavailable. */
  readonly error?: string;
  readonly className?: string;
}

/** Hold to record. Releasing sends. */
export function VoiceCapture({
  recording,
  onStart,
  onStop,
  transcript,
  error,
  className,
}: VoiceCaptureProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <Show when={error !== undefined}>
        <Callout
          tone="caution"
          title={error ?? ''}
          body="You can still type what you have."
          className="w-full"
        />
      </Show>

      <button
        type="button"
        aria-label={recording ? 'Stop recording' : 'Hold to record'}
        aria-pressed={recording}
        disabled={error !== undefined}
        onPointerDown={onStart}
        onPointerUp={onStop}
        onPointerLeave={onStop}
        className={cn(
          'grid h-[104px] w-[104px] place-items-center rounded-round border-bold border-ink',
          'transition-[transform,background-color] duration-press',
          'focus-visible:outline-none focus-visible:shadow-[0_0_0_5px_var(--sky-glow)]',
          'disabled:opacity-[0.42] disabled:cursor-not-allowed',
          recording
            ? 'scale-105 bg-critical text-critical-on shadow-drop-crit'
            : 'bg-sky text-sky-onbase shadow-drop-lg',
        )}
      >
        <KoboyoIcon name="mic" size={40} />
      </button>

      <p className="text-sm font-extrabold text-ink-2">
        {recording ? 'Listening — release to send' : 'Hold to say what you have'}
      </p>

      <Show when={transcript !== undefined && transcript !== ''}>
        <p className="w-full rounded-blade-sm border border-line-2 bg-white px-4 py-3 text-center text-ctrl text-ink">
          “{transcript}”
        </p>
      </Show>
    </div>
  );
}

export interface CapturedShot {
  readonly id: string;
  readonly src?: string;
  readonly label: string;
}

export interface PhotoCaptureProps {
  readonly shots: readonly CapturedShot[];
  readonly onCapture: () => void;
  readonly onRemove: (id: string) => void;
  /** Extraction running. */
  readonly reading?: boolean;
  readonly error?: string;
  /** Most kitchens need two or three angles. */
  readonly maxShots?: number;
  readonly className?: string;
}

/** The multi-shot tray. One photo rarely covers a whole kitchen. */
export function PhotoCapture({
  shots,
  onCapture,
  onRemove,
  reading = false,
  error,
  maxShots = 4,
  className,
}: PhotoCaptureProps) {
  return (
    <div className={className}>
      <Show when={error !== undefined}>
        <Callout
          tone="caution"
          title={error ?? ''}
          body="Try another angle, or just type what you have."
          className="mb-3"
        />
      </Show>

      <ul className="mb-3 flex flex-wrap gap-3">
        <Repeat each={[...shots]}>
          {(shot: CapturedShot) => (
            <li key={shot.id} className="relative">
              <div className="grid h-[88px] w-[88px] place-items-center overflow-hidden rounded-blade-sm border border-ink bg-dish-fill text-dish-line">
                {shot.src !== undefined ? (
                  <img src={shot.src} alt={shot.label} className="h-full w-full object-cover" />
                ) : (
                  <KoboyoIcon name="takingPhotoCamera" size={28} />
                )}
              </div>
              <button
                type="button"
                aria-label={`Remove ${shot.label}`}
                onClick={() => onRemove(shot.id)}
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-round border border-ink bg-white text-ink shadow-drop-sm"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </li>
          )}
        </Repeat>

        <Show when={shots.length < maxShots && !reading}>
          <li>
            <button
              type="button"
              onClick={onCapture}
              className="grid h-[88px] w-[88px] place-items-center rounded-blade-sm border border-dashed border-line-2 bg-paper-2 text-ink-3 transition-colors hover:border-sky-edge hover:bg-sky-soft hover:text-sky-on focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--sky-glow)]"
            >
              <KoboyoIcon name="plus" size={24} />
            </button>
          </li>
        </Show>
      </ul>

      <Show when={reading}>
        <div className="flex items-center gap-3 rounded-blade-sm border border-grape-border bg-grape-soft px-4 py-3">
          <BlobThinking size={32} label="Reading your photo" />
          <p className="text-sm font-extrabold text-grape-onsoft">Reading your photo…</p>
        </div>
      </Show>

      <Show when={!reading && shots.length > 0}>
        <p className="text-xs text-ink-3">
          {shots.length} of {maxShots} — more angles read better than one wide shot.
        </p>
      </Show>
    </div>
  );
}

export interface ExtractedIngredient {
  readonly id: string;
  readonly name: string;
  /** The model's confidence. Low ones need confirming. */
  readonly uncertain: boolean;
}

export interface ExtractionResultProps {
  readonly items: readonly ExtractedIngredient[];
  readonly onConfirm: (ids: readonly string[]) => void;
  readonly onReject: (id: string) => void;
  readonly className?: string;
}

/**
 * What the model saw, before it goes in the basket.
 *
 * **Every extraction is reviewed, never auto-committed.** The cook confirms
 * what is theirs — which is also what makes a bad reading diagnosable rather
 * than mysterious.
 */
export function ExtractionResult({
  items,
  onConfirm,
  onReject,
  className,
}: ExtractionResultProps) {
  const certain = items.filter((item) => !item.uncertain);
  const uncertain = items.filter((item) => item.uncertain);

  return (
    <div className={className}>
      <p className="mb-3 text-sm text-ink-2">
        Found <b className="font-extrabold text-ink">{items.length}</b>{' '}
        {items.length === 1 ? 'thing' : 'things'}. Take out anything that is not right.
      </p>

      <ul className="mb-4 flex flex-wrap gap-2">
        <Repeat each={[...items]}>
          {(item: ExtractedIngredient) => (
            <li key={item.id}>
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-blade-xs border px-3 py-[6px] text-sm font-extrabold',
                  item.uncertain
                    ? 'border-dashed border-grape bg-grape-soft text-grape-onsoft'
                    : 'border-ink bg-paper-2 text-ink',
                )}
              >
                {item.name}
                {item.uncertain && <span aria-hidden="true">?</span>}
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => onReject(item.id)}
                  className="ml-1 grid h-4 w-4 place-items-center rounded-round hover:bg-ink/10"
                >
                  <X size={11} strokeWidth={3} />
                </button>
              </span>
            </li>
          )}
        </Repeat>
      </ul>

      <Show when={uncertain.length > 0}>
        <p className="mb-3 text-xs text-ink-3">
          The dashed ones are guesses — {uncertain.length}{' '}
          {uncertain.length === 1 ? 'thing was' : 'things were'} hard to make out.
        </p>
      </Show>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => onConfirm(items.map((item) => item.id))}>
          Add all {items.length}
        </Button>
        <Show when={uncertain.length > 0}>
          <Button variant="secondary" onClick={() => onConfirm(certain.map((item) => item.id))}>
            Only the {certain.length} sure ones
          </Button>
        </Show>
      </div>
    </div>
  );
}

export interface PermissionPromptProps {
  readonly kind: 'camera' | 'microphone';
  readonly onAllow: () => void;
  readonly onSkip: () => void;
}

/**
 * Asked in context, with the reason, and always skippable.
 *
 * **Never asked on first launch** — a permission prompt before a user knows what
 * the product does is the fastest way to a permanent denial.
 */
export function PermissionPrompt({ kind, onAllow, onSkip }: PermissionPromptProps) {
  const copy =
    kind === 'camera'
      ? {
          icon: 'takingPhotoCamera' as const,
          title: 'Let us use the camera?',
          body: 'Take a photo of your shelf and we will read what is in it. The photo is kept with the reading so you can check it, and deleted with your account.',
        }
      : {
          icon: 'mic' as const,
          title: 'Let us use the microphone?',
          body: 'Say what you have instead of typing it. The recording is transcribed and then discarded.',
        };

  return (
    <div className="flex flex-col items-center gap-4 rounded-blade-lg border border-line-2 bg-white p-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-blade-xs bg-sky-soft text-sky-on">
        <KoboyoIcon name={copy.icon} size={28} />
      </span>
      <h3 className="font-display text-lg font-extrabold tracking-display">{copy.title}</h3>
      <p className="max-w-[44ch] text-sm text-ink-2">{copy.body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onAllow}>Allow</Button>
        {/* Always skippable — typing still works. */}
        <Button variant="secondary" onClick={onSkip}>
          Not now, I will type
        </Button>
      </div>
    </div>
  );
}

export interface CaptureRecoveryProps {
  readonly onRetry: () => void;
  readonly onType: () => void;
}

/** The capture failed entirely. Typing is offered as an equal, not a fallback. */
export function CaptureRecovery({ onRetry, onType }: CaptureRecoveryProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-blade-lg border border-caution-border bg-caution-soft p-6 text-center">
      <KoboyoIcon name="error" size={36} className="text-caution-onsoft" alone />
      <h3 className="font-display text-md font-extrabold tracking-display text-caution-onsoft">
        We could not read that
      </h3>
      <p className="max-w-[44ch] text-sm text-ink-2">
        It happens — poor light, a busy shelf, an unusual angle. Nothing you already added has
        been lost.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" icon="takingPhotoCamera" onClick={onRetry}>
          Try another photo
        </Button>
        <Button icon="editPencil" onClick={onType}>
          Type it instead
        </Button>
      </div>
    </div>
  );
}
