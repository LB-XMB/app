import { File } from 'expo-file-system';

import { FtpClient } from '@/services/ftp';
import {
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
      if (state.uploadQueue.some((job) => job.status === 'running')) return;

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

      state.updateUpload(next.id, { status: 'running', error: null });
      const password = await resolveFtpPassword(profile.id);
      const client = new FtpClient({
        host: profile.host,
        port: profile.port,
        user: profile.user,
        password,
        protocol: profile.protocol,
      });

      try {
        await client.connect();
        const bytes = await new File(next.localUri).bytes();
        await client.upload(next.remotePath, bytes);
        await client.disconnect().catch(() => undefined);
        useFtpStore.getState().updateUpload(next.id, { status: 'done' });
      } catch (error) {
        await client.disconnect().catch(() => undefined);
        useFtpStore.getState().updateUpload(next.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Envoi FTP impossible.',
        });
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
