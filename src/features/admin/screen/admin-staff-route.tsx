import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-staff-screen';

export default function AdminStaffRoute() {
  return (
    <AdminGuard scope="staff:read">
      <Screen />
    </AdminGuard>
  );
}
