import FtpService, { addProgressListener, makeProgressToken } from '@anttech/react-native-ftp';
import { File } from 'expo-file-system';

import { FtpClient } from '@/services/ftp';
import { ensureLocalFileUri } from '@/services/pickDeviceFiles';
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

      let localUri = next.localUri;
      let staged = false;
      try {
        const prepared = await ensureLocalFileUri(next.localUri, next.fileName);
        staged = prepared !== next.localUri;
        localUri = prepared;
      } catch (error) {
        useFtpStore.getState().updateUpload(next.id, {
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : 'Impossible de préparer le fichier pour le FTP.',
        });
        continue;
      }

      const token = makeProgressToken(localUri, next.remotePath, false);
      const unsub = addProgressListener((info) => {
        if (info.token !== token) return;
        useFtpStore.getState().updateUpload(next.id, {
          progress: Math.max(0, Math.min(100, Math.round(info.percentage))),
        });
      });

      try {
        await client.connect();
        await client.uploadFile(localUri, next.remotePath);
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
        if (staged) {
          try {
            const file = new File(localUri);
            if (file.exists) file.delete();
          } catch {
            /* ignore */
          }
        }
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
