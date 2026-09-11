import { useQuery } from '@tanstack/react-query';

import { fetchCommunityStats, fetchHome } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';

export function useHome() {
  return useQuery({
    queryKey: queryKeys.home,
    queryFn: ({ signal }) => fetchHome(signal),
  });
}

export function useCommunityStats() {
  return useQuery({
    queryKey: queryKeys.communityStats,
    queryFn: ({ signal }) => fetchCommunityStats(signal),
    staleTime: 10 * 60 * 1000,
  });
}
