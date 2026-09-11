import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LayoutGrid, List as ListIcon, PackageSearch, SlidersHorizontal, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ResourceCard } from '@/components/resources/ResourceCard';
import { ResourceRow } from '@/components/resources/ResourceRow';
import {
  ResourceCardSkeleton,
  ResourceRowSkeleton,
} from '@/components/resources/ResourceSkeleton';
import { FiltersSheet, type CatalogueFilters } from '@/components/resources/FiltersSheet';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResourcesInfinite } from '@/hooks/useResources';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import type { Resource, SortOrder } from '@/services/api';
import { useSettingsStore } from '@/stores/settings';
import {
  AnimatedPressable,
  Chip,
  EmptyState,
  ErrorState,
  Screen,
  SearchField,
  Typography,
} from '@/ui/components';
import { platformColor, screenPadding, spacing, tabBarHeight, tabBarInset, useColors } from '@/ui/theme';

/** Half of the space between two grid columns. */
const GRID_GUTTER = spacing.md / 2;

export default function CatalogueScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ sort?: string; platform?: string; category?: string }>();
  useScreenTracking('/catalogue');

  const layout = useSettingsStore((state) => state.catalogueLayout);
  const setLayout = useSettingsStore((state) => state.setCatalogueLayout);

  const [search, setSearch] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<CatalogueFilters>({
    sort: params.sort === 'popular' ? 'popular' : 'recent',
    platform: params.platform,
    category: params.category,
  });

  const debouncedSearch = useDebouncedValue(search, 400);

  const query = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      platform: filters.platform,
      category: filters.category,
      sort: filters.sort as SortOrder,
    }),
    [debouncedSearch, filters]
  );

  const {
    items,
    total,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useResourcesInfinite(query);

  const isGrid = layout === 'grid';

  const renderItem = useCallback(
    ({ item, index }: { item: Resource; index: number }) =>
      isGrid ? (
        // FlashList has no column gap, so each cell pads its own gutter.
        <View style={styles.gridCell}>
          <ResourceCard
            resource={item}
            delay={Math.min(index, 8) * 40}
            onPress={() => router.push(`/ressource/${item.id}`)}
          />
        </View>
      ) : (
        <ResourceRow
          resource={item}
          delay={Math.min(index, 8) * 40}
          onPress={() => router.push(`/ressource/${item.id}`)}
        />
      ),
    [isGrid, router]
  );

  const activeChips = [
    filters.platform
      ? { key: 'platform' as const, label: filters.platform, color: platformColor(filters.platform) }
      : null,
    filters.category ? { key: 'category' as const, label: filters.category, color: undefined } : null,
  ].filter((chip): chip is NonNullable<typeof chip> => chip !== null);

  return (
    <Screen>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitles}>
            <Typography variant="h1">Catalogue</Typography>
            <Typography variant="caption" color="secondary">
              {isLoading ? 'Chargement…' : `${total} ressource${total > 1 ? 's' : ''}`}
            </Typography>
          </View>

          <AnimatedPressable
            onPress={() => setLayout(isGrid ? 'list' : 'grid')}
            scale={0.92}
            style={[styles.iconButton, { backgroundColor: colors.item, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel={isGrid ? 'Affichage en liste' : 'Affichage en grille'}
          >
            {isGrid ? (
              <ListIcon size={18} color={colors.textSecondary} strokeWidth={2.3} />
            ) : (
              <LayoutGrid size={18} color={colors.textSecondary} strokeWidth={2.3} />
            )}
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => setFiltersVisible(true)}
            scale={0.92}
            style={[
              styles.iconButton,
              {
                backgroundColor: activeChips.length > 0 ? colors.primary : colors.item,
                borderColor: activeChips.length > 0 ? colors.primary : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Filtres"
          >
            <SlidersHorizontal
              size={18}
              color={activeChips.length > 0 ? colors.onPrimary : colors.textSecondary}
              strokeWidth={2.3}
            />
          </AnimatedPressable>
        </View>

        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Nom, description, tag…"
        />

        <View style={styles.chips}>
          <Chip
            label={filters.sort === 'popular' ? 'Populaires' : 'Récents'}
            selected
            size="small"
            uppercase
            onPress={() =>
              setFilters((current) => ({
                ...current,
                sort: current.sort === 'popular' ? 'recent' : 'popular',
              }))
            }
          />
          {activeChips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              color={chip.color}
              selected
              size="small"
              onPress={() => setFilters((current) => ({ ...current, [chip.key]: undefined }))}
              trailing={<X size={11} color={colors.onPrimary} strokeWidth={3} />}
            />
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={[styles.skeletons, isGrid && styles.skeletonGrid]}>
          {[0, 1, 2, 3, 4, 5].map((index) =>
            isGrid ? (
              <View key={index} style={styles.skeletonCell}>
                <ResourceCardSkeleton />
              </View>
            ) : (
              <ResourceRowSkeleton key={index} />
            )
          )}
        </View>
      ) : isError && items.length === 0 ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <FlashList
          key={layout}
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={isGrid ? 2 : 1}
          contentContainerStyle={{
            paddingHorizontal: isGrid ? screenPadding - GRID_GUTTER : screenPadding,
            paddingBottom: insets.bottom + tabBarHeight + tabBarInset + spacing.xl,
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          ListEmptyComponent={
            <EmptyState
              icon={PackageSearch}
              title="Aucune ressource"
              description="Essaie d’élargir la recherche ou de retirer un filtre."
              actionLabel={
                search || activeChips.length > 0 ? 'Réinitialiser' : undefined
              }
              onAction={
                search || activeChips.length > 0
                  ? () => {
                      setSearch('');
                      setFilters({ sort: filters.sort });
                    }
                  : undefined
              }
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}

      <FiltersSheet
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        value={filters}
        onChange={setFilters}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skeletons: {
    paddingHorizontal: screenPadding,
    gap: spacing.md,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skeletonCell: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  gridCell: {
    flex: 1,
    paddingHorizontal: GRID_GUTTER,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
  },
});
