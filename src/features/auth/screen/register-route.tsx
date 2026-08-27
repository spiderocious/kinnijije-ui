import { GuestOnly } from '../parts/route-guard';
import RegisterScreen from './register-screen';

export default function RegisterRoute() {
  return (
    <GuestOnly>
      <RegisterScreen />
    </GuestOnly>
  );
}
