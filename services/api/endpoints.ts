import { request } from './client';
import {
  asRecord,
  normalizeGuide,
  normalizeGuideDetail,
  normalizeHomeStats,
  normalizePopularResource,
  normalizeResource,
  normalizeResourceDetail,
  normalizeSearchHit,
  toNumber,
  toStringOrNull,
  toText,
} from './normalize';
import type {
  CommunityStats,
  Creator,
  Guide,
  GuideDetail,
  HomeAggregate,
  HomeStats,
  ResourceDetail,
  ResourceFilters,
  ResourcePage,
  SearchHit,
  SortOrder,
} from './types';

export interface ResourceQuery {
  page?: number;
  limit?: number;
  search?: string;
  platform?: string;
  category?: string;
  subcategory?: string;
  game?: string;
  sort?: SortOrder;
}

export async function fetchResources(
  query: ResourceQuery = {},
  signal?: AbortSignal
): Promise<ResourcePage> {
  const payload = await request<unknown>('/api/resources', {
    signal,
    query: {
      page: query.page,
      limit: query.limit,
      search: query.search,
      platform: query.platform,
      category: query.category,
      subcategory: query.subcategory,
      jeu: query.game,
      sort: query.sort,
    },
  });

  const raw = asRecord(payload);
  const items = Array.isArray(raw.data) ? raw.data.map(normalizeResource) : [];
  const pagination = asRecord(raw.pagination);
  const limit = toNumber(pagination.limit, query.limit ?? 24);
  const total = toNumber(pagination.total, items.length);

  return {
    items,
    pagination: {
      page: toNumber(pagination.page, query.page ?? 1),
      limit,
      total,
      totalPages: toNumber(pagination.totalPages, Math.max(1, Math.ceil(total / limit))),
    },
  };
}

export async function fetchResource(
  id: string,
  signal?: AbortSignal
): Promise<ResourceDetail> {
  const payload = await request<unknown>(`/api/resources/${encodeURIComponent(id)}`, {
    signal,
  });
  return normalizeResourceDetail(asRecord(payload).data);
}

export async function fetchResourceFilters(signal?: AbortSignal): Promise<ResourceFilters> {
  const payload = await request<unknown>('/api/resources/filters', { signal });
  const raw = asRecord(payload);
  const toList = (value: unknown) =>
    Array.isArray(value)
      ? value.map(toStringOrNull).filter((item): item is string => item !== null)
      : [];
  return { platforms: toList(raw.platforms), categories: toList(raw.categories) };
}

/** Increments the public download counter. Failures are non-blocking. */
export async function trackResourceDownload(id: string): Promise<void> {
  try {
    await request<unknown>(`/api/resources/${encodeURIComponent(id)}/download`, {
      method: 'POST',
      body: {},
    });
  } catch {
    // The endpoint is rate-limited; a rejected increment must not surface.
  }
}

export async function fetchGuides(signal?: AbortSignal): Promise<Guide[]> {
  const payload = await request<unknown>('/api/guides', { signal });
  const list = Array.isArray(payload) ? payload : asRecord(payload).data;
  return Array.isArray(list) ? list.map(normalizeGuide) : [];
}

export async function fetchGuide(id: string, signal?: AbortSignal): Promise<GuideDetail> {
  const payload = await request<unknown>(`/api/guides/${encodeURIComponent(id)}`, {
    signal,
  });
  return normalizeGuideDetail(asRecord(payload).data);
}

export async function searchSite(
  query: string,
  limit = 12,
  signal?: AbortSignal
): Promise<SearchHit[]> {
  const payload = await request<unknown>('/api/site-search', {
    signal,
    query: { q: query, limit },
  });
  const hits = asRecord(payload).hits;
  if (!Array.isArray(hits)) return [];
  return hits
    .map(normalizeSearchHit)
    .filter((hit): hit is SearchHit => hit !== null);
}

export async function fetchHomeStats(signal?: AbortSignal): Promise<HomeStats> {
  const payload = await request<unknown>('/api/stats/home', { signal });
  return normalizeHomeStats(asRecord(payload).data);
}

export async function fetchCommunityStats(signal?: AbortSignal): Promise<CommunityStats> {
  const payload = await request<unknown>('/api/stats', { signal });
  const raw = asRecord(payload);
  return {
    members: toNumber(raw.count),
    threads: toNumber(raw.threads),
    posts: toNumber(raw.posts),
  };
}

export async function fetchHome(signal?: AbortSignal): Promise<HomeAggregate> {
  const payload = await request<unknown>('/api/home', { signal });
  const raw = asRecord(payload);
  const featured = asRecord(raw.featured);
  const rawCreators = Array.isArray(featured.creators) ? featured.creators : [];

  const creators: Creator[] = rawCreators
    .map((entry) => {
      const creator = asRecord(entry);
      return {
        userId: toText(creator.userId),
        pseudo: toText(creator.pseudo ?? creator.discordUsername),
        photo: toStringOrNull(creator.photo),
      };
    })
    .filter((creator) => creator.pseudo.length > 0);

  const popularResources = (
    Array.isArray(raw.popularResources) ? raw.popularResources : []
  )
    .map(normalizePopularResource)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    stats: normalizeHomeStats(raw.stats),
    creators,
    popularResources,
  };
}
