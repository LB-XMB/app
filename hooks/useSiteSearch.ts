import { useQuery } from '@tanstack/react-query';

import { searchSite } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';

/** The API requires at least two characters. */
export const MIN_SEARCH_LENGTH = 2;

export function useSiteSearch(query: string) {
  const trimmed = query.trim();
  const enabled = trimmed.length >= MIN_SEARCH_LENGTH;

  return useQuery({
    queryKey: queryKeys.search(trimmed),
    queryFn: ({ signal }) => searchSite(trimmed, 12, signal),
    enabled,
    // Keeps the previous hits on screen while the next query resolves.
    placeholderData: (previous) => previous,
  });
}
