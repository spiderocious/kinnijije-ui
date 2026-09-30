import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-chowdeck-cache-detail-screen';

export default function AdminChowdeckCacheDetailRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
