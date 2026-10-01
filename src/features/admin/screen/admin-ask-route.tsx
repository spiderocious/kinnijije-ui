import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-ask-screen';

export default function AdminAskRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
