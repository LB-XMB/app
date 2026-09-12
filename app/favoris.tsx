import { useRouter } from 'expo-router';
import { Heart, Trash2 } from 'lucide-react-native';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderAction, ScreenHeader } from '@/components/layout/ScreenHeader';
import { ResourceRow } from '@/components/resources/ResourceRow';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { useFavoritesStore } from '@/stores/favorites';
import { AnimatedPressable, EmptyState, Screen } from '@/ui/components';
import { screenPadding, spacing, useColors } from '@/ui/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/favoris');

  const items = useFavoritesStore((state) => state.items);
  const remove = useFavoritesStore((state) => state.remove);
  const clear = useFavoritesStore((state) => state.clear);

  return (
    <Screen>
      <ScreenHeader
        title="Favoris"
        subtitle={`${items.length} ressource${items.length > 1 ? 's' : ''}`}
        actions={
          items.length > 0 ? (
            <HeaderAction label="Tout retirer" onPress={clear} accent={colors.danger}>
              <Trash2 size={16} color={colors.danger} strokeWidth={2.4} />
            </HeaderAction>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Pas encore de favori"
            description="Ajoute une ressource depuis sa fiche pour la retrouver ici, même hors ligne."
            actionLabel="Parcourir le catalogue"
            onAction={() => router.push('/catalogue')}
          />
        ) : (
          items.map((item) => (
            <ResourceRow
              key={item.id}
              resource={{
                id: item.id,
                title: item.title,
                description: '',
                category: item.category,
                platform: item.platform,
                platforms: item.platform ? [item.platform] : [],
                version: null,
                size: null,
                downloads: 0,
                logo: item.logo,
                logoVersion: item.logoVersion,
                iconFormat: null,
                author: null,
                authorAvatar: null,
                game: null,
                createdAt: item.addedAt,
              }}
              onPress={() => router.push(`/ressource/${item.id}`)}
              trailing={
                <AnimatedPressable
                  onPress={() => remove(item.id)}
                  scale={0.88}
                  style={styles.remove}
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer ${item.title}`}
                >
                  <Heart
                    size={17}
                    color={colors.danger}
                    fill={colors.danger}
                    strokeWidth={2.2}
                  />
                </AnimatedPressable>
              }
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  remove: {
    padding: spacing.xs,
  },
});
