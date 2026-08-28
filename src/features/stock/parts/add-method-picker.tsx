import { KoboyoIcon } from '@icons';
import { cn } from '@shared/utils/cn';

import { useFeatures } from '@shared/hooks/use-features';

export type AddMethod = 'manual' | 'photo' | 'receipt';

interface AddMethodPickerProps {
  readonly onPick: (method: AddMethod) => void;
}

const METHODS: { id: AddMethod; icon: string; title: string; body: string }[] = [
  {
    id: 'manual',
    icon: 'editPencil',
    title: 'Type it',
    body: 'Start typing and pick from suggestions. Always works.',
  },
  {
    id: 'photo',
    icon: 'takingPhotoCamera',
    title: 'Photograph a shelf',
    body: 'Up to five photos of your fridge, shelf or counter. We read what is there.',
  },
  {
    id: 'receipt',
    icon: 'receipt',
    title: 'Upload a receipt',
    body: 'The fastest way to fill a kitchen after a market run.',
  },
];

/**
 * How do you want to add this?
 *
 * Typing is listed first and described as always working — the other two
 * depend on a model, and leading with the reliable one is honest.
 */
export function AddMethodPicker({ onPick }: AddMethodPickerProps) {
  const features = useFeatures();

  // A switched-off way in is REMOVED, not disabled. A greyed-out button that
  // says nothing invites somebody to keep pressing it; typing always works and
  // is always here, so there is no dead end.
  const available = METHODS.filter((method) => {
    if (method.id === 'photo') return features.upload_photo;
    if (method.id === 'receipt') return features.upload_receipt;
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      {available.map((method) => (
        <button
          key={method.id}
          type="button"
          onClick={() => {
            onPick(method.id);
          }}
          className={cn(
            'flex items-start gap-4 rounded-blade border-2 border-line bg-white p-4 text-left',
            'transition-colors hover:border-sky hover:bg-sky-soft',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky',
          )}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-blade-sm bg-sky-soft text-sky-on">
            <KoboyoIcon name={method.icon as never} size={24} alone />
          </span>
          <span>
            <span className="block font-display text-md font-extrabold text-ink">{method.title}</span>
            <span className="mt-0.5 block text-sm text-ink-2">{method.body}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
