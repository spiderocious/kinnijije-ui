import { RouteGuard } from '@features/auth';

import Screen from './favourites-screen';

export default function FavouritesRoute() {
  return (
    <RouteGuard>
      <Screen />
    </RouteGuard>
  );
}
