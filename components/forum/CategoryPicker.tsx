import { ScrollView, StyleSheet, View } from 'react-native';

import type { ForumCategory } from '@/services/api';
import { Chip } from '@/ui/components';
import { spacing } from '@/ui/theme';

export interface CategoryPickerProps {
  categories: ForumCategory[];
  /** `null` means every category. */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Adds an « Toutes » chip at the start of the list. */
  allowAll?: boolean;
  /** Wraps chips instead of scrolling them horizontally. */
  wrap?: boolean;
}

/** Category filter used by the thread list and by the composer. */
export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
  allowAll = false,
  wrap = false,
}: CategoryPickerProps) {
  const chips = (
    <>
      {allowAll ? (
        <Chip
          label="Toutes"
          selected={selectedId === null}
          onPress={() => onSelect(null)}
          size="small"
        />
      ) : null}
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          color={category.color ?? undefined}
          selected={selectedId === category.id}
          onPress={() => onSelect(category.id)}
          size="small"
        />
      ))}
    </>
  );

  if (wrap) {
    return <View style={styles.wrap}>{chips}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
