import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { storage } from '@/stores/storage';

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

/** Persist only resource / guide detail queries for offline reopening. */
export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const [root, kind] = queryKey;
  return (
    (root === 'resources' && kind === 'detail') ||
    (root === 'guides' && kind === 'detail')
  );
}

export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => storage.getString(key) ?? null,
    setItem: async (key, value) => {
      storage.set(key, value);
    },
    removeItem: async (key) => {
      storage.delete(key);
    },
  },
  key: 'lbxmb.reactQuery',
});

export const QUERY_CACHE_MAX_AGE = SEVEN_DAYS;
