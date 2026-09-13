import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Code2, ExternalLink, Globe, LayoutGrid, Scale, ServerCog, Sparkles } from 'lucide-react-native';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import { Logo } from '@/components/brand/Logo';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { API_BASE_URL, WEB_URLS } from '@/services/api';
import { changelogForVersion, currentAppVersion } from '@/services/appChangelog';
import { IconBadge, List, ListSectionTitle, Screen, Sheet, Typography } from '@/ui/components';
import { screenPadding, spacing, useColors } from '@/ui/theme';

const REPO_URL = 'https://git.lbxmb.fr/lbxmb/app';

const PLATFORM_LABELS: Partial<Record<typeof Platform.OS, string>> = {
  ios: 'iOS',
  android: 'Android',
  web: 'Web',
};

export default function AboutScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/a-propos');

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const external = <ExternalLink size={15} color={colors.textTertiary} strokeWidth={2.3} />;
  const [notesOpen, setNotesOpen] = useState(false);
  const notes = changelogForVersion(currentAppVersion());

  return (
    <Screen>
      <ScreenHeader title="À propos" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Logo width={104} />
          <Typography variant="h1" align="center">
            LB’XMB
          </Typography>
          <Typography variant="caption" color="secondary" align="center">
            Version {version} · {PLATFORM_LABELS[Platform.OS] ?? Platform.OS}
          </Typography>
          <Typography variant="body" color="secondary" align="center">
            L’application mobile du catalogue communautaire de ressources et de guides de
            modding console.
          </Typography>
        </View>

        <View style={styles.group}>
          <ListSectionTitle>Le projet</ListSectionTitle>
          <List>
            {notes ? (
              <List.Item
                title="Nouveautés"
                subtitle={`Version ${notes.version}`}
                leading={<IconBadge icon={Sparkles} color={colors.primary} size={30} />}
                onPress={() => setNotesOpen(true)}
              />
            ) : null}
            <List.Item
              title="Widgets"
              subtitle="Bientôt — aperçu données (pas encore sur l’écran d’accueil)"
              leading={<IconBadge icon={LayoutGrid} color={colors.accent} size={30} />}
              onPress={() => router.push('/widgets')}
            />
            <List.Item
              title="Site web"
              subtitle={API_BASE_URL.replace('https://', '')}
              leading={<IconBadge icon={Globe} color={colors.primary} size={30} />}
              trailing={external}
              onPress={() => void WebBrowser.openBrowserAsync(WEB_URLS.home)}
            />
            <List.Item
              title="Code source"
              subtitle="git.lbxmb.fr/lbxmb/app"
              leading={<IconBadge icon={Code2} color={colors.accent} size={30} />}
              trailing={external}
              onPress={() => void WebBrowser.openBrowserAsync(REPO_URL)}
            />
            <List.Item
              title="API publique"
              subtitle="Documentation interactive"
              leading={<IconBadge icon={ServerCog} color={colors.success} size={30} />}
              trailing={external}
              onPress={() => void WebBrowser.openBrowserAsync(WEB_URLS.apiDocs)}
            />
            <List.Item
              title="Conditions d’utilisation"
              leading={<IconBadge icon={Scale} color={colors.textSecondary} size={30} />}
              trailing={external}
              onPress={() => void WebBrowser.openBrowserAsync(WEB_URLS.terms)}
            />
          </List>
        </View>

        <View style={styles.group}>
          <ListSectionTitle>Crédits</ListSectionTitle>
          <Typography variant="caption" color="secondary">
            Interface inspirée de Papillon, l’application scolaire libre. Typographie Syne et
            Inter (Google Fonts), icônes Lucide. Construite avec Expo et React Native.
          </Typography>
        </View>
      </ScrollView>

      <Sheet visible={notesOpen} onClose={() => setNotesOpen(false)} title="Nouveautés">
        {notes ? (
          <View style={{ gap: spacing.md, paddingBottom: spacing.xl }}>
            <Typography variant="caption" color="secondary">
              Version {notes.version}
            </Typography>
            {notes.bullets.map((item) => (
              <Typography key={item} variant="body">
                • {item}
              </Typography>
            ))}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xl,
    gap: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  group: {
    gap: spacing.md,
  },
});
