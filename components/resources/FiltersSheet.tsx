import { Clock, Flame, RotateCcw } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { SortOrder } from '@/services/api';
import { useResourceFilters } from '@/hooks/useResources';
import { Button, Chip, ListSectionTitle, Sheet, Skeleton } from '@/ui/components';
import { platformColor, screenPadding, spacing, useColors } from '@/ui/theme';

export interface CatalogueFilters {
  platform?: string;
  category?: string;
  sort: SortOrder;
}

export interface FiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  value: CatalogueFilters;
  onChange: (filters: CatalogueFilters) => void;
}

const SORTS: { value: SortOrder; label: string; icon: typeof Clock }[] = [
  { value: 'recent', label: 'Récents', icon: Clock },
  { value: 'popular', label: 'Populaires', icon: Flame },
];

export function FiltersSheet({ visible, onClose, value, onChange }: FiltersSheetProps) {
  const colors = useColors();
  const filters = useResourceFilters();

  const activeCount = [value.platform, value.category].filter(Boolean).length;

  const toggle = (key: 'platform' | 'category', option: string) =>
    onChange({ ...value, [key]: value[key] === option ? undefined : option });

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filtres"
      subtitle={
        activeCount > 0
          ? `${activeCount} filtre${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}`
          : 'Affine le catalogue'
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.group}>
          <ListSectionTitle>Trier par</ListSectionTitle>
          <View style={styles.chips}>
            {SORTS.map(({ value: sort, label, icon: SortIcon }) => {
              const selected = value.sort === sort;
              return (
                <Chip
                  key={sort}
                  label={label}
                  selected={selected}
                  onPress={() => onChange({ ...value, sort })}
                  leading={
                    <SortIcon
                      size={13}
                      color={selected ? colors.onPrimary : colors.textSecondary}
                      strokeWidth={2.4}
                    />
                  }
                />
              );
            })}
          </View>
        </View>

        <View style={styles.group}>
          <ListSectionTitle>Console</ListSectionTitle>
          {filters.isLoading ? (
            <View style={styles.chips}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Skeleton key={index} width={72} height={30} radius={999} />
              ))}
            </View>
          ) : (
            <View style={styles.chips}>
              {filters.data?.platforms.map((platform) => (
                <Chip
                  key={platform}
                  label={platform}
                  color={platformColor(platform)}
                  selected={value.platform === platform}
                  onPress={() => toggle('platform', platform)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.group}>
          <ListSectionTitle>Catégorie</ListSectionTitle>
          {filters.isLoading ? (
            <View style={styles.chips}>
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} width={84} height={30} radius={999} />
              ))}
            </View>
          ) : (
            <View style={styles.chips}>
              {filters.data?.categories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  selected={value.category === category}
                  onPress={() => toggle('category', category)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Réinitialiser"
          variant="secondary"
          onPress={() => onChange({ sort: 'recent' })}
          leading={<RotateCcw size={16} color={colors.text} strokeWidth={2.4} />}
          style={styles.footerButton}
        />
        <Button label="Voir les résultats" onPress={onClose} style={styles.footerButton} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  group: {
    gap: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
