import { fetchHome, fetchHomeStats } from '@/services/api';

export interface PopularWidgetItem {
  id: string;
  title: string;
  href: string;
}

export interface CommunityStatsWidget {
  resources: number;
  users: number;
  guides: number;
}

export interface WidgetPayloads {
  popular: PopularWidgetItem[];
  stats: CommunityStatsWidget;
  fetchedAt: string;
}

/** Read-only public API payloads for future home-screen widgets. */
export async function fetchWidgetPayloads(signal?: AbortSignal): Promise<WidgetPayloads> {
  const [home, stats] = await Promise.all([fetchHome(signal), fetchHomeStats(signal)]);
  return {
    popular: (home.popularResources ?? []).slice(0, 5).map((item) => ({
      id: item.slug || item.href,
      title: item.title,
      href: item.href,
    })),
    stats: {
      resources: stats.resources,
      users: stats.users,
      guides: stats.guides,
    },
    fetchedAt: new Date().toISOString(),
  };
}
