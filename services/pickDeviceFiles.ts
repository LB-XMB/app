import { Directory, File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export interface PickedDeviceFile {
  name: string;
  uri: string;
  size: number;
  mimeType: string | null;
}

/**
 * Opens the native Android / iOS document picker.
 *
 * Default: **no** copy into the app cache. Copying a multi‑GB PKG freezes /
 * OOM the app (black screen). PKG reads the picker URI (`content://`) directly.
 */
export async function pickDeviceFiles(options?: {
  multiple?: boolean;
  /** MIME types; defaults to any file. */
  type?: string | string[];
  /**
   * Force a cache copy. Prefer `false` for large PKG/ISO.
   * @default false
   */
  copyToCacheDirectory?: boolean;
}): Promise<PickedDeviceFile[]> {
  if (Platform.OS === 'web') {
    throw new Error('Sélection de fichiers indisponible sur le web.');
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: options?.type ?? '*/*',
    copyToCacheDirectory: options?.copyToCacheDirectory ?? false,
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

/**
 * Native FTP needs a real filesystem path. Materialize `content://` (etc.)
 * into the cache via a native stream copy — not a JS base64 load.
 */
export async function ensureLocalFileUri(uri: string, fileName: string): Promise<string> {
  if (uri.startsWith('file://') || uri.startsWith('/')) return uri;

  const safe = fileName.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'fichier';
  const dir = new Directory(Paths.cache, 'device-staging');
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

const PKG_EXT = ['.pkg'];
const IMAGE_EXT = ['.exfat', '.ffpkg', '.ffpfsc'];

export function isPkgOrDiscImage(fileName: string): 'pkg' | 'image' | null {
  const lower = fileName.toLowerCase();
  if (PKG_EXT.some((ext) => lower.endsWith(ext))) return 'pkg';
  if (IMAGE_EXT.some((ext) => lower.endsWith(ext))) return 'image';
  return null;
}
