import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DownloadFile } from '@/services/api';

import { sanitizeRunningJobs } from '@/services/queueSanitize';
import { zustandStorage } from './storage';

export type DownloadJobStatus = 'pending' | 'running' | 'done' | 'error';

export interface DownloadJobResource {
  id: string;
  title: string;
  platform: string | null;
  logo: string | null;
}

export interface DownloadJob {
  id: string;
  resource: DownloadJobResource;
  file: DownloadFile;
  status: DownloadJobStatus;
  /** 0–1 when known. */
  progress: number | null;
  error: string | null;
  localUri: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DownloadQueueState {
  jobs: DownloadJob[];
  enqueue: (resource: DownloadJobResource, file: DownloadFile) => string;
  updateJob: (id: string, patch: Partial<DownloadJob>) => void;
  retryJob: (id: string) => void;
  removeJob: (id: string) => void;
  clearFinished: () => void;
}

const MAX_JOBS = 80;

function nowIso() {
  return new Date().toISOString();
}

export const useDownloadQueueStore = create<DownloadQueueState>()(
  persist(
    (set, get) => ({
      jobs: [],
      enqueue: (resource, file) => {
        const id = `${resource.id}:${file.key}:${Date.now()}`;
        const stamp = nowIso();
        const job: DownloadJob = {
          id,
          resource,
          file,
          status: 'pending',
          progress: null,
          error: null,
          localUri: null,
          createdAt: stamp,
          updatedAt: stamp,
        };
        set((state) => ({
          jobs: [job, ...state.jobs].slice(0, MAX_JOBS),
        }));
        return id;
      },
      updateJob: (id, patch) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, ...patch, updatedAt: nowIso() } : job
          ),
        })),
      retryJob: (id) => {
        const job = get().jobs.find((entry) => entry.id === id);
        if (!job) return;
        set((state) => ({
          jobs: state.jobs.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  status: 'pending' as const,
                  progress: null,
                  error: null,
                  updatedAt: nowIso(),
                }
              : entry
          ),
        }));
      },
      removeJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
        })),
      clearFinished: () =>
        set((state) => ({
          jobs: state.jobs.filter(
            (job) => job.status === 'pending' || job.status === 'running'
          ),
        })),
    }),
    {
      name: 'lbxmb.downloadQueue',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        // Drop in-flight progress across restarts; pending/error/done stay.
        jobs: sanitizeRunningJobs(state.jobs, { progress: null }),
      }),
      merge: (persisted, current) => {
        const raw = persisted as { jobs?: DownloadJob[] } | null;
        const jobs = sanitizeRunningJobs(raw?.jobs ?? current.jobs, {
          progress: null,
          error: null,
        });
        return { ...current, jobs };
      },
    }
  )
);

/** Mark orphaned `running` jobs as pending after a process kill. */
export function recoverDownloadQueueAfterCrash(): number {
  const { jobs } = useDownloadQueueStore.getState();
  const n = jobs.filter((job) => job.status === 'running').length;
  if (n === 0) return 0;
  useDownloadQueueStore.setState({
    jobs: jobs.map((job) =>
      job.status === 'running'
        ? {
            ...job,
            status: 'pending' as const,
            progress: null,
            error: null,
            updatedAt: nowIso(),
          }
        : job
    ),
  });
  return n;
}
