import { RouterProvider } from '@tanstack/react-router';

import { InstallPromptCard } from '@shared/ui-shell/install-prompt-card';
import { BannerHost, ModalHost, ToastHost } from '@ui/drawer';

import { AppProvider } from './app.provider';
import { router } from './app.router';

export function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />

      {/* The imperative overlay layer. Mounted ONCE, here — everything else
          reaches it through DrawerService, from anywhere. */}
      <ToastHost />
      <BannerHost />
      <ModalHost />

      {/* The install offer. Renders nothing unless the browser has actually
          made the app installable, so it costs nothing where it cannot work. */}
      <InstallPromptCard />
    </AppProvider>
  );
}
