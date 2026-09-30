import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-chowdeck-cache-screen';

export default function AdminChowdeckCacheRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
