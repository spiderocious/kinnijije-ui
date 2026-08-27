import { useNavigate } from '@tanstack/react-router';

import { useSession, useSignOut } from '@features/auth';
import { ROUTES } from '@shared/constants/routes';
import { DESKTOP_QUERY, useMediaQuery } from '@shared/hooks/use-media-query';
import { Figure } from '@ui/display';
import { Dock } from '@ui/primitives';
import { AppBar, TabBar } from '@ui/navigation';
import { Avatar, Card } from '@ui/structure';
import { SuggestCTA } from '@ui/domain';

import { useKitchen } from '../hooks/use-kitchen';
import { KitchenBasket } from '../parts/kitchen-basket';
import { KitchenCapture } from '../parts/kitchen-capture';
import { DESKTOP_NAV, PHONE_NAV } from '../parts/kitchen-nav';
import { KitchenSidebar } from '../parts/kitchen-sidebar';

/**
 * Home. What a signed-in cook opens by default.
 *
 * The scenes take a `frame` prop because the viewer renders phone and desktop
 * side by side. A real screen has one viewport, so the same choice is made from
 * a media query — and the difference is a genuinely different composition, not
 * a class swap: the desktop gains a sidebar and an aside that the phone has no
 * room for.
 */
export default function KitchenScreen() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { user } = useSession();
  const signOut = useSignOut();
  const navigate = useNavigate();

  const kitchen = useKitchen();

  const suggest = () => {
    // The suggestions screen is the next unit of work; until it exists this
    // deliberately does nothing rather than routing somewhere broken.
  };

  const capture = <KitchenCapture onAdd={kitchen.add} />;

  const basket = (
    <KitchenBasket
      items={kitchen.items}
      recent={kitchen.recent}
      onAdd={kitchen.add}
      onRemove={kitchen.remove}
    />
  );

  const cta =
    kitchen.items.length === 0 ? (
      <SuggestCTA
        ingredientCount={0}
        state="disabled"
        disabledReason="Add at least one ingredient"
      />
    ) : (
      <SuggestCTA ingredientCount={kitchen.items.length} onSuggest={suggest} />
    );

  if (isDesktop) {
    return (
      <div className="flex min-h-dvh bg-ground">
        <KitchenSidebar items={DESKTOP_NAV} active="kitchen" onSignOut={signOut} />

        <main className="flex-1 px-8 py-8">
          <h1 className="mb-6 font-display text-3xl font-extrabold tracking-display">
            What is in your kitchen?
          </h1>

          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div>
              {capture}
              <div className="mt-6">{basket}</div>
            </div>

            {/* The makeable count only fits here — that is what earns the width. */}
            <aside className="flex flex-col gap-4">
              <Card variant="quiet">
                <p className="text-sm text-ink-2">From your kitchen you could make</p>
                {/* Honest placeholder: the suggestion engine does not exist yet,
                    so this shows the basket size rather than inventing a number. */}
                <Figure value={kitchen.items.length} size="3xl" />
                <p className="text-sm text-ink-2">
                  {kitchen.items.length === 1 ? 'ingredient' : 'ingredients'} ready
                </p>
              </Card>
              {cta}
            </aside>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ground pb-[132px]">
      <AppBar
        title="Kinnijije"
        action={
          <button
            type="button"
            onClick={() => {
              void navigate({ to: ROUTES.KITCHEN });
            }}
            aria-label="Your account"
          >
            <Avatar name={user?.email ?? 'you'} size={30} />
          </button>
        }
      />

      <div className="flex-1 px-5 py-5">
        <h1 className="mb-4 font-display text-2xl font-extrabold tracking-display">
          What is in your kitchen?
        </h1>
        {capture}
        <div className="mt-6">{basket}</div>
      </div>

      <Dock>
        <Dock.Actions>
          <Dock.Primary>{cta}</Dock.Primary>
        </Dock.Actions>
      </Dock>

      <TabBar items={PHONE_NAV} value="kitchen" onValueChange={() => undefined} />
    </div>
  );
}
