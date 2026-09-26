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
import { pkgDebug } from './pkgDebug';
import { readPkgMeta } from './pkgMeta';
import { recoverPkgQueueAfterCrash, usePkgSenderStore } from './store';
import type { PkgLocalFile } from './types';
import { FILE_SERVER_PORT } from './types';

const DOWNLOAD_DIRECTORY = 'telechargements';

/** Fixed URL id like pkg-sender Android (`/pkg/pkg`) — one install at a time. */
const SERVE_ID = 'pkg';

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

/**
 * Wait until the console has pulled the full PKG (pkg-sender TrackInstallAsync).
 * Must reach ~100% before revoke — stopping at 98% caused PS4 « Téléchargement
 * impossible » (last ranges hit 404 after revoke).
 */
async function trackConsoleDownload(
  jobId: string,
  serveId: string,
  totalSize: number
): Promise<{ ok: boolean; served: number }> {
  const t0 = Date.now();
  let lastServed = 0;
  let stallSince = t0;
  const maxMs = 6 * 60 * 60 * 1000;
  // Near the end BGFT slows / retries — allow a longer quiet period before fail.
  const stallMs = 180_000;
  let lastLogAt = 0;

  pkgDebug(`attente download console · ${formatMb(totalSize)} (cible 100%)`);

  for (;;) {
    await new Promise((r) => setTimeout(r, 1000));
    const served = httpRangeServer.servedFor(serveId);
    usePkgSenderStore.getState().update(jobId, { served });

    const now = Date.now();
    if (served > lastServed) {
      lastServed = served;
      stallSince = now;
    }

    if (now - lastLogAt > 5000) {
      lastLogAt = now;
      const pct = totalSize > 0 ? Math.round((100 * served) / totalSize) : 0;
      pkgDebug(`progress ${formatMb(served)} / ${formatMb(totalSize)} (${pct}%)`);
    }

    // Exact full size (overlapping Range retries can push served slightly over).
    if (totalSize > 0 && served >= totalSize) {
      pkgDebug(`download OK ${formatMb(served)} (≥ ${formatMb(totalSize)})`);
      return { ok: true, served };
    }
    if (now - stallSince > stallMs) {
      const pct = totalSize > 0 ? Math.round((100 * served) / totalSize) : 0;
      pkgDebug(`stall ${stallMs / 1000}s · served=${formatMb(served)} (${pct}%)`);
      return { ok: totalSize > 0 && served >= totalSize, served };
    }
    if (now - t0 > maxMs) {
      pkgDebug('timeout 6h');
      return { ok: false, served };
    }
  }
}

