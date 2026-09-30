import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-decide-screen';

export default function AdminDecideRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
