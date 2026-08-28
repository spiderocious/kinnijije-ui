import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-dashboard-screen';

export default function AdminDashboardRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
