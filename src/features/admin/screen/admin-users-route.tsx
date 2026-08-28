import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-users-screen';

export default function AdminUsersRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
