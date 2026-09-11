import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './storage';

const MAX_DOWNLOADS = 100;
const MAX_SEARCHES = 12;

export interface DownloadEntry {
  /** Unique per download so the same file can appear twice. */
  key: string;
  resourceId: string;
  resourceTitle: string;
  fileName: string;
  /** Absolute URL the file was fetched from. */
  url: string;
  size: number | null;
  version: string | null;
  platform: string | null;
  logo: string | null;
  downloadedAt: string;
}

interface HistoryState {
  downloads: DownloadEntry[];
  searches: string[];
  addDownload: (entry: Omit<DownloadEntry, 'key' | 'downloadedAt'>) => void;
  removeDownload: (key: string) => void;
  clearDownloads: () => void;
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearSearches: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      downloads: [],
      searches: [],
      addDownload: (entry) => {
        const download: DownloadEntry = {
          ...entry,
          key: `${entry.resourceId}:${entry.fileName}:${Date.now()}`,
          downloadedAt: new Date().toISOString(),
        };
        set({ downloads: [download, ...get().downloads].slice(0, MAX_DOWNLOADS) });
      },
      removeDownload: (key) =>
        set({ downloads: get().downloads.filter((item) => item.key !== key) }),
      clearDownloads: () => set({ downloads: [] }),
      addSearch: (query) => {
        const trimmed = query.trim();
        if (trimmed.length < 2) return;
        const rest = get().searches.filter(
          (item) => item.toLowerCase() !== trimmed.toLowerCase()
        );
        set({ searches: [trimmed, ...rest].slice(0, MAX_SEARCHES) });
      },
      removeSearch: (query) =>
        set({ searches: get().searches.filter((item) => item !== query) }),
      clearSearches: () => set({ searches: [] }),
    }),
    {
      name: 'lbxmb.history',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
