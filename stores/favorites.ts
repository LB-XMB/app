import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './storage';

/**
 * Snapshot of a resource, stored locally so the favourites screen still works
 * without network access.
 */
export interface FavoriteResource {
  id: string;
  title: string;
  platform: string | null;
  category: string | null;
  logo: string | null;
  logoVersion: string | null;
  addedAt: string;
}

interface FavoritesState {
  items: FavoriteResource[];
  toggle: (resource: Omit<FavoriteResource, 'addedAt'>) => boolean;
  remove: (id: string) => void;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (resource) => {
        const existing = get().items.find((item) => item.id === resource.id);
        if (existing) {
          set({ items: get().items.filter((item) => item.id !== resource.id) });
          return false;
        }
        set({
          items: [{ ...resource, addedAt: new Date().toISOString() }, ...get().items],
        });
        return true;
      },
      remove: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'lbxmb.favorites',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

export function useIsFavorite(id: string | undefined): boolean {
  return useFavoritesStore((state) =>
    id ? state.items.some((item) => item.id === id) : false
  );
}
