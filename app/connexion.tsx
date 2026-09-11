import { SignInView } from '@/components/auth/SignInView';
import { useScreenTracking } from '@/hooks/useScreenTracking';

/** Onboarding step: sign in, or choose to stay signed out. */
export default function SignInScreen() {
  useScreenTracking('/connexion');
  return <SignInView mode="onboarding" />;
}
