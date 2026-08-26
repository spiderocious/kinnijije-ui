import { RouterProvider } from '@tanstack/react-router';

import { AppProvider } from './app.provider';
import { router } from './app.router';

export function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
