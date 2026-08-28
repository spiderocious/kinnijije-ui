import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-emails-screen';

export default function AdminEmailsRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
