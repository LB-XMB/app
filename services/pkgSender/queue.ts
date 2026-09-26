import { Directory, File, Paths } from 'expo-file-system';

import {
  buildGoldHenManifest,
  detectConsoleMode,
  manifestUrl,
  pkgUrl,
  pullToHomebrew,
  pushInstall,
} from './consoleInstall';
import { pushGoldHen } from './goldhen';
import { httpRangeServer } from './httpRangeServer';
import { getLanIp } from './lanIp';
import { readPkgMeta } from './pkgMeta';
import { recoverPkgQueueAfterCrash, usePkgSenderStore } from './store';
import type { PkgLocalFile } from './types';
import { FILE_SERVER_PORT } from './types';

const DOWNLOAD_DIRECTORY = 'telechargements';

const IMAGE_EXT = ['.exfat', '.ffpkg', '.ffpfsc'];

let pumping = false;

export function listLocalPkgFiles(): PkgLocalFile[] {
  try {
    const directory = new Directory(Paths.document, DOWNLOAD_DIRECTORY);
    if (!directory.exists) return [];
    return directory
      .list()
      .filter((entry): entry is File => entry instanceof File)
      .map((file) => {
        const lower = file.name.toLowerCase();
        const isImage = IMAGE_EXT.some((ext) => lower.endsWith(ext));
        const isPkg = lower.endsWith('.pkg');
        if (!isPkg && !isImage) return null;
        return {
          id: file.name,
          name: file.name,
          uri: file.uri,
          size: file.size ?? 0,
          kind: isImage ? ('image' as const) : ('pkg' as const),
        };
      })
      .filter((item): item is PkgLocalFile => item !== null);
  } catch {
    return [];
  }
}

export function enqueuePkgSend(file: PkgLocalFile): string {
  const id = usePkgSenderStore.getState().enqueue({
    fileId: file.id,
    fileName: file.name,
    localUri: file.uri,
    size: file.size,
    kind: file.kind,
  });
  void pumpPkgSendQueue();
  return id;
}

export function retryPkgSend(id: string): void {
  usePkgSenderStore.getState().retry(id);
  void pumpPkgSendQueue();
}

export async function pumpPkgSendQueue(): Promise<void> {
  if (pumping) return;
  pumping = true;
  try {
    recoverPkgQueueAfterCrash();

    for (;;) {
      const state = usePkgSenderStore.getState();
      if (state.queue.some((job) => job.status === 'running')) {
        recoverPkgQueueAfterCrash();
      }

      const next = [...state.queue].reverse().find((job) => job.status === 'pending');
      if (!next) return;

      const consoleIp = state.consoleIp.trim();
      if (!consoleIp) {
        state.update(next.id, {
          status: 'error',
          error: 'Indique l’IP de la console.',
        });
        continue;
      }

      state.update(next.id, { status: 'running', error: null, served: 0 });

      try {
        const lanIp = await getLanIp();
        if (!lanIp) {
          throw new Error('IP LAN du téléphone introuvable (Wi-Fi requis).');
        }

        let size = next.size;
        if (size <= 0) {
          try {
            const file = new File(next.localUri);
            size = file.size ?? 0;
          } catch {
            size = 0;
          }
          if (size > 0) {
            usePkgSenderStore.getState().update(next.id, { size });
          }
        }
        if (size <= 0) {
          throw new Error('Taille du fichier inconnue — resélectionne le PKG.');
        }

        await httpRangeServer.start(FILE_SERVER_PORT);
        httpRangeServer.setProgressListener((fileId, served) => {
          if (fileId !== next.id) return;
          usePkgSenderStore.getState().update(next.id, { served });
        });

        const mime =
          next.kind === 'pkg' ? 'application/octet-stream' : 'application/octet-stream';
        httpRangeServer.registerFile(next.id, next.localUri, size, mime);
        const url = pkgUrl(lanIp, next.id);

        const mode =
          state.lastMode && state.lastMode !== 'offline'
            ? state.lastMode
            : await detectConsoleMode(consoleIp);
        usePkgSenderStore.getState().setLastMode(mode);

        if (mode === 'offline') {
          throw new Error('Console hors ligne — démarre RPI / pkg-receiver / GoldHEN.');
        }

        if (next.kind === 'image') {
          if (mode !== 'ps5' && mode !== 'rpi') {
            throw new Error('Copie images : PS5 receiver requis (port 12800).');
          }
          const result = await pullToHomebrew({
            consoleIp,
            fileUrl: url,
            remoteName: next.fileName,
          });
          if (!result.ok) throw new Error(result.reply || 'Pull homebrew échoué');
          usePkgSenderStore.getState().update(next.id, {
            status: 'done',
            served: size,
          });
          continue;
        }

        if (mode === 'goldhen') {
          const meta = await readPkgMeta(
            next.localUri,
            size,
            next.fileName.replace(/\.pkg$/i, '')
          );
          const pkgSize = meta.packageSize > 0 ? meta.packageSize : size;
          if (!meta.digest) {
            throw new Error(
              'Digest PKG introuvable — le fichier est peut‑être corrompu ou inaccessible.'
            );
          }
          // Manifest must use real packageDigest (CNT+0xFE0); empty digest → BGFT errors.
          const man = buildGoldHenManifest(url, pkgSize, meta.digest);
          httpRangeServer.registerManifest(next.id, man);
          // Keep registered size in sync with meta (picker size can be 0).
          httpRangeServer.registerFile(next.id, next.localUri, pkgSize, mime);
          const result = await pushGoldHen({
            consoleIp,
            lanIp,
            manifestUrl: manifestUrl(lanIp, next.id),
            title: meta.title || next.fileName.replace(/\.pkg$/i, ''),
            contentId: meta.contentId,
            titleId: meta.titleId,
            contentType: meta.contentType,
            packageSize: pkgSize,
          });
          if (!result.ok) throw new Error(result.reply);
        } else {
          const result = await pushInstall({
            consoleIp,
            fileUrl: url,
            name: next.fileName.replace(/\.pkg$/i, ''),
          });
          if (!result.ok) throw new Error(result.reply || 'Install refusé');
        }

        // Wait until most of the file was served (console download), with timeout.
        const deadline = Date.now() + Math.max(60_000, size / 50_000);
        while (Date.now() < deadline) {
          const served = httpRangeServer.servedFor(next.id);
          usePkgSenderStore.getState().update(next.id, { served });
          if (size > 0 && served >= size * 0.98) break;
          if (state.ps4Mode && served > 0 && served >= size) break;
          await new Promise((r) => setTimeout(r, 500));
        }

        usePkgSenderStore.getState().update(next.id, {
          status: 'done',
          served: Math.max(httpRangeServer.servedFor(next.id), size),
        });
      } catch (error) {
        usePkgSenderStore.getState().update(next.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Envoi impossible',
        });
      } finally {
        httpRangeServer.revoke(next.id);
      }

      // PS4: strict one-by-one — already serial in this loop.
    }
  } finally {
    pumping = false;
  }
}
