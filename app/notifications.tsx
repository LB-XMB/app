import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Bell, CheckCheck } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderAction, ScreenHeader } from '@/components/layout/ScreenHeader';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { API_BASE_URL } from '@/services/api';
import {
  fetchNotifications,
  markNotificationsRead,
} from '@/services/api/notifications';
import { mapIncomingPath } from '@/services/deepLinks';
import { queryKeys } from '@/services/queryKeys';
import { useIsSignedIn, useSessionStore } from '@/stores/session';
import { useSettingsStore } from '@/stores/settings';
import {
  AnimatedPressable,
  EmptyState,
  ErrorState,
  Screen,
  Typography,
} from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/notifications');
  const queryClient = useQueryClient();

  const signedIn = useIsSignedIn();
  const token = useSessionStore((state) => state.token);
  const inboxEnabled = useSettingsStore((state) => state.forumInboxEnabled);

  const query = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: ({ signal }) => fetchNotifications(token!, signal),
    enabled: Boolean(signedIn && token && inboxEnabled),
    refetchInterval: inboxEnabled ? 60_000 : false,
  });

  const openLink = (link: string | null) => {
    if (!link) return;
    const absolute = link.startsWith('http') ? link : `${API_BASE_URL}${link}`;
    try {
      const mapped = mapIncomingPath(absolute);
      if (
        mapped.startsWith('/ressource/') ||
        mapped.startsWith('/guides/') ||
        mapped.startsWith('/forum/') ||
        mapped.startsWith('/profil/')
      ) {
        router.push(mapped as `/ressource/${string}`);
        return;
      }
    } catch {
      // fall through
    }
    void WebBrowser.openBrowserAsync(absolute);
  };

  const markAll = async () => {
    if (!token) return;
    await markNotificationsRead({ token, markAllAsRead: true });
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  };

  if (!signedIn) {
    return (
      <Screen>
        <ScreenHeader title="Notifications" />
        <EmptyState
          icon={Bell}
          title="Connexion requise"
          description="Connecte-toi pour voir tes alertes forum."
          actionLabel="Se connecter"
          onAction={() => router.push('/compte')}
        />
      </Screen>
    );
  }

  if (!inboxEnabled) {
    return (
      <Screen>
        <ScreenHeader title="Notifications" />
        <EmptyState
          icon={Bell}
          title="Inbox désactivée"
          description="Active « Alertes forum (inbox) » dans Paramètres pour charger tes notifications."
          actionLabel="Paramètres"
          onAction={() => router.push('/parametres')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        subtitle={
          query.data
            ? `${query.data.unreadCount} non lue${query.data.unreadCount > 1 ? 's' : ''}`
            : undefined
        }
        actions={
          query.data && query.data.unreadCount > 0 ? (
            <HeaderAction label="Tout lu" onPress={() => void markAll()}>
              <CheckCheck size={17} color={colors.primary} strokeWidth={2.4} />
            </HeaderAction>
          ) : undefined
        }
      />

      {query.isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : !query.data?.notifications.length ? (
        <EmptyState
          icon={Bell}
          title="Aucune notification"
          description="Les mentions et réponses forum apparaîtront ici."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing['3xl'] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {query.data.notifications.map((item) => (
            <AnimatedPressable
              key={item.id}
              onPress={() => openLink(item.link)}
              scale={0.99}
              style={[
                styles.row,
                {
                  backgroundColor: item.isRead ? colors.card : `${colors.primary}14`,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.flex}>
                <Typography variant="title">{item.title}</Typography>
                {item.message ? (
                  <Typography variant="caption" color="secondary" numberOfLines={3}>
                    {item.message}
                  </Typography>
                ) : null}
              </View>
            </AnimatedPressable>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    gap: spacing.sm,
  },
  loader: {
    paddingTop: spacing['3xl'],
    alignItems: 'center',
  },
  row: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
    gap: 4,
  },
});
