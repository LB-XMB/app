import { useEffect } from 'react';

import { pumpDownloadQueue } from '@/services/downloadQueue';
import { pumpFtpUploadQueue } from '@/services/ftpUploadQueue';
import { pumpPkgSendQueue, recoverPkgQueueAfterCrash } from '@/services/pkgSender';
import { recoverDownloadQueueAfterCrash } from '@/stores/downloadQueue';
import { recoverFtpUploadQueueAfterCrash } from '@/stores/ftp';

/**
 * After MMKV rehydrate: clear orphaned `running` jobs and resume pumps.
 * Mounted once under AppProviders.
 */
export function QueueBootstrap() {
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      recoverDownloadQueueAfterCrash();
      recoverFtpUploadQueueAfterCrash();
      recoverPkgQueueAfterCrash();
      void pumpDownloadQueue();
      void pumpFtpUploadQueue();
      void pumpPkgSendQueue();
    };

    // Persist middleware is sync on MMKV, but wait a tick so stores finish merge.
    const timer = setTimeout(run, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
