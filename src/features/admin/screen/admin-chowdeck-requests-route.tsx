import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-chowdeck-requests-screen';

export default function AdminChowdeckRequestsRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
