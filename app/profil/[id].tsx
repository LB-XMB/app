import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { fetchPublicUser } from '@/services/api/users';
import { queryKeys } from '@/services/queryKeys';
import {
  AnimatedPressable,
  EmptyState,
  ErrorState,
  ListSectionTitle,
  Screen,
  Skeleton,
  Typography,
} from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/profil/public');

  const query = useQuery({
    queryKey: queryKeys.publicUser(id ?? ''),
    queryFn: ({ signal }) => fetchPublicUser(id!, signal),
    enabled: Boolean(id),
  });

  if (query.isLoading) {
    return (
      <Screen>
        <ScreenHeader title="Profil" />
        <View style={styles.loading}>
          <Skeleton width={72} height={72} radius={999} />
          <Skeleton width="50%" height={22} />
          <Skeleton width="80%" height={40} />
        </View>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ScreenHeader title="Profil" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const user = query.data;

  return (
    <Screen>
      <ScreenHeader title={user.pseudo} subtitle="Profil public" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {user.photo ? (
            <Image
              source={{ uri: user.photo }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.item }]}>
              <User size={28} color={colors.textSecondary} strokeWidth={2} />
            </View>
          )}
          <Typography variant="h1">{user.pseudo}</Typography>
          <Typography variant="caption" color="secondary">
            {user.followersCount} abonné{user.followersCount > 1 ? 's' : ''} ·{' '}
            {user.followingCount} abonnement{user.followingCount > 1 ? 's' : ''}
          </Typography>
          {user.bio ? (
            <Typography variant="body" color="secondary" align="center">
              {user.bio}
            </Typography>
          ) : null}
        </View>

        {user.resources.length > 0 ? (
          <View style={styles.group}>
            <ListSectionTitle>Ressources</ListSectionTitle>
            {user.resources.slice(0, 20).map((resource) => (
              <AnimatedPressable
                key={resource.id}
                onPress={() => router.push(`/ressource/${resource.id}`)}
                scale={0.99}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Typography variant="title" numberOfLines={2} style={styles.flex}>
                  {resource.title}
                </Typography>
                {resource.platform ? (
                  <Typography variant="caption" color="secondary">
                    {resource.platform}
                  </Typography>
                ) : null}
              </AnimatedPressable>
            ))}
          </View>
        ) : null}

        {user.guides.length > 0 ? (
          <View style={styles.group}>
            <ListSectionTitle>Guides</ListSectionTitle>
            {user.guides.slice(0, 20).map((guide) => (
              <AnimatedPressable
                key={guide.id}
                onPress={() => router.push(`/guides/${guide.id}`)}
                scale={0.99}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Typography variant="title" numberOfLines={2} style={styles.flex}>
                  {guide.title}
                </Typography>
              </AnimatedPressable>
            ))}
          </View>
        ) : null}

        {user.resources.length === 0 && user.guides.length === 0 ? (
          <EmptyState
            icon={User}
            title="Rien à afficher"
            description="Ce membre n’a pas encore de ressources ou de guides publics."
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    padding: screenPadding,
    gap: spacing.md,
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: screenPadding,
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  group: {
    gap: spacing.sm,
  },
  row: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: 4,
  },
  flex: {
    flex: 1,
  },
});
