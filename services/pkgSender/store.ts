import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { sanitizeRunningJobs } from '@/services/queueSanitize';
import { zustandStorage } from '@/stores/storage';

import type { ConsoleMode, PkgSendJob } from './types';

interface PkgSenderState {
  consoleIp: string;
  lastMode: ConsoleMode | null;
  /** Prefer one-by-one install (PS4). */
  ps4Mode: boolean;
  queue: PkgSendJob[];
  setConsoleIp: (ip: string) => void;
  setLastMode: (mode: ConsoleMode | null) => void;
  setPs4Mode: (value: boolean) => void;
  enqueue: (job: Omit<PkgSendJob, 'id' | 'status' | 'error' | 'served' | 'createdAt'>) => string;
  update: (id: string, patch: Partial<PkgSendJob>) => void;
  retry: (id: string) => void;
  clearFinished: () => void;
}

export const usePkgSenderStore = create<PkgSenderState>()(
  persist(
    (set) => ({
      consoleIp: '',
      lastMode: null,
      ps4Mode: false,
      queue: [],
      setConsoleIp: (consoleIp) => set({ consoleIp }),
      setLastMode: (lastMode) => set({ lastMode }),
      setPs4Mode: (ps4Mode) => set({ ps4Mode }),
      enqueue: (job) => {
        const id = `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const entry: PkgSendJob = {
          ...job,
          id,
          status: 'pending',
          error: null,
          served: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ queue: [entry, ...state.queue].slice(0, 40) }));
        return id;
      },
      update: (id, patch) =>
        set((state) => ({
          queue: state.queue.map((job) => (job.id === id ? { ...job, ...patch } : job)),
        })),
      retry: (id) =>
        set((state) => ({
          queue: state.queue.map((job) =>
            job.id === id ? { ...job, status: 'pending' as const, error: null, served: 0 } : job,
          ),
        })),
      clearFinished: () =>
        set((state) => ({
          queue: state.queue.filter((job) => job.status === 'pending' || job.status === 'running'),
        })),
    }),
    {
      name: 'lbxmb.pkgSender',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        consoleIp: state.consoleIp,
        ps4Mode: state.ps4Mode,
        queue: sanitizeRunningJobs(state.queue, { served: 0 }),
      }),
      merge: (persisted, current) => {
        const raw = persisted as Partial<PkgSenderState> | null;
        return {
          ...current,
          consoleIp: raw?.consoleIp ?? current.consoleIp,
          ps4Mode: raw?.ps4Mode ?? current.ps4Mode,
          queue: sanitizeRunningJobs(raw?.queue ?? [], { error: null, served: 0 }),
          lastMode: null,
        };
      },
    },
  ),
);

export function recoverPkgQueueAfterCrash(): number {
  const { queue } = usePkgSenderStore.getState();
  const stuck = queue.filter((job) => job.status === 'running');
  if (stuck.length === 0) return 0;
  usePkgSenderStore.setState({
    queue: queue.map((job) =>
      job.status === 'running' ? { ...job, status: 'pending' as const, error: null } : job,
    ),
  });
  return stuck.length;
}
