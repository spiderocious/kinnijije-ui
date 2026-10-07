import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-matching-screen';

export default function AdminMatchingRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
