import { useLocalSearchParams, useRouter } from 'expo-router';
import { FolderOpen, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderAction, ScreenHeader } from '@/components/layout/ScreenHeader';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { useCollectionsStore } from '@/stores/collections';
import { useFavoritesStore } from '@/stores/favorites';
import { AnimatedPressable, EmptyState, Screen, Typography } from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/listes/detail');

  const collection = useCollectionsStore((state) =>
    state.collections.find((item) => item.id === id)
  );
  const rename = useCollectionsStore((state) => state.rename);
  const removeResource = useCollectionsStore((state) => state.removeResource);
  const remove = useCollectionsStore((state) => state.remove);
  const favorites = useFavoritesStore((state) => state.items);
  const [nameDraft, setNameDraft] = useState(collection?.name ?? '');

  if (!collection) {
    return (
      <Screen>
        <ScreenHeader title="Liste" />
        <EmptyState
          icon={FolderOpen}
          title="Liste introuvable"
          description="Elle a peut‑être été supprimée."
          actionLabel="Mes listes"
          onAction={() => router.replace('/listes')}
        />
      </Screen>
    );
  }

  const rows = collection.resourceIds.map((resourceId) => {
    const fav = favorites.find((item) => item.id === resourceId);
    return {
      id: resourceId,
      title: fav?.title ?? resourceId,
      platform: fav?.platform ?? null,
    };
  });

  return (
    <Screen>
      <ScreenHeader
        title={collection.name}
        subtitle={`${collection.resourceIds.length} ressource${collection.resourceIds.length > 1 ? 's' : ''}`}
        actions={
          <HeaderAction
            label="Supprimer la liste"
            accent={colors.danger}
            onPress={() =>
              Alert.alert('Supprimer cette liste ?', collection.name, [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: () => {
                    remove(collection.id);
                    router.back();
                  },
                },
              ])
            }
          >
            <Trash2 size={16} color={colors.danger} strokeWidth={2.4} />
          </HeaderAction>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          value={nameDraft}
          onChangeText={setNameDraft}
          onBlur={() => {
            if (nameDraft.trim() && nameDraft.trim() !== collection.name) {
              rename(collection.id, nameDraft);
            }
          }}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.rename,
            { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
          ]}
        />

        {rows.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Liste vide"
            description="Ajoute une ressource depuis sa fiche (icône liste)."
            actionLabel="Catalogue"
            onAction={() => router.push('/catalogue')}
          />
        ) : (
          rows.map((row) => (
            <View
              key={row.id}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <AnimatedPressable
                onPress={() => router.push(`/ressource/${row.id}`)}
                scale={0.99}
                style={styles.rowMain}
              >
                <View style={styles.flex}>
                  <Typography variant="title" numberOfLines={2}>
                    {row.title}
                  </Typography>
                  {row.platform ? (
                    <Typography variant="caption" color="secondary">
                      {row.platform}
                    </Typography>
                  ) : null}
                </View>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => removeResource(collection.id, row.id)}
                scale={0.9}
                style={styles.delete}
              >
                <Trash2 size={15} color={colors.danger} strokeWidth={2.3} />
              </AnimatedPressable>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    gap: spacing.md,
  },
  rename: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  rowMain: {
    flex: 1,
    padding: spacing.md,
  },
  delete: {
    padding: spacing.md,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
});
