import FtpService, { addProgressListener, makeProgressToken } from '@anttech/react-native-ftp';

import { FtpClient } from '@/services/ftp';
import {
  recoverFtpUploadQueueAfterCrash,
  resolveFtpPassword,
  useFtpStore,
} from '@/stores/ftp';

let pumping = false;

export async function pumpFtpUploadQueue(): Promise<void> {
  if (pumping) return;
  pumping = true;
  try {
    for (;;) {
      const state = useFtpStore.getState();
      if (state.uploadQueue.some((job) => job.status === 'running')) {
        recoverFtpUploadQueueAfterCrash();
      }

      const next = [...state.uploadQueue].reverse().find((job) => job.status === 'pending');
      if (!next) return;

      const profile = state.profiles.find((item) => item.id === next.profileId);
      if (!profile) {
        state.updateUpload(next.id, {
          status: 'error',
          error: 'Profil FTP introuvable.',
        });
        continue;
      }

      state.updateUpload(next.id, { status: 'running', error: null, progress: 0 });
      const password = await resolveFtpPassword(profile.id);
      const client = new FtpClient({
        host: profile.host,
        port: profile.port,
        user: profile.user,
        password,
      });

      const token = makeProgressToken(next.localUri, next.remotePath, false);
      const unsub = addProgressListener((info) => {
        if (info.token !== token) return;
        useFtpStore.getState().updateUpload(next.id, {
          progress: Math.max(0, Math.min(100, Math.round(info.percentage))),
        });
      });

      try {
        await client.connect();
        await client.uploadFile(next.localUri, next.remotePath);
        await client.disconnect().catch(() => undefined);
        useFtpStore.getState().updateUpload(next.id, { status: 'done', progress: 100 });
      } catch (error) {
        await client.disconnect().catch(() => undefined);
        try {
          await FtpService.cancelUploadFile(token);
        } catch {
          // best-effort cancel
        }
        useFtpStore.getState().updateUpload(next.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Envoi FTP impossible.',
        });
      } finally {
        unsub();
      }
    }
  } finally {
    pumping = false;
  }
}

export function enqueueFtpUpload(input: {
  profileId: string;
  fileName: string;
  localUri: string;
  remotePath: string;
}): string {
  const id = useFtpStore.getState().enqueueUpload(input);
  void pumpFtpUploadQueue();
  return id;
}

export function retryFtpUpload(id: string): void {
  useFtpStore.getState().retryUpload(id);
  void pumpFtpUploadQueue();
}
