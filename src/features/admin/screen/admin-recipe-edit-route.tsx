import { AdminGuard } from '../parts/admin-guard';

import Screen from './admin-recipe-edit-screen';

export default function AdminRecipeEditRoute() {
  return (
    // Editing needs the write scope: somebody who can only read recipes gets
    // the honest "not allowed" card rather than a form whose save 403s.
    <AdminGuard scope="recipes:write">
      <Screen />
    </AdminGuard>
  );
}