/** Keep /pkg/pkg registered a bit after 100% so trailing BGFT ranges don't 404. */
async function graceKeepServing(serveId: string, maxMs = 60_000): Promise<void> {
  const t0 = Date.now();
  let lastHit = httpRangeServer.servedFor(serveId);
  let idleSince = t0;
  pkgDebug(`grace keep ${serveId} ≤${maxMs / 1000}s`);
  while (Date.now() - t0 < maxMs) {
    await new Promise((r) => setTimeout(r, 1000));
    const served = httpRangeServer.servedFor(serveId);
    if (served > lastHit) {
      lastHit = served;
      idleSince = Date.now();
    }
    // No more bytes for 12s → console likely done verifying.
    if (Date.now() - idleSince >= 12_000) {
      pkgDebug('grace idle 12s — revoke ok');
      return;
    }
  }
  pkgDebug('grace timeout — revoke');
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
      pkgDebug(`▶ ${next.fileName} (${formatMb(next.size)}) uri=${next.localUri.slice(0, 60)}`);

      try {
        const detected = await getLanIp();
        const lanIp = (state.lanIpOverride.trim() || detected || '').trim();
        pkgDebug(`LAN auto=${detected ?? '—'} override=${state.lanIpOverride || '—'} → ${lanIp || '?'}`);
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
        pkgDebug(`HTTP :${FILE_SERVER_PORT} started`);
        httpRangeServer.setProgressListener((fileId, served) => {
          if (fileId !== SERVE_ID) return;
          usePkgSenderStore.getState().update(next.id, { served });
        });

        const mime = 'application/octet-stream';
        httpRangeServer.registerFile(SERVE_ID, next.localUri, size, mime);
        const url = pkgUrl(lanIp, SERVE_ID);
        pkgDebug(`PKG URL ${url}`);

        const mode =
          state.lastMode && state.lastMode !== 'offline'
            ? state.lastMode
            : await detectConsoleMode(consoleIp);
        usePkgSenderStore.getState().setLastMode(mode);
        pkgDebug(`mode=${mode} console=${consoleIp}`);

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
          pkgDebug(`pull homebrew ok=${result.ok} ${result.reply.slice(0, 80)}`);
          if (!result.ok) throw new Error(result.reply || 'Pull homebrew échoué');
          const tracked = await trackConsoleDownload(next.id, SERVE_ID, size);
          usePkgSenderStore.getState().update(next.id, {
            status: tracked.ok ? 'done' : 'error',
            served: tracked.served,
            error: tracked.ok
              ? null
              : 'Téléchargement console incomplet (réseau / timeout).',
          });
          continue;
        }

        let pkgSize = size;
        if (mode === 'goldhen') {
          const meta = await readPkgMeta(
            next.localUri,
            size,
            next.fileName.replace(/\.pkg$/i, '')
          );
          pkgSize = meta.packageSize > 0 ? meta.packageSize : size;
          pkgDebug(
            `meta title=${meta.title.slice(0, 40)} cid=${meta.contentId || '∅'} type=${meta.contentType || '∅'} digest=${meta.digest.slice(0, 16)}… size=${formatMb(pkgSize)}`
          );
          if (!meta.digest) {
            throw new Error(
              'Digest PKG introuvable — le fichier est peut‑être corrompu ou inaccessible.'
            );
          }
          if (!meta.contentId) {
            throw new Error(
              'CONTENT_ID introuvable dans le PKG — fichier invalide ou illisible.'
            );
          }
          httpRangeServer.registerFile(SERVE_ID, next.localUri, pkgSize, mime);
          const man = buildGoldHenManifest(url, pkgSize, meta.digest);
          httpRangeServer.registerManifest(SERVE_ID, man);
          const manUrl = manifestUrl(lanIp, SERVE_ID);
          pkgDebug(`manifest ${manUrl}`);
          pkgDebug(`inject GoldHEN…`);
          const result = await pushGoldHen({
            consoleIp,
            lanIp,
            manifestUrl: manUrl,
            title: meta.title || next.fileName.replace(/\.pkg$/i, ''),
            contentId: meta.contentId,
            titleId: meta.titleId,
            contentType: meta.contentType,
            packageSize: pkgSize,
          });
          pkgDebug(`GoldHEN reply ok=${result.ok} ${result.reply}`);
          if (!result.ok) throw new Error(result.reply);
        } else {
          pkgDebug(`RPI/receiver install…`);
          const result = await pushInstall({
            consoleIp,
            fileUrl: url,
            name: next.fileName.replace(/\.pkg$/i, ''),
          });
          pkgDebug(`install ok=${result.ok} ${result.reply.slice(0, 100)}`);
          if (!result.ok) throw new Error(result.reply || 'Install refusé');
        }

        const tracked = await trackConsoleDownload(next.id, SERVE_ID, pkgSize);
        if (!tracked.ok) {
          throw new Error(
            tracked.served === 0
              ? `La console n’a pas téléchargé le PKG (IP téléphone ${lanIp} :9898 inaccessible ?).`
              : `Téléchargement coupé (${formatMb(tracked.served)} / ${formatMb(pkgSize)}). Réessaie ou vide les notifs BGFT sur la PS4.`
          );
        }

        // PS4 often still Range-requests the tail after served≥size — don't 404 yet.
        await graceKeepServing(SERVE_ID, 60_000);

        pkgDebug(`✓ done ${next.fileName}`);
        usePkgSenderStore.getState().update(next.id, {
          status: 'done',
          served: tracked.served,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Envoi impossible';
        pkgDebug(`✗ ERROR ${message}`);
        usePkgSenderStore.getState().update(next.id, {
          status: 'error',
          error: message,
        });
      } finally {
        pkgDebug('revoke /pkg/pkg');
        httpRangeServer.revoke(SERVE_ID);
      }
    }
  } finally {
    pumping = false;
  }
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)} Mo`;
}
