import * as WebBrowser from 'expo-web-browser';
import {
  BarChart3,
  Bell,
  ExternalLink,
  FileLock2,
  HardDrive,
  Moon,
  Smartphone,
  Sun,
  Trash2,
  Vibrate,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { WEB_URLS } from '@/services/api';
import { clearDownloadedFiles, downloadedBytes, formatBytes } from '@/services/download';
import { ensureNotificationPermission } from '@/services/notifications';
import { useSettingsStore, type ThemePreference } from '@/stores/settings';
import {
  Chip,
  IconBadge,
  List,
  ListSectionTitle,
  Screen,
  Typography,
} from '@/ui/components';
import { screenPadding, spacing, useColors } from '@/ui/theme';

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'auto', label: 'Système', icon: Smartphone },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'light', label: 'Clair', icon: Sun },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/parametres');

  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const consent = useSettingsStore((state) => state.consent);
  const setConsent = useSettingsStore((state) => state.setConsent);
  const consentDate = useSettingsStore((state) => state.consentDate);
  const haptics = useSettingsStore((state) => state.hapticsEnabled);
  const setHaptics = useSettingsStore((state) => state.setHapticsEnabled);
  const downloadNotifications = useSettingsStore((state) => state.downloadNotifications);
  const setDownloadNotifications = useSettingsStore((state) => state.setDownloadNotifications);

  const [cacheSize, setCacheSize] = useState(() => downloadedBytes());

  const clearCache = () => {
    Alert.alert(
      'Supprimer les fichiers ?',
      'Les fichiers téléchargés dans l’app seront effacés. L’historique est conservé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            clearDownloadedFiles();
            setCacheSize(0);
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <ScreenHeader title="Paramètres" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.group}>
          <ListSectionTitle>Apparence</ListSectionTitle>
          <View style={styles.chips}>
            {THEMES.map(({ value, label, icon: ThemeIcon }) => {
              const selected = theme === value;
              return (
                <Chip
                  key={value}
                  label={label}
                  selected={selected}
                  onPress={() => setTheme(value)}
                  leading={
                    <ThemeIcon
                      size={13}
                      color={selected ? colors.onPrimary : colors.textSecondary}
                      strokeWidth={2.4}
                    />
                  }
                />
              );
            })}
          </View>
          <List>
            <List.Item
              title="Retours haptiques"
              subtitle="Vibration légère à chaque appui"
              leading={<IconBadge icon={Vibrate} color={colors.primary} size={30} />}
              trailing={
                <Switch
                  value={haptics}
                  onValueChange={setHaptics}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.onPrimary}
                />
              }
            />
            <List.Item
              title="Notifs téléchargements"
              subtitle="Alerte locale quand un fichier est prêt"
              leading={<IconBadge icon={Bell} color={colors.accent} size={30} />}
              trailing={
                <Switch
                  value={downloadNotifications}
                  onValueChange={(enabled) => {
                    setDownloadNotifications(enabled);
                    if (enabled) void ensureNotificationPermission();
                  }}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.onPrimary}
                />
              }
            />
          </List>
        </View>

        <View style={styles.group}>
          <ListSectionTitle>Confidentialité</ListSectionTitle>
          <List>
            <List.Item
              title="Statistiques d’usage"
              subtitle={
                consent === 'full'
                  ? 'Activées — mesure anonyme via Umami'
                  : 'Désactivées — rien ne quitte l’appareil'
              }
              leading={
                <IconBadge
                  icon={BarChart3}
                  color={consent === 'full' ? colors.success : colors.textSecondary}
                  size={30}
                />
              }
              trailing={
                <Switch
                  value={consent === 'full'}
                  onValueChange={(enabled) => setConsent(enabled ? 'full' : 'none')}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.onPrimary}
                />
              }
            />
            <List.Item
              title="Politique de confidentialité"
              subtitle={
                consentDate ? `Choix enregistré le ${formatDate(consentDate)}` : undefined
              }
              leading={<IconBadge icon={FileLock2} color={colors.textSecondary} size={30} />}
              trailing={
                <ExternalLink size={15} color={colors.textTertiary} strokeWidth={2.3} />
              }
              onPress={() => void WebBrowser.openBrowserAsync(WEB_URLS.privacy)}
            />
          </List>
          <Typography variant="caption" color="tertiary">
            Aucun identifiant n’est envoyé : Umami ne mesure que les écrans visités et les
            actions principales, sans lien avec ton compte lbxmb.fr.
          </Typography>
        </View>

        <View style={styles.group}>
          <ListSectionTitle>Stockage</ListSectionTitle>
          <List>
            <List.Item
              title="Fichiers téléchargés"
              subtitle={cacheSize > 0 ? formatBytes(cacheSize) : 'Rien à supprimer'}
              leading={<IconBadge icon={HardDrive} color={colors.warning} size={30} />}
              trailing={
                cacheSize > 0 ? (
                  <Trash2 size={16} color={colors.danger} strokeWidth={2.3} />
                ) : undefined
              }
              onPress={cacheSize > 0 ? clearCache : undefined}
            />
          </List>
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  group: {
    gap: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
