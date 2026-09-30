import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-chowdeck-places-screen';

export default function AdminChowdeckPlacesRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
