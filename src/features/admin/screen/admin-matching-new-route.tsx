import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-matching-new-screen';

export default function AdminMatchingNewRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
