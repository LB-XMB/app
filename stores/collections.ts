import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './storage';

export interface Collection {
  id: string;
  name: string;
  resourceIds: string[];
  updatedAt: string;
}

interface CollectionsState {
  collections: Collection[];
  create: (name: string) => string;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  addResource: (collectionId: string, resourceId: string) => void;
  removeResource: (collectionId: string, resourceId: string) => void;
  toggleResource: (collectionId: string, resourceId: string) => boolean;
}

function now(): string {
  return new Date().toISOString();
}

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set, get) => ({
      collections: [],
      create: (name) => {
        const id = `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const trimmed = name.trim() || 'Sans titre';
        set({
          collections: [
            { id, name: trimmed, resourceIds: [], updatedAt: now() },
            ...get().collections,
          ],
        });
        return id;
      },
      rename: (id, name) =>
        set({
          collections: get().collections.map((item) =>
            item.id === id
              ? { ...item, name: name.trim() || item.name, updatedAt: now() }
              : item
          ),
        }),
      remove: (id) =>
        set({ collections: get().collections.filter((item) => item.id !== id) }),
      addResource: (collectionId, resourceId) =>
        set({
          collections: get().collections.map((item) => {
            if (item.id !== collectionId || item.resourceIds.includes(resourceId)) {
              return item;
            }
            return {
              ...item,
              resourceIds: [resourceId, ...item.resourceIds],
              updatedAt: now(),
            };
          }),
        }),
      removeResource: (collectionId, resourceId) =>
        set({
          collections: get().collections.map((item) =>
            item.id === collectionId
              ? {
                  ...item,
                  resourceIds: item.resourceIds.filter((id) => id !== resourceId),
                  updatedAt: now(),
                }
              : item
          ),
        }),
      toggleResource: (collectionId, resourceId) => {
        const collection = get().collections.find((item) => item.id === collectionId);
        if (!collection) return false;
        if (collection.resourceIds.includes(resourceId)) {
          get().removeResource(collectionId, resourceId);
          return false;
        }
        get().addResource(collectionId, resourceId);
        return true;
      },
    }),
    {
      name: 'lbxmb.collections',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
