import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import {
  createForumThread,
  deleteForumPost,
  fetchForumCategories,
  fetchForumConsoleTags,
  fetchForumThread,
  fetchForumThreadReactions,
  fetchForumThreads,
  postableForumCategories,
  reactToForumThread,
  replyToForumThread,
  toggleForumReaction,
  trackForumThreadView,
  updateForumPost,
  type CreateForumThreadInput,
  type ForumCategory,
  type ForumReactionType,
  type ForumThread,
  type ForumThreadDetail,
  type ForumThreadListQuery,
  type ForumThreadReactions,
} from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { useSessionStore } from '@/stores/session';

const PAGE_SIZE = 20;

/** Identifies the viewer in the cache keys, so signing in refreshes them. */
function useViewerId(): string {
  return useSessionStore((state) => state.user?.id ?? 'guest');
}

export function useForumCategories() {
  return useQuery({
    queryKey: queryKeys.forumCategories,
    queryFn: ({ signal }) => fetchForumCategories(signal),
    // The category list is edited by the staff a few times a year.
    staleTime: 60 * 60 * 1000,
  });
}

/** Categories the signed in member may open a thread in. */
export function usePostableForumCategories(): {
  categories: ForumCategory[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
} {
  const query = useForumCategories();
  const categories = useMemo(
    () => postableForumCategories(query.data ?? []),
    [query.data]
  );

  return {
    categories,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

export function useForumConsoleTags(enabled = true) {
  return useQuery({
    queryKey: queryKeys.forumConsoleTags,
    queryFn: ({ signal }) => fetchForumConsoleTags(signal),
    staleTime: 60 * 60 * 1000,
    enabled,
  });
}

/** Paginated thread list, fed by an infinite list. */
export function useForumThreadsInfinite(query: ForumThreadListQuery, enabled = true) {
  const result = useInfiniteQuery({
    queryKey: queryKeys.forumThreads(query),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchForumThreads({ ...query, page: pageParam, perPage: PAGE_SIZE }, signal),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.pages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled,
  });

  const items = useMemo<ForumThread[]>(
    () => result.data?.pages.flatMap((page) => page.items) ?? [],
    [result.data]
  );

  return {
    ...result,
    items,
    total: result.data?.pages[0]?.pagination.total ?? 0,
  };
}

export function useForumThread(id: string | undefined) {
  const token = useSessionStore((state) => state.token);
  const viewerId = useViewerId();

  return useQuery({
    queryKey: queryKeys.forumThread(id ?? '', viewerId),
    queryFn: ({ signal }) => fetchForumThread(id!, token, signal),
    enabled: Boolean(id),
  });
}

export function useForumThreadReactions(id: string | undefined) {
  const token = useSessionStore((state) => state.token);
  const viewerId = useViewerId();

  return useQuery({
    queryKey: queryKeys.forumThreadReactions(id ?? '', viewerId),
    queryFn: ({ signal }) => fetchForumThreadReactions(id!, token, signal),
    enabled: Boolean(id),
  });
}

/** Registers one view per opened thread; the server deduplicates the rest. */
export function useTrackForumThreadView(id: string | undefined): void {
  const token = useSessionStore((state) => state.token);
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (!id || tracked.current === id) return;
    tracked.current = id;
    void trackForumThreadView(id, token);
  }, [id, token]);
}

export function useReplyToForumThread(threadId: string) {
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.token);
  const viewerId = useViewerId();

  return useMutation({
    mutationFn: (content: string) => replyToForumThread({ threadId, content, token }),
    onSuccess: (reply) => {
      queryClient.setQueryData<ForumThreadDetail>(
        queryKeys.forumThread(threadId, viewerId),
        (current) =>
          current
            ? {
                ...current,
                replies: [...current.replies, reply],
                repliesCount: current.repliesCount + 1,
              }
            : current
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumThreadRoot(threadId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumThreadLists });
    },
  });
}

export function useUpdateForumReply(threadId: string) {
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.token);

  return useMutation({
    mutationFn: (input: { postId: string; content: string }) =>
      updateForumPost({ ...input, token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumThreadRoot(threadId) });
    },
  });
}

export function useDeleteForumReply(threadId: string) {
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.token);

  return useMutation({
    mutationFn: (postId: string) => deleteForumPost({ postId, token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumThreadRoot(threadId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumThreadLists });
    },
  });
}

/** Like / dislike toggle, applied optimistically then confirmed by the server. */
export function useForumThreadReaction(threadId: string) {
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.token);
  const viewerId = useViewerId();
  const key = queryKeys.forumThreadReactions(threadId, viewerId);

  return useMutation({
    mutationFn: (reaction: ForumReactionType) =>
      reactToForumThread({ threadId, reaction, token }),
    onMutate: async (reaction) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ForumThreadReactions>(key);
      if (previous) {
        queryClient.setQueryData<ForumThreadReactions>(key, toggleForumReaction(previous, reaction));
      }
      return { previous };
    },
    onError: (_error, _reaction, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useCreateForumThread() {
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.token);

  return useMutation({
    mutationFn: (input: CreateForumThreadInput) => createForumThread({ ...input, token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.forumThreadLists });
      void queryClient.invalidateQueries({ queryKey: queryKeys.news });
    },
  });
}
