import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CatalogueFilters } from '@/components/resources/FiltersSheet';

import { zustandStorage } from './storage';

interface CataloguePrefsState {
  filters: CatalogueFilters;
  setFilters: (filters: CatalogueFilters) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: CatalogueFilters = {
  sort: 'recent',
  platform: undefined,
  category: undefined,
};

export const useCataloguePrefsStore = create<CataloguePrefsState>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      setFilters: (filters) => set({ filters }),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    }),
    {
      name: 'lbxmb.cataloguePrefs',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
