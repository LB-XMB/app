import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useForumCategories, useForumThreadsInfinite } from '@/hooks/useForum';
import { fetchNews, isNewsForumCategory, newsItemFromThread, type NewsItem } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';

/** Latest news, straight from the home feed: fast, no category lookup needed. */
export function useNewsHighlights(limit = 6) {
  return useQuery({
    queryKey: queryKeys.news,
    queryFn: ({ signal }) => fetchNews(limit, signal),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Full news list. There is no dedicated endpoint: it is the paginated thread
 * list of the `actualite` category, whose id has to be resolved first.
 */
export function useNewsInfinite() {
  const categories = useForumCategories();

  const categoryId = useMemo(
    () => categories.data?.find((category) => isNewsForumCategory(category.slug))?.id,
    [categories.data]
  );

  const threads = useForumThreadsInfinite(
    { categoryId, sort: 'recent' },
    Boolean(categoryId)
  );

  const items = useMemo<NewsItem[]>(
    () => threads.items.map(newsItemFromThread),
    [threads.items]
  );

  const refetch = useCallback(() => {
    if (categories.isError || !categoryId) void categories.refetch();
    if (categoryId) void threads.refetch();
  }, [categories, categoryId, threads]);

  return {
    items,
    total: threads.total,
    isLoading: categories.isLoading || (Boolean(categoryId) && threads.isLoading),
    isRefetching: categories.isRefetching || threads.isRefetching,
    isError: categories.isError || threads.isError,
    error: categories.error ?? threads.error,
    hasNextPage: threads.hasNextPage,
    isFetchingNextPage: threads.isFetchingNextPage,
    fetchNextPage: threads.fetchNextPage,
    refetch,
  };
}
