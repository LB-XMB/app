import {
  EncodingType,
  StorageAccessFramework,
  copyAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

import { useSettingsStore, type DownloadDestinationMode } from '@/stores/settings';

/** Guess a MIME type so Android SAF / the share sheet get a sensible type. */
export function mimeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pkg: 'application/octet-stream',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    json: 'application/json',
    txt: 'text/plain',
    bin: 'application/octet-stream',
  };
  return map[ext] ?? 'application/octet-stream';
}

/** Human-readable label from an Android SAF tree URI. */
export function labelFromSafUri(uri: string): string {
  try {
    const decoded = decodeURIComponent(uri);
    const match =
      decoded.match(/tree\/[^:]+:(.+)$/) ??
      decoded.match(/document\/[^:]+:(.+)$/) ??
      decoded.match(/:([^/?#]+)$/);
    if (match?.[1]) return match[1].replace(/\//g, ' › ');
  } catch {
    /* ignore */
  }
  return 'Dossier choisi';
}

const IOS_FOLDER_LABEL = "Fichiers › LB'XMB";

function setDestination(
  mode: Exclude<DownloadDestinationMode, 'unset'>,
  folderUri: string | null,
  folderName: string | null
): void {
  useSettingsStore.getState().setDownloadDestination({ mode, folderUri, folderName });
}

/** Persist “ask every time” (native share / Save to Files). */
export function setDownloadAskEachTime(): void {
  setDestination('ask', null, null);
}

/**
 * Opens the system folder picker (Android SAF) or pins the app Documents
 * folder visible in iOS Files.
 */
export async function pickDownloadFolder(): Promise<boolean> {
  if (Platform.OS === 'web') {
    setDestination('ask', null, null);
    return true;
  }

  if (Platform.OS === 'android') {
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return false;
    setDestination(
      'folder',
      permissions.directoryUri,
      labelFromSafUri(permissions.directoryUri)
    );
    return true;
  }

  // iOS: no persistent write bookmark via Expo — Documents show up in Files.
  setDestination('folder', null, IOS_FOLDER_LABEL);
  return true;
}

/**
 * First download (or when preference is unset): ask whether to always use a
 * folder or choose the location each time via the system UI.
 */
export function ensureDownloadDestinationReady(): Promise<boolean> {
  const mode = useSettingsStore.getState().downloadDestinationMode;
  if (mode !== 'unset') return Promise.resolve(true);
  if (Platform.OS === 'web') {
    setDownloadAskEachTime();
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    Alert.alert(
      'Enregistrer les ressources',
      Platform.OS === 'android'
        ? 'Tu peux fixer un dossier (Explorateur de fichiers) ou choisir où enregistrer à chaque téléchargement.'
        : 'Tu peux enregistrer dans le dossier de l’app (visible dans Fichiers) ou choisir l’emplacement à chaque fois via Fichiers.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Choisir à chaque fois',
          onPress: () => {
            setDownloadAskEachTime();
            resolve(true);
          },
        },
        {
          text: 'Dossier par défaut',
          onPress: () => {
            void pickDownloadFolder().then(resolve);
          },
        },
      ]
    );
  });
}

async function copyToSafFolder(
  localUri: string,
  folderUri: string,
  fileName: string
): Promise<string> {
  const mime = mimeFromFileName(fileName);
  const dest = await StorageAccessFramework.createFileAsync(folderUri, fileName, mime);
  try {
    await copyAsync({ from: localUri, to: dest });
  } catch {
    // Some providers reject copyAsync — fall back to base64 write.
    const base64 = await readAsStringAsync(localUri, { encoding: EncodingType.Base64 });
    await writeAsStringAsync(dest, base64, { encoding: EncodingType.Base64 });
  }
  return dest;
}

/**
 * After a sandbox download: copy into the default SAF folder, or open the
 * native share / Save-to-Files sheet when the user asked to choose each time.
 */
export async function placeDownloadedFile(
  localUri: string,
  fileName: string
): Promise<{ uri: string; shared: boolean }> {
  const { downloadDestinationMode, downloadFolderUri } = useSettingsStore.getState();

  if (downloadDestinationMode === 'folder') {
    if (Platform.OS === 'android' && downloadFolderUri) {
      try {
        const uri = await copyToSafFolder(localUri, downloadFolderUri, fileName);
        return { uri, shared: false };
      } catch {
        // Permission revoked or provider error — fall through to share sheet.
      }
    }
    // iOS folder mode: already in Documents (Files). Nothing else to do.
    if (Platform.OS === 'ios') {
      return { uri: localUri, shared: false };
    }
  }

  // `ask`, `unset`, or Android folder fallback → native explorer / Fichiers.
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(localUri, {
      dialogTitle: `Enregistrer ${fileName}`,
      mimeType: mimeFromFileName(fileName),
      UTI: 'public.item',
    });
    return { uri: localUri, shared: true };
  }

  return { uri: localUri, shared: false };
}

/** Short label for Settings. */
export function downloadDestinationSummary(
  mode: DownloadDestinationMode,
  folderName: string | null
): string {
  if (mode === 'unset') return 'Non défini — demandé au premier téléchargement';
  if (mode === 'ask') return 'Choisir à chaque fois (explorateur / Fichiers)';
  return folderName ? `Dossier : ${folderName}` : 'Dossier de l’app';
}
