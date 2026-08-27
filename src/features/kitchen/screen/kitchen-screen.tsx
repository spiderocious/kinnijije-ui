import { useSession } from '@features/auth';
import { useSignOut } from '@features/auth';
import { KoboyoIcon } from '@icons';
import { Button } from '@ui/primitives';
import { Card } from '@ui/structure';

/**
 * A placeholder landing spot for a signed-in, onboarded cook.
 *
 * The real kitchen — capture, suggestions, the standing pantry — is the next
 * unit of work. This exists so the redirect after onboarding has somewhere
 * honest to go, and it says plainly that it is not finished rather than
 * pretending to be an empty state.
 */
export default function KitchenScreen() {
  const { user } = useSession();
  const signOut = useSignOut();

  return (
    <div className="min-h-dvh bg-ground">
      <div className="mx-auto max-w-[560px] px-5 py-10 sm:px-6">
        <KoboyoIcon name="cookingPot" size={48} className="text-sky" alone />

        <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-display sm:text-3xl">
          You are all set{user !== null ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-2 text-md text-ink-2">
          Your kitchen is saved. The suggestion engine is the next thing being built — this
          screen is a placeholder, not the finished product.
        </p>

        <Card variant="quiet" className="mt-7">
          <p className="text-xs font-extrabold uppercase tracking-overline text-ink-3">
            What you told us
          </p>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-2">Cuisines</dt>
              <dd className="text-right font-extrabold text-ink">
                {user?.prefs.cuisines.join(', ') || '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-2">Difficulty</dt>
              <dd className="text-right font-extrabold text-ink">{user?.prefs.difficulty ?? '—'}</dd>
            </div>
          </dl>
        </Card>

        <Button variant="secondary" size="lg" className="mt-7" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
