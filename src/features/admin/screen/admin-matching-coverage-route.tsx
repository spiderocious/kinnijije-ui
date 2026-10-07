import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-matching-coverage-screen';

export default function AdminMatchingCoverageRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
