import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { MessageSquarePlus, MessagesSquare } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryPicker } from '@/components/forum/CategoryPicker';
import { ForumListSkeleton } from '@/components/forum/ForumSkeleton';
import { ThreadRow } from '@/components/forum/ThreadRow';
import { HeaderAction, ScreenHeader } from '@/components/layout/ScreenHeader';
import {
  useForumCategories,
  useForumThreadsInfinite,
} from '@/hooks/useForum';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import type { ForumSort, ForumThread } from '@/services/api';
import { useIsSignedIn } from '@/stores/session';
import {
  Chip,
  EmptyState,
  ErrorState,
  Screen,
} from '@/ui/components';
import { screenPadding, spacing, useColors } from '@/ui/theme';

const SORTS: { value: ForumSort; label: string }[] = [
  { value: 'recent', label: 'Récents' },
  { value: 'popular', label: 'Populaires' },
  { value: 'oldest', label: 'Anciens' },
];

export default function ForumScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const signedIn = useIsSignedIn();
  useScreenTracking('/forum');

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<ForumSort>('recent');

  const categories = useForumCategories();
  const query = useMemo(() => ({ categoryId: categoryId ?? undefined, sort }), [categoryId, sort]);
  const threads = useForumThreadsInfinite(query);

  const renderItem = ({ item, index }: { item: ForumThread; index: number }) => (
    <ThreadRow
      thread={item}
      delay={Math.min(index, 8) * 35}
      onPress={() => router.push(`/forum/${item.id}`)}
    />
  );

  return (
    <Screen>
      <ScreenHeader
        title="Forum"
        subtitle={
          threads.isLoading
            ? 'Chargement…'
            : `${threads.total} sujet${threads.total > 1 ? 's' : ''}`
        }
        actions={
          <HeaderAction
            label="Nouveau sujet"
            onPress={() => router.push(signedIn ? '/forum/nouveau' : '/compte')}
          >
            <MessageSquarePlus size={17} color={colors.primary} strokeWidth={2.4} />
          </HeaderAction>
        }
      />

      <View style={styles.filters}>
        <CategoryPicker
          categories={categories.data ?? []}
          selectedId={categoryId}
          onSelect={setCategoryId}
          allowAll
        />
        <View style={styles.sorts}>
          {SORTS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              size="small"
              selected={sort === option.value}
              onPress={() => setSort(option.value)}
            />
          ))}
        </View>
      </View>

      {threads.isError ? (
        <View style={styles.state}>
          <ErrorState error={threads.error} onRetry={() => void threads.refetch()} />
        </View>
      ) : threads.isLoading ? (
        <View style={styles.state}>
          <ForumListSkeleton />
        </View>
      ) : (
        <FlashList
          data={threads.items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: screenPadding,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.md,
          }}
          refreshControl={
            <RefreshControl
              refreshing={threads.isRefetching}
              onRefresh={() => void threads.refetch()}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (threads.hasNextPage && !threads.isFetchingNextPage) {
              void threads.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              icon={MessagesSquare}
              title="Aucun sujet"
              description="Essaie une autre catégorie, ou sois le premier à poster."
              actionLabel={signedIn ? 'Nouveau sujet' : 'Se connecter'}
              onAction={() => router.push(signedIn ? '/forum/nouveau' : '/compte')}
            />
          }
          ListFooterComponent={
            threads.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={styles.footer} />
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  sorts: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: screenPadding,
  },
  state: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
  },
  footer: {
    marginVertical: spacing.lg,
  },
});
