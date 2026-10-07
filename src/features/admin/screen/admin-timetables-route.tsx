import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-timetables-screen';

export default function AdminTimetablesRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
