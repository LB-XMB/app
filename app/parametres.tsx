import * as WebBrowser from 'expo-web-browser';
import {
  BarChart3,
  Bell,
  ExternalLink,
  FileLock2,
  HardDrive,
  Languages,
  Lock,
  Moon,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Vibrate,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { canUseAppLock } from '@/components/AppLockGate';
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

const THEMES: { value: ThemePreference; icon: typeof Sun }[] = [
  { value: 'auto', icon: Smartphone },
  { value: 'dark', icon: Moon },
  { value: 'light', icon: Sun },
];

const LANGS: { value: 'system' | 'fr' | 'en'; labelKey: string }[] = [
  { value: 'system', labelKey: 'settings.langSystem' },
  { value: 'fr', labelKey: 'settings.langFr' },
  { value: 'en', labelKey: 'settings.langEn' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
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
  const forumInboxEnabled = useSettingsStore((state) => state.forumInboxEnabled);
  const setForumInboxEnabled = useSettingsStore((state) => state.setForumInboxEnabled);
  const appLockEnabled = useSettingsStore((state) => state.appLockEnabled);
  const setAppLockEnabled = useSettingsStore((state) => state.setAppLockEnabled);
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const kawaiiLogo = useSettingsStore((state) => state.kawaiiLogo);
  const setKawaiiLogo = useSettingsStore((state) => state.setKawaiiLogo);

  const [cacheSize, setCacheSize] = useState(() => downloadedBytes());
  const [lockAvailable, setLockAvailable] = useState(false);

  useEffect(() => {
    void canUseAppLock().then(setLockAvailable);
  }, []);

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

  const themeLabel = (value: ThemePreference) => {
    if (value === 'auto') return t('settings.langSystem');
    if (value === 'dark') return 'Sombre';
    return 'Clair';
  };

  return (
    <Screen>
      <ScreenHeader title={t('settings.title')} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.group}>
          <ListSectionTitle>{t('settings.notifications')}</ListSectionTitle>
          <List>
            <List.Item
              title={t('settings.downloadNotifs')}
              subtitle={t('settings.downloadNotifsHint')}
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
            <List.Item
              title={t('settings.forumInbox')}
              subtitle={t('settings.forumInboxHint')}
              leading={<IconBadge icon={Bell} color={colors.warning} size={30} />}
              trailing={
                <Switch
                  value={forumInboxEnabled}
                  onValueChange={(enabled) => {
                    setForumInboxEnabled(enabled);
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
          <ListSectionTitle>{t('settings.security')}</ListSectionTitle>
          <List>
            <List.Item
              title={t('settings.appLock')}
              subtitle={
                lockAvailable ? t('settings.appLockHint') : t('settings.appLockUnavailable')
              }
              leading={<IconBadge icon={Lock} color={colors.primary} size={30} />}
              trailing={
                <Switch
                  value={appLockEnabled && lockAvailable}
                  disabled={!lockAvailable}
                  onValueChange={setAppLockEnabled}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.onPrimary}
                />
              }
            />
          </List>
        </View>

        <View style={styles.group}>
          <ListSectionTitle>{t('settings.language')}</ListSectionTitle>
          <View style={styles.chips}>
            {LANGS.map(({ value, labelKey }) => {
              const selected = language === value;
              return (
                <Chip
                  key={value}
                  label={t(labelKey)}
                  selected={selected}
                  onPress={() => setLanguage(value)}
                  leading={
                    <Languages
                      size={13}
                      color={selected ? colors.onPrimary : colors.textSecondary}
                      strokeWidth={2.4}
                    />
                  }
                />
              );
            })}
          </View>
        </View>

        <View style={styles.group}>
          <ListSectionTitle>{t('settings.appearance')}</ListSectionTitle>
          <View style={styles.chips}>
            {THEMES.map(({ value, icon: ThemeIcon }) => {
              const selected = theme === value;
              return (
                <Chip
                  key={value}
                  label={themeLabel(value)}
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
              title={t('settings.kawaiiLogo')}
              subtitle={t('settings.kawaiiLogoHint')}
              leading={<IconBadge icon={Sparkles} color={colors.accent} size={30} />}
              trailing={
                <Switch
                  value={kawaiiLogo}
                  onValueChange={setKawaiiLogo}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.onPrimary}
                />
              }
            />
            <List.Item
              title={t('settings.haptics')}
              subtitle={t('settings.hapticsHint')}
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
          </List>
        </View>

        <View style={styles.group}>
          <ListSectionTitle>{t('settings.privacy')}</ListSectionTitle>
          <List>
            <List.Item
              title={t('settings.usageStats')}
              subtitle={
                consent === 'full' ? t('settings.usageStatsOn') : t('settings.usageStatsOff')
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
              title={t('settings.privacyPolicy')}
              subtitle={
                consentDate
                  ? t('settings.privacyChoiceOn', { date: formatDate(consentDate) })
                  : undefined
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
          <ListSectionTitle>{t('settings.storage')}</ListSectionTitle>
          <List>
            <List.Item
              title={t('settings.downloadedFiles')}
              subtitle={cacheSize > 0 ? formatBytes(cacheSize) : t('settings.downloadedEmpty')}
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
