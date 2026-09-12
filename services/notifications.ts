import { Platform } from 'react-native';

import { useSettingsStore } from '@/stores/settings';

/** Local notifications for finished downloads (opt-in). Requires a native rebuild. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export async function notifyDownloadDone(fileName: string): Promise<void> {
  if (!useSettingsStore.getState().downloadNotifications) return;
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    const granted = await ensureNotificationPermission();
    if (!granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('downloads', {
        name: 'Téléchargements',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Téléchargement terminé',
        body: fileName,
        ...(Platform.OS === 'android' ? { channelId: 'downloads' } : {}),
      },
      trigger: null,
    });
  } catch {
    // Notifications must never break the download flow.
  }
}
