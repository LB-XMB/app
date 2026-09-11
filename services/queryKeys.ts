import type { ResourceQuery } from '@/services/api';

/** Single source of truth for react-query cache keys. */
export const queryKeys = {
  home: ['home'] as const,
  homeStats: ['stats', 'home'] as const,
  communityStats: ['stats', 'community'] as const,
  resourceFilters: ['resources', 'filters'] as const,
  resources: (query: Omit<ResourceQuery, 'page'>) => ['resources', 'list', query] as const,
  resource: (id: string) => ['resources', 'detail', id] as const,
  guides: ['guides', 'list'] as const,
  guide: (id: string) => ['guides', 'detail', id] as const,
  search: (query: string) => ['search', query] as const,
};
