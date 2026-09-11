import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

export interface KeyValueStore {
  getString(key: string): string | undefined;
  getBoolean(key: string): boolean | undefined;
  set(key: string, value: string | boolean | number): void;
  delete(key: string): void;
}

function createNativeStore(): KeyValueStore {
  // Required lazily: MMKV relies on Nitro/JSI and is unavailable on web.
  const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const mmkv = createMMKV({ id: 'lbxmb' });
  return {
    getString: (key) => mmkv.getString(key),
    getBoolean: (key) => mmkv.getBoolean(key),
    set: (key, value) => mmkv.set(key, value),
    delete: (key) => void mmkv.remove(key),
  };
}

function createWebStore(): KeyValueStore {
  const memory = new Map<string, string>();
  const backend =
    typeof localStorage !== 'undefined'
      ? {
          get: (key: string) => localStorage.getItem(key) ?? undefined,
          set: (key: string, value: string) => localStorage.setItem(key, value),
          remove: (key: string) => localStorage.removeItem(key),
        }
      : {
          get: (key: string) => memory.get(key),
          set: (key: string, value: string) => void memory.set(key, value),
          remove: (key: string) => void memory.delete(key),
        };

  return {
    getString: (key) => backend.get(key),
    getBoolean: (key) => {
      const raw = backend.get(key);
      return raw === undefined ? undefined : raw === 'true';
    },
    set: (key, value) => backend.set(key, String(value)),
    delete: (key) => backend.remove(key),
  };
}

/** Persistent key/value store: MMKV on device, localStorage on web. */
export const storage: KeyValueStore =
  Platform.OS === 'web' ? createWebStore() : createNativeStore();

/** Adapter plugged into zustand's `persist` middleware. */
export const zustandStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
};
