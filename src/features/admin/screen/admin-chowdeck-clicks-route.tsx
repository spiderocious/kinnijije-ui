import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-chowdeck-clicks-screen';

export default function AdminChowdeckClicksRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
