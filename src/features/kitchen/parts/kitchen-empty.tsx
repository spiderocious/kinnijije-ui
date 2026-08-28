import { useNavigate } from '@tanstack/react-router';

import { KoboyoIcon } from '@icons';
import { ROUTES } from '@shared/constants/routes';
import { AppShell } from '@shared/ui-shell/app-shell';
import { Button } from '@ui/primitives';


/**
 * An empty kitchen.
 *
 * Camera first, typing beside it, and the skip ALWAYS visible — the pantry is
 * optional by design and suggestions work without it. Hiding the skip would
 * turn an optional feature into a wall.
 */
export function KitchenEmpty() {
  const navigate = useNavigate();

  const body = (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-blade-sm bg-sky-soft text-sky-on">
        <KoboyoIcon name="takingPhotoCamera" size={32} alone />
      </span>

      <h1 className="font-display text-2xl font-extrabold tracking-display">
        Let us see your kitchen
      </h1>

      <p className="max-w-[44ch] text-md text-ink-2">
        One photo of a shelf or inside your fridge. We will read what is there and you can fix
        anything we get wrong.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          size="lg"
          icon="takingPhotoCamera"
          onClick={() => {
            void navigate({ to: ROUTES.STOCK_ADD });
          }}
        >
          Photograph a shelf
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            void navigate({ to: ROUTES.STOCK_ADD });
          }}
        >
          Add a few by hand
        </Button>
      </div>

      <button
        type="button"
        onClick={() => {
          void navigate({ to: ROUTES.SUGGESTIONS });
        }}
        className="text-sm text-ink-3 underline-offset-2 hover:underline"
      >
        You can skip this — suggestions work without it.
      </button>
    </div>
  );

  return (
    <AppShell title="Your kitchen" active="kitchen" maxWidth="max-w-[560px]">
      <div className="grid min-h-[60vh] place-items-center">{body}</div>
    </AppShell>
  );
}
