import { FlashList } from '@shopify/flash-list';
import { Newspaper } from 'lucide-react-native';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NewsListSkeleton } from '@/components/forum/ForumSkeleton';
import { NewsRow } from '@/components/forum/NewsRow';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useNewsInfinite } from '@/hooks/useNews';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import type { NewsItem } from '@/services/api';
import { EmptyState, ErrorState, Screen } from '@/ui/components';
import { screenPadding, spacing, useColors } from '@/ui/theme';

export default function NewsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/actualites');

  const news = useNewsInfinite();

  const renderItem = ({ item, index }: { item: NewsItem; index: number }) => (
    <NewsRow item={item} delay={Math.min(index, 8) * 35} />
  );

  return (
    <Screen>
      <ScreenHeader
        title="Actualités"
        subtitle={
          news.isLoading
            ? 'Chargement…'
            : `${news.total} publication${news.total > 1 ? 's' : ''}`
        }
      />

      {news.isError ? (
        <View style={styles.state}>
          <ErrorState error={news.error} onRetry={news.refetch} />
        </View>
      ) : news.isLoading ? (
        <View style={styles.state}>
          <NewsListSkeleton />
        </View>
      ) : (
        <FlashList
          data={news.items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: screenPadding,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.md,
          }}
          refreshControl={
            <RefreshControl
              refreshing={news.isRefetching}
              onRefresh={news.refetch}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (news.hasNextPage && !news.isFetchingNextPage) {
              void news.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              icon={Newspaper}
              title="Pas encore d’actualité"
              description="Les annonces de la communauté apparaîtront ici."
            />
          }
          ListFooterComponent={
            news.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={styles.footer} />
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  state: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
  },
  footer: {
    marginVertical: spacing.lg,
  },
});
