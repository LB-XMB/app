import { FolderPlus, ListPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useCollectionsStore } from '@/stores/collections';
import { AnimatedPressable, Button, Sheet, Typography } from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

export interface AddToListSheetProps {
  visible: boolean;
  onClose: () => void;
  resourceId: string;
  resourceTitle: string;
}

/** Pick or create a local collection for a resource. */
export function AddToListSheet({
  visible,
  onClose,
  resourceId,
  resourceTitle,
}: AddToListSheetProps) {
  const colors = useColors();
  const collections = useCollectionsStore((state) => state.collections);
  const create = useCollectionsStore((state) => state.create);
  const toggleResource = useCollectionsStore((state) => state.toggleResource);
  const [draft, setDraft] = useState('');

  const onCreate = () => {
    const id = create(draft);
    toggleResource(id, resourceId);
    setDraft('');
    Alert.alert('Ajouté', `${resourceTitle} a été ajouté à la nouvelle liste.`);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Ajouter à une liste" maxHeightRatio={0.7}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Typography variant="caption" color="secondary">
          Listes locales sur cet appareil — pas de sync compte.
        </Typography>

        {collections.map((collection) => {
          const inList = collection.resourceIds.includes(resourceId);
          return (
            <AnimatedPressable
              key={collection.id}
              onPress={() => {
                const added = toggleResource(collection.id, resourceId);
                Alert.alert(
                  added ? 'Ajouté' : 'Retiré',
                  added
                    ? `${resourceTitle} → ${collection.name}`
                    : `${resourceTitle} retiré de ${collection.name}`
                );
                onClose();
              }}
              scale={0.985}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <ListPlus size={18} color={inList ? colors.success : colors.primary} strokeWidth={2.3} />
              <View style={styles.flex}>
                <Typography variant="title">{collection.name}</Typography>
                <Typography variant="caption" color="secondary">
                  {collection.resourceIds.length} ressource
                  {collection.resourceIds.length > 1 ? 's' : ''}
                  {inList ? ' · déjà dedans' : ''}
                </Typography>
              </View>
            </AnimatedPressable>
          );
        })}

        <View style={[styles.create, { borderColor: colors.border }]}>
          <FolderPlus size={18} color={colors.primary} strokeWidth={2.3} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Nouvelle liste…"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
          />
          <Button
            label="Créer"
            size="small"
            fullWidth={false}
            disabled={!draft.trim()}
            onPress={onCreate}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  create: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
