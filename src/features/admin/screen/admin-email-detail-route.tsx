import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-email-detail-screen';

export default function AdminEmailDetailRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
