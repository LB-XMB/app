import { useRouter } from 'expo-router';
import { Compass } from 'lucide-react-native';

import { EmptyState, Screen } from '@/ui/components';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen>
      <EmptyState
        icon={Compass}
        title="Page introuvable"
        description="Ce lien ne mène nulle part dans l’application."
        actionLabel="Revenir à l’accueil"
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
