import { RouterProvider } from '@tanstack/react-router';

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
    </AppProvider>
  );
}
