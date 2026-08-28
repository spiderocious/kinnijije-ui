import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-user-detail-screen';

export default function AdminUserDetailRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
