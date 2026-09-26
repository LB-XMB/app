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
 * Files are copied into the app cache so native FTP / HTTP can read them.
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
    copyToCacheDirectory: true,
    multiple: options?.multiple ?? true,
  });

  if (result.canceled || !result.assets?.length) return [];

  return result.assets.map((asset) => ({
    name: asset.name || asset.uri.split('/').pop() || 'fichier',
    uri: asset.uri,
    size: typeof asset.size === 'number' ? asset.size : 0,
    mimeType: asset.mimeType ?? null,
  }));
}

const PKG_EXT = ['.pkg'];
const IMAGE_EXT = ['.exfat', '.ffpkg', '.ffpfsc'];

export function isPkgOrDiscImage(fileName: string): 'pkg' | 'image' | null {
  const lower = fileName.toLowerCase();
  if (PKG_EXT.some((ext) => lower.endsWith(ext))) return 'pkg';
  if (IMAGE_EXT.some((ext) => lower.endsWith(ext))) return 'image';
  return null;
}
