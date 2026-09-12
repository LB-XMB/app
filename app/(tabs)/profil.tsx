import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  BookOpen,
  ChevronRight,
  DownloadCloud,
  FolderOpen,
  Globe,
  Heart,
  Info,
  Bell,
  LogIn,
  LogOut,
  MessageSquare,
  Newspaper,
  Settings,
} from 'lucide-react-native';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForumAvatar } from '@/components/forum/ForumAvatar';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { WEB_URLS } from '@/services/api';
import { signOut as revokeSession } from '@/services/api/auth';
import { useFavoritesStore } from '@/stores/favorites';
import { useCollectionsStore } from '@/stores/collections';
import { useHistoryStore } from '@/stores/history';
import { useIsSignedIn, useSessionStore } from '@/stores/session';
import { useSettingsStore } from '@/stores/settings';
import {
  AnimatedPressable,
  Button,
  IconBadge,
  List,
  ListSectionTitle,
  Screen,
  Typography,
} from '@/ui/components';
import { radius, screenPadding, spacing, tabBarHeight, tabBarInset, useColors } from '@/ui/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/profil');

  const favoritesCount = useFavoritesStore((state) => state.items.length);
  const collectionsCount = useCollectionsStore((state) => state.collections.length);
  const downloadsCount = useHistoryStore((state) => state.downloads.length);
  const signedIn = useIsSignedIn();
  const user = useSessionStore((state) => state.user);
  const token = useSessionStore((state) => state.token);
  const clearSession = useSessionStore((state) => state.signOut);
  const inboxEnabled = useSettingsStore((state) => state.forumInboxEnabled);

  const chevron = <ChevronRight size={17} color={colors.textTertiary} strokeWidth={2.2} />;

  const onSignOut = () => {
    Alert.alert('Se déconnecter', 'Tu pourras te reconnecter à tout moment.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: () => {
          // The local session is cleared even if the network call fails.
          if (token) void revokeSession(token).catch(() => undefined);
          clearSession();
        },
      },
    ]);
  };

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
        {signedIn && user ? (
          <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ForumAvatar photo={user.photo} pseudo={user.pseudo} size={52} />
            <View style={styles.accountText}>
              <Typography variant="h2" numberOfLines={1}>
                {user.pseudo}
              </Typography>
              <Typography variant="caption" color="secondary">
                Connecté sur lbxmb.fr
              </Typography>
            </View>
            <AnimatedPressable
              onPress={onSignOut}
              scale={0.94}
              accessibilityRole="button"
              accessibilityLabel="Se déconnecter"
              style={[styles.logout, { backgroundColor: `${colors.danger}1A` }]}
            >
              <LogOut size={18} color={colors.danger} strokeWidth={2.3} />
            </AnimatedPressable>
          </View>
        ) : (
          <View style={[styles.guestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.guestText}>
              <Typography variant="h2">Pas encore connecté</Typography>
              <Typography variant="caption" color="secondary">
                Connecte-toi pour poster sur le forum et synchroniser ton compte.
              </Typography>
            </View>
            <Button
              label="Se connecter"
              size="small"
              fullWidth={false}
              leading={<LogIn size={16} color={colors.onPrimary} strokeWidth={2.4} />}
              onPress={() => router.push('/compte')}
            />
          </View>
        )}

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
              title="Mes listes"
              subtitle={
                collectionsCount === 0
                  ? 'Collections locales'
                  : `${collectionsCount} liste${collectionsCount > 1 ? 's' : ''}`
              }
              leading={<IconBadge icon={FolderOpen} color={colors.accent} size={30} />}
              trailing={chevron}
              onPress={() => router.push('/listes')}
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
            {signedIn ? (
              <List.Item
                title="Notifications"
                subtitle={
                  inboxEnabled ? 'Inbox forum' : 'Active les alertes dans Paramètres'
                }
                leading={<IconBadge icon={Bell} color={colors.warning} size={30} />}
                trailing={chevron}
                onPress={() => router.push('/notifications')}
              />
            ) : null}
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
          <ListSectionTitle>La communauté</ListSectionTitle>
          <List>
            <List.Item
              title="Forum"
              subtitle="Poser une question, partager"
              leading={<IconBadge icon={MessageSquare} color={colors.warning} size={30} />}
              trailing={chevron}
              onPress={() => router.push('/forum')}
            />
            <List.Item
              title="Actualités"
              subtitle="Annonces et nouveautés de la communauté"
              leading={<IconBadge icon={Newspaper} color={colors.primary} size={30} />}
              trailing={chevron}
              onPress={() => router.push('/actualites')}
            />
            <List.Item
              title="lbxmb.fr"
              subtitle="Le site complet"
              leading={<IconBadge icon={Globe} color={colors.success} size={30} />}
              trailing={chevron}
              onPress={() => void WebBrowser.openBrowserAsync(WEB_URLS.home)}
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    gap: spacing.xl,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius['2xl'],
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  accountText: {
    flex: 1,
    gap: 2,
  },
  logout: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius['2xl'],
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  guestText: {
    gap: spacing.sm,
  },
  group: {
    gap: spacing.md,
  },
});
