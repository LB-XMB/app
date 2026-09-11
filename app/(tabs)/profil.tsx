import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  BookOpen,
  ChevronRight,
  DownloadCloud,
  Globe,
  Heart,
  Info,
  MessageSquare,
  Settings,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand/Logo';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { WEB_URLS } from '@/services/api';
import { useFavoritesStore } from '@/stores/favorites';
import { useHistoryStore } from '@/stores/history';
import { IconBadge, List, ListSectionTitle, Screen, Typography } from '@/ui/components';
import { screenPadding, spacing, tabBarHeight, tabBarInset, useColors } from '@/ui/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/profil');

  const favoritesCount = useFavoritesStore((state) => state.items.length);
  const downloadsCount = useHistoryStore((state) => state.downloads.length);

  const chevron = <ChevronRight size={17} color={colors.textTertiary} strokeWidth={2.2} />;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + tabBarHeight + tabBarInset + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Logo width={64} />
          <View style={styles.headerText}>
            <Typography variant="h1">Mon espace</Typography>
            <Typography variant="caption" color="secondary">
              Favoris, téléchargements et réglages
            </Typography>
          </View>
        </View>

        <View style={styles.group}>
          <ListSectionTitle>Ma bibliothèque</ListSectionTitle>
          <List>
            <List.Item
              title="Favoris"
              subtitle={
                favoritesCount === 0
                  ? 'Aucune ressource enregistrée'
                  : `${favoritesCount} ressource${favoritesCount > 1 ? 's' : ''}`
              }
              leading={<IconBadge icon={Heart} color={colors.danger} size={30} />}
              trailing={chevron}
              onPress={() => router.push('/favoris')}
            />
            <List.Item
              title="Téléchargements"
              subtitle={
                downloadsCount === 0
                  ? 'Aucun téléchargement'
                  : `${downloadsCount} fichier${downloadsCount > 1 ? 's' : ''}`
              }
              leading={<IconBadge icon={DownloadCloud} color={colors.primary} size={30} />}
              trailing={chevron}
              onPress={() => router.push('/historique')}
            />
            <List.Item
              title="Guides"
              subtitle="Tous les tutoriels de modding"
              leading={<IconBadge icon={BookOpen} color={colors.accent} size={30} />}
              trailing={chevron}
              onPress={() => router.push('/guides')}
            />
          </List>
        </View>

        <View style={styles.group}>
          <ListSectionTitle>Application</ListSectionTitle>
          <List>
            <List.Item
              title="Paramètres"
              subtitle="Thème, confidentialité, stockage"
              leading={<IconBadge icon={Settings} color={colors.textSecondary} size={30} />}
              trailing={chevron}
              onPress={() => router.push('/parametres')}
            />
            <List.Item
              title="À propos"
              subtitle="Version, licences, code source"
              leading={<IconBadge icon={Info} color={colors.textSecondary} size={30} />}
              trailing={chevron}
              onPress={() => router.push('/a-propos')}
            />
          </List>
        </View>

        <View style={styles.group}>
          <ListSectionTitle>La communauté</ListSectionTitle>
          <List>
            <List.Item
              title="lbxmb.fr"
              subtitle="Le site complet"
              leading={<IconBadge icon={Globe} color={colors.success} size={30} />}
              trailing={chevron}
              onPress={() => void WebBrowser.openBrowserAsync(WEB_URLS.home)}
            />
            <List.Item
              title="Forum"
              subtitle="Poser une question, partager"
              leading={<IconBadge icon={MessageSquare} color={colors.warning} size={30} />}
              trailing={chevron}
              onPress={() => void WebBrowser.openBrowserAsync(WEB_URLS.forum)}
            />
          </List>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  group: {
    gap: spacing.md,
  },
});
