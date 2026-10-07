import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-timetable-detail-screen';

export default function AdminTimetableDetailRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
