import { Directory, File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export interface PickedDeviceFile {
  name: string;
  uri: string;
  size: number;
  mimeType: string | null;
}

/** Never stage multi‑GB PKG/ISO into the app cache (fills dcache / black screen). */
export const MAX_CACHE_STAGING_BYTES = 48 * 1024 * 1024; // 48 Mo

const STAGING_DIR = 'device-staging';
const DOCUMENT_PICKER_DIR = 'DocumentPicker';

/**
 * Opens the native Android / iOS document picker.
 * Always without copying into the app cache — multi‑GB PKG stay as content://.
 */
export async function pickDeviceFiles(options?: {
  multiple?: boolean;
  /** MIME types; defaults to any file. */
  type?: string | string[];
}): Promise<PickedDeviceFile[]> {
  if (Platform.OS === 'web') {
    throw new Error('Sélection de fichiers indisponible sur le web.');
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: options?.type ?? '*/*',
    // Hard forbid cache copies — a 3–5 Go PKG filled dcache previously.
    copyToCacheDirectory: false,
    multiple: options?.multiple ?? true,
  });

  if (result.canceled || !result.assets?.length) return [];

  return result.assets.map((asset) => {
    const name = asset.name || asset.uri.split('/').pop() || 'fichier';
    let size = typeof asset.size === 'number' ? asset.size : 0;
    if (size <= 0) {
      try {
        const file = new File(asset.uri);
        size = file.size ?? 0;
      } catch {
        /* keep 0 */
      }
    }
    return {
      name,
      uri: asset.uri,
      size,
      mimeType: asset.mimeType ?? null,
    };
  });
}

function isAlreadyLocalPath(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('/');
}

/**
 * Native FTP needs a real filesystem path.
 * - file:// → as-is
 * - content:// small files → optional stream copy into cache (≤ 48 Mo)
 * - content:// large files → refuse (never fill dcache with PKG)
 */
export async function ensureLocalFileUri(
  uri: string,
  fileName: string,
  knownSize = 0
): Promise<string> {
  if (isAlreadyLocalPath(uri)) return uri;

  let size = knownSize;
  if (size <= 0) {
    try {
      size = new File(uri).size ?? 0;
    } catch {
      size = 0;
    }
  }

  if (size > MAX_CACHE_STAGING_BYTES) {
    throw new Error(
      'Fichier trop volumineux pour le cache de l’app. Utilise « Depuis les téléchargements » ou l’onglet PKG (lecture directe, sans copie).'
    );
  }

  // Unknown size on content:// — still refuse blind multi‑GB copies.
  if (size <= 0) {
    throw new Error(
      'Impossible de préparer ce fichier sans le copier. Choisis-le depuis le dossier téléchargements de l’app.'
    );
  }

  const safe = fileName.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'fichier';
  const dir = new Directory(Paths.cache, STAGING_DIR);
  if (!dir.exists) dir.create({ intermediates: true });
  const dest = new File(dir, safe);
  if (dest.exists) {
    try {
      dest.delete();
    } catch {
      /* overwrite via copy */
    }
  }
  await new File(uri).copy(dest);
  return dest.uri;
}

/** Wipe DocumentPicker + device-staging leftovers under the app cache. */
export function clearDeviceFileCache(): number {
  if (Platform.OS === 'web') return 0;
  let freed = 0;
  for (const name of [STAGING_DIR, DOCUMENT_PICKER_DIR]) {
    try {
      const directory = new Directory(Paths.cache, name);
      if (!directory.exists) continue;
      freed += directorySize(directory);
      directory.delete();
    } catch {
      /* ignore */
    }
  }
  return freed;
}

function directorySize(directory: Directory): number {
  try {
    return directory.list().reduce((total, entry) => {
      if (entry instanceof File) return total + (entry.size ?? 0);
      if (entry instanceof Directory) return total + directorySize(entry);
      return total;
    }, 0);
  } catch {
    return 0;
  }
}

const PKG_EXT = ['.pkg'];
const IMAGE_EXT = ['.exfat', '.ffpkg', '.ffpfsc'];

export function isPkgOrDiscImage(fileName: string): 'pkg' | 'image' | null {
  const lower = fileName.toLowerCase();
  if (PKG_EXT.some((ext) => lower.endsWith(ext))) return 'pkg';
  if (IMAGE_EXT.some((ext) => lower.endsWith(ext))) return 'image';
  return null;
}
