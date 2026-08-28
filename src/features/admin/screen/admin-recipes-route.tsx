import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-recipes-screen';

export default function AdminRecipesRoute() {
  return (
    <AdminGuard>
      <Screen />
    </AdminGuard>
  );
}
