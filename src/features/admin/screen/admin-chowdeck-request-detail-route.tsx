import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-chowdeck-request-detail-screen';

export default function AdminChowdeckRequestDetailRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
