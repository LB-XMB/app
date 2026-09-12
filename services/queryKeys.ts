import type { ForumThreadListQuery, ResourceQuery } from '@/services/api';

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
  forumCategories: ['forum', 'categories'] as const,
  forumConsoleTags: ['forum', 'tags', 'console'] as const,
  /** Prefix shared by every thread list, to invalidate them in one call. */
  forumThreadLists: ['forum', 'threads'] as const,
  forumThreads: (query: ForumThreadListQuery) => ['forum', 'threads', query] as const,
  /** Prefix covering the detail and the reactions of a thread, all viewers included. */
  forumThreadRoot: (id: string) => ['forum', 'thread', id] as const,
  // Both payloads depend on the viewer (own likes, follower-only threads).
  forumThread: (id: string, viewerId: string) =>
    ['forum', 'thread', id, 'detail', viewerId] as const,
  forumThreadReactions: (id: string, viewerId: string) =>
    ['forum', 'thread', id, 'reactions', viewerId] as const,
  news: ['news', 'feed'] as const,
  notifications: ['notifications', 'inbox'] as const,
  publicUser: (id: string) => ['users', 'public', id] as const,
};
