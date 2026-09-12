import { useRouter } from 'expo-router';
import { FolderOpen, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderAction, ScreenHeader } from '@/components/layout/ScreenHeader';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { useCollectionsStore } from '@/stores/collections';
import {
  AnimatedPressable,
  EmptyState,
  Screen,
  Typography,
} from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

export default function ListsScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/listes');

  const collections = useCollectionsStore((state) => state.collections);
  const create = useCollectionsStore((state) => state.create);
  const remove = useCollectionsStore((state) => state.remove);
  const [draft, setDraft] = useState('');

  const onCreate = () => {
    if (!draft.trim()) return;
    const id = create(draft);
    setDraft('');
    router.push(`/listes/${id}`);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Mes listes"
        subtitle="Collections locales"
        actions={
          <HeaderAction label="Créer" onPress={onCreate}>
            <Plus size={18} color={colors.primary} strokeWidth={2.4} />
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
        <View style={[styles.createRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Nom de la liste"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
            onSubmitEditing={onCreate}
          />
          <AnimatedPressable
            onPress={onCreate}
            disabled={!draft.trim()}
            scale={0.94}
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
          >
            <Plus size={18} color={colors.onPrimary} strokeWidth={2.4} />
          </AnimatedPressable>
        </View>

        {collections.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Aucune liste"
            description="Crée une liste pour regrouper des ressources hors ligne, sans compte."
          />
        ) : (
          collections.map((collection) => (
            <View
              key={collection.id}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <AnimatedPressable
                onPress={() => router.push(`/listes/${collection.id}`)}
                scale={0.99}
                style={styles.rowMain}
              >
                <FolderOpen size={20} color={colors.primary} strokeWidth={2.2} />
                <View style={styles.flex}>
                  <Typography variant="title">{collection.name}</Typography>
                  <Typography variant="caption" color="secondary">
                    {collection.resourceIds.length} ressource
                    {collection.resourceIds.length > 1 ? 's' : ''}
                  </Typography>
                </View>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() =>
                  Alert.alert('Supprimer cette liste ?', collection.name, [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Supprimer',
                      style: 'destructive',
                      onPress: () => remove(collection.id),
                    },
                  ])
                }
                scale={0.9}
                style={styles.delete}
              >
                <Trash2 size={16} color={colors.danger} strokeWidth={2.3} />
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
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  delete: {
    padding: spacing.md,
  },
  flex: {
    flex: 1,
  },
});
