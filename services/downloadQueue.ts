import type { DownloadFile } from '@/services/api';
import { downloadResourceFile } from '@/services/download';
import {
  ensureNotificationPermission,
  notifyDownloadDone,
} from '@/services/notifications';
import {
  recoverDownloadQueueAfterCrash,
  useDownloadQueueStore,
  type DownloadJobResource,
} from '@/stores/downloadQueue';
import { useSettingsStore } from '@/stores/settings';

let pumping = false;
const controllers = new Map<string, AbortController>();

/**
 * Processes the download queue one job at a time.
 * Call after enqueue / retry / app focus.
 */
export async function pumpDownloadQueue(): Promise<void> {
  if (pumping) return;
  pumping = true;
  try {
    for (;;) {
      const store = useDownloadQueueStore.getState();
      // Orphaned `running` after a kill would block the queue forever.
      if (store.jobs.some((job) => job.status === 'running')) {
        recoverDownloadQueueAfterCrash();
      }

      const next = [...store.jobs].reverse().find((job) => job.status === 'pending');
      if (!next) return;

      const controller = new AbortController();
      controllers.set(next.id, controller);
      store.updateJob(next.id, { status: 'running', progress: null, error: null });

      const outcome = await downloadResourceFile({
        resource: next.resource,
        file: next.file,
        signal: controller.signal,
        shareAfter: false,
        onProgress: ({ ratio }) => {
          useDownloadQueueStore.getState().updateJob(next.id, { progress: ratio });
        },
      });

      controllers.delete(next.id);

      if (outcome.status === 'cancelled') {
        useDownloadQueueStore.getState().updateJob(next.id, {
          status: 'pending',
          progress: null,
        });
        return;
      }

      if (outcome.status === 'error') {
        useDownloadQueueStore.getState().updateJob(next.id, {
          status: 'error',
          error: outcome.message,
          progress: null,
        });
        continue;
      }

      useDownloadQueueStore.getState().updateJob(next.id, {
        status: 'done',
        progress: 1,
        localUri: outcome.status === 'saved' ? outcome.uri : null,
        error: null,
      });
      await notifyDownloadDone(next.file.fileName);
    }
  } finally {
    pumping = false;
  }
}

/** Enqueue a file and start the worker. */
export async function enqueueDownload(
  resource: DownloadJobResource,
  file: DownloadFile
): Promise<string> {
  if (useSettingsStore.getState().downloadNotifications) {
    void ensureNotificationPermission();
  }
  const id = useDownloadQueueStore.getState().enqueue(resource, file);
  void pumpDownloadQueue();
  return id;
}

export function cancelDownloadJob(id: string): void {
  controllers.get(id)?.abort();
  controllers.delete(id);
}

export function retryDownloadJob(id: string): void {
  useDownloadQueueStore.getState().retryJob(id);
  void pumpDownloadQueue();
}
