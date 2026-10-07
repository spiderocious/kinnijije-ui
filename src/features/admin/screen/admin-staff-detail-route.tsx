import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-staff-detail-screen';

export default function AdminStaffDetailRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
