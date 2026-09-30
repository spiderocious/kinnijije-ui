import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-chowdeck-screen';

export default function AdminChowdeckRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
