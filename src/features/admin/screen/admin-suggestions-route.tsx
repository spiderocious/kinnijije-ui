import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-suggestions-screen';

export default function AdminSuggestionsRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
