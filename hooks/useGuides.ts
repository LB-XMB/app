import { useQuery } from '@tanstack/react-query';

import { fetchGuide, fetchGuides } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';

export function useGuides() {
  return useQuery({
    queryKey: queryKeys.guides,
    queryFn: ({ signal }) => fetchGuides(signal),
  });
}

export function useGuide(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.guide(id ?? ''),
    queryFn: ({ signal }) => fetchGuide(id!, signal),
    enabled: Boolean(id),
  });
}
