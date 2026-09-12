import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TransferProtocol } from '@/services/ftp';

import { zustandStorage } from './storage';

export interface FtpProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  protocol: TransferProtocol;
  lastPath: string;
}

export type FtpUploadStatus = 'pending' | 'running' | 'done' | 'error';

export interface FtpUploadJob {
  id: string;
  profileId: string;
  fileName: string;
  /** Local file URI in the app sandbox. */
  localUri: string;
  remotePath: string;
  status: FtpUploadStatus;
  error: string | null;
  createdAt: string;
}

interface FtpState {
  profiles: FtpProfile[];
  activeProfileId: string | null;
  uploadQueue: FtpUploadJob[];
  /** Transient password fields keyed by profile id (not persisted). */
  passwordDrafts: Record<string, string>;
  setActiveProfileId: (id: string | null) => void;
  upsertProfile: (profile: FtpProfile) => void;
  removeProfile: (id: string) => void;
  patchActive: (patch: Partial<Omit<FtpProfile, 'id'>>) => void;
  setPasswordDraft: (profileId: string, password: string) => void;
  enqueueUpload: (job: Omit<FtpUploadJob, 'id' | 'status' | 'error' | 'createdAt'>) => string;
  updateUpload: (id: string, patch: Partial<FtpUploadJob>) => void;
  retryUpload: (id: string) => void;
  clearFinishedUploads: () => void;
}

const DEFAULT_PROFILE = (): FtpProfile => ({
  id: `ftp-${Date.now()}`,
  name: 'Console',
  host: '',
  port: 21,
  user: 'anonymous',
  protocol: 'ftp',
  lastPath: '/',
});

async function secureSet(key: string, value: string) {
  if (Platform.OS === 'web') return;
  try {
    const SecureStore = await import('expo-secure-store');
    if (value) await SecureStore.setItemAsync(key, value);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    // SecureStore unavailable (Expo Go / web) — password stays draft-only.
  }
}

async function secureGet(key: string): Promise<string> {
  if (Platform.OS === 'web') return '';
  try {
    const SecureStore = await import('expo-secure-store');
    return (await SecureStore.getItemAsync(key)) ?? '';
  } catch {
    return '';
  }
}

export function ftpPasswordKey(profileId: string): string {
  return `ftp.password.${profileId}`;
}

export async function loadFtpPassword(profileId: string): Promise<string> {
  return secureGet(ftpPasswordKey(profileId));
}

export async function saveFtpPassword(profileId: string, password: string): Promise<void> {
  await secureSet(ftpPasswordKey(profileId), password);
}

export const useFtpStore = create<FtpState>()(
  persist(
    (set) => ({
      profiles: [],
      activeProfileId: null,
      uploadQueue: [],
      passwordDrafts: {},
      setActiveProfileId: (activeProfileId) => set({ activeProfileId }),
      upsertProfile: (profile) =>
        set((state) => {
          const exists = state.profiles.some((item) => item.id === profile.id);
          return {
            profiles: exists
              ? state.profiles.map((item) => (item.id === profile.id ? profile : item))
              : [...state.profiles, profile],
            activeProfileId: state.activeProfileId ?? profile.id,
          };
        }),
      removeProfile: (id) => {
        void saveFtpPassword(id, '');
        set((state) => {
          const profiles = state.profiles.filter((item) => item.id !== id);
          const { [id]: _removed, ...passwordDrafts } = state.passwordDrafts;
          return {
            profiles,
            passwordDrafts,
            activeProfileId:
              state.activeProfileId === id ? (profiles[0]?.id ?? null) : state.activeProfileId,
          };
        });
      },
      patchActive: (patch) =>
        set((state) => {
          const id = state.activeProfileId;
          if (!id) return state;
          return {
            profiles: state.profiles.map((profile) => {
              if (profile.id !== id) return profile;
              const next = { ...profile, ...patch };
              if (patch.protocol && patch.port == null) {
                const previousDefault = profile.protocol === 'sftp' ? 22 : 21;
                if (profile.port === previousDefault) {
                  next.port = patch.protocol === 'sftp' ? 22 : 21;
                }
              }
              return next;
            }),
          };
        }),
      setPasswordDraft: (profileId, password) =>
        set((state) => ({
          passwordDrafts: { ...state.passwordDrafts, [profileId]: password },
        })),
      enqueueUpload: (job) => {
        const id = `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const entry: FtpUploadJob = {
          ...job,
          id,
          status: 'pending',
          error: null,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          uploadQueue: [entry, ...state.uploadQueue].slice(0, 40),
        }));
        return id;
      },
      updateUpload: (id, patch) =>
        set((state) => ({
          uploadQueue: state.uploadQueue.map((job) =>
            job.id === id ? { ...job, ...patch } : job
          ),
        })),
      retryUpload: (id) =>
        set((state) => ({
          uploadQueue: state.uploadQueue.map((job) =>
            job.id === id
              ? { ...job, status: 'pending' as const, error: null }
              : job
          ),
        })),
      clearFinishedUploads: () =>
        set((state) => ({
          uploadQueue: state.uploadQueue.filter(
            (job) => job.status === 'pending' || job.status === 'running'
          ),
        })),
    }),
    {
      name: 'lbxmb.ftp',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        uploadQueue: state.uploadQueue.map((job) =>
          job.status === 'running' ? { ...job, status: 'pending' as const } : job
        ),
      }),
      merge: (persisted, current) => {
        const raw = persisted as {
          profiles?: FtpProfile[];
          activeProfileId?: string | null;
          uploadQueue?: FtpUploadJob[];
          /** Legacy single-target shape from pre-P1.4. */
          target?: {
            host?: string;
            port?: number;
            user?: string;
            password?: string;
            protocol?: TransferProtocol;
            lastPath?: string;
          };
        } | null;

        let profiles = raw?.profiles?.length ? raw.profiles : current.profiles;
        let activeProfileId = raw?.activeProfileId ?? current.activeProfileId;

        // Migrate legacy single target → first named profile.
        if ((!profiles || profiles.length === 0) && raw?.target) {
          const migrated = DEFAULT_PROFILE();
          migrated.host = raw.target.host ?? '';
          migrated.port = raw.target.port ?? 21;
          migrated.user = raw.target.user ?? 'anonymous';
          migrated.protocol = raw.target.protocol === 'sftp' ? 'sftp' : 'ftp';
          migrated.lastPath = raw.target.lastPath || '/';
          profiles = [migrated];
          activeProfileId = migrated.id;
          if (raw.target.password) {
            void saveFtpPassword(migrated.id, raw.target.password);
          }
        }

        if (!profiles.length) {
          const seed = DEFAULT_PROFILE();
          profiles = [seed];
          activeProfileId = seed.id;
        }

        if (!activeProfileId || !profiles.some((profile) => profile.id === activeProfileId)) {
          activeProfileId = profiles[0]?.id ?? null;
        }

        return {
          ...current,
          profiles,
          activeProfileId,
          uploadQueue: raw?.uploadQueue ?? [],
          passwordDrafts: {},
        };
      },
    }
  )
);

export function useActiveFtpProfile(): FtpProfile | null {
  return useFtpStore((state) => {
    const id = state.activeProfileId;
    return state.profiles.find((profile) => profile.id === id) ?? state.profiles[0] ?? null;
  });
}

/** Resolve password: draft in memory, else SecureStore. */
export async function resolveFtpPassword(profileId: string): Promise<string> {
  const draft = useFtpStore.getState().passwordDrafts[profileId];
  if (draft !== undefined && draft !== '') return draft;
  return loadFtpPassword(profileId);
}
