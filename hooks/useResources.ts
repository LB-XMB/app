import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  fetchResource,
  fetchResourceFilters,
  fetchResources,
  type Resource,
  type ResourceQuery,
} from '@/services/api';
import { queryKeys } from '@/services/queryKeys';

const PAGE_SIZE = 24;

export type ResourceListQuery = Omit<ResourceQuery, 'page' | 'limit'>;

/** Paginated catalogue, fed by an infinite list. */
export function useResourcesInfinite(query: ResourceListQuery) {
  const result = useInfiniteQuery({
    queryKey: queryKeys.resources(query),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchResources({ ...query, page: pageParam, limit: PAGE_SIZE }, signal),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const items = useMemo<Resource[]>(
    () => result.data?.pages.flatMap((page) => page.items) ?? [],
    [result.data]
  );

  return {
    ...result,
    items,
    total: result.data?.pages[0]?.pagination.total ?? 0,
  };
}

/** Single page of resources, used for the home carousels. */
export function useResourcePage(query: ResourceQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.resources(query),
    queryFn: ({ signal }) => fetchResources(query, signal),
    enabled,
  });
}

export function useResource(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.resource(id ?? ''),
    queryFn: ({ signal }) => fetchResource(id!, signal),
    enabled: Boolean(id),
  });
}

export function useResourceFilters() {
  return useQuery({
    queryKey: queryKeys.resourceFilters,
    queryFn: ({ signal }) => fetchResourceFilters(signal),
    // Platform and category lists barely ever change.
    staleTime: 60 * 60 * 1000,
  });
}
