import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-notifications-screen';

export default function AdminNotificationsRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
