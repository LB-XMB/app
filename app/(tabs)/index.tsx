import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand/Logo';
import { CreatorsRow } from '@/components/home/CreatorsRow';
import { PopularCarousel } from '@/components/home/PopularCarousel';
import { StatsGrid } from '@/components/home/StatsGrid';
import { GuideRow } from '@/components/guides/GuideRow';
import { NewsRow } from '@/components/forum/NewsRow';
import { ResourceRow } from '@/components/resources/ResourceRow';
import { ResourceRowSkeleton } from '@/components/resources/ResourceSkeleton';
import { useGuides } from '@/hooks/useGuides';
import { useHome } from '@/hooks/useHome';
import { useNewsHighlights } from '@/hooks/useNews';
import { useResourcePage } from '@/hooks/useResources';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import {
  ErrorState,
  Screen,
  SectionHeader,
  Typography,
} from '@/ui/components';
import { screenPadding, spacing, tabBarHeight, tabBarInset } from '@/ui/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useScreenTracking('/');

  const home = useHome();
  const recent = useResourcePage({ sort: 'recent', limit: 5 });
  const guides = useGuides();
  const news = useNewsHighlights(4);

  const refreshing =
    home.isRefetching || recent.isRefetching || guides.isRefetching || news.isRefetching;
  const refresh = () => {
    void home.refetch();
    void recent.refetch();
    void guides.refetch();
    void news.refetch();
  };

  const latestGuides = (guides.data ?? [])
    .slice()
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 3);

  // When the API is unreachable every section fails at once; show one message.
  const isOffline =
    home.isError && recent.isError && guides.isError && !home.data && !recent.data;

  if (isOffline) {
    return (
      <Screen>
        <View style={[styles.offline, { paddingTop: insets.top }]}>
          <Logo width={72} />
          <ErrorState error={home.error} onRetry={refresh} />
        </View>
      </Screen>
    );
  }

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.header}>
          <Logo width={52} style={styles.logo} />
          <View style={styles.headerText}>
            <Typography variant="h1">LB’XMB</Typography>
            <Typography variant="caption" color="secondary">
              Ressources et guides de modding console
            </Typography>
          </View>
        </View>

        <View style={styles.section}>
          <StatsGrid stats={home.data?.stats} loading={home.isLoading} />
        </View>

        {(news.data?.length ?? 0) > 0 ? (
          <View style={[styles.section, styles.sectionGap]}>
            <SectionHeader
              title="Actualités"
              subtitle="La communauté"
              actionLabel="Tout voir"
              onAction={() => router.push('/actualites')}
            />
            <View style={styles.rows}>
              {news.data?.map((item, index) => (
                <NewsRow key={item.id} item={item} delay={index * 40} />
              ))}
            </View>
          </View>
        ) : null}

        {home.isError && !home.data ? (
          <ErrorState error={home.error} onRetry={() => void home.refetch()} />
        ) : null}

        {home.isLoading || (home.data?.popularResources.length ?? 0) > 0 ? (
          <View style={styles.sectionNoPadding}>
            <View style={styles.sectionHeader}>
              <SectionHeader
                title="Populaires"
                subtitle="Les ressources les plus téléchargées"
                actionLabel="Tout voir"
                onAction={() => router.push('/catalogue?sort=popular')}
              />
            </View>
            <PopularCarousel
              items={home.data?.popularResources.slice(0, 12) ?? []}
              loading={home.isLoading}
              onSelect={(item) => router.push(`/ressource/${item.slug}`)}
            />
          </View>
        ) : null}

        <View style={[styles.section, styles.sectionGap]}>
          <SectionHeader
            title="Nouveautés"
            subtitle="Les derniers ajouts au catalogue"
            actionLabel="Catalogue"
            onAction={() => router.push('/catalogue')}
          />

          {recent.isLoading ? (
            <View style={styles.rows}>
              {[0, 1, 2].map((index) => (
                <ResourceRowSkeleton key={index} />
              ))}
            </View>
          ) : recent.isError ? (
            <ErrorState error={recent.error} onRetry={() => void recent.refetch()} />
          ) : (
            <View style={styles.rows}>
              {recent.data?.items.map((resource, index) => (
                <ResourceRow
                  key={resource.id}
                  resource={resource}
                  delay={index * 50}
                  onPress={() => router.push(`/ressource/${resource.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        {latestGuides.length > 0 ? (
          <View style={[styles.section, styles.sectionGap]}>
            <SectionHeader
              title="Guides"
              subtitle="Pas à pas, par console"
              actionLabel="Tous les guides"
              onAction={() => router.push('/guides')}
            />
            <View style={styles.rows}>
              {latestGuides.map((guide, index) => (
                <GuideRow
                  key={guide.id}
                  guide={guide}
                  delay={index * 50}
                  onPress={() => router.push(`/guides/${guide.id}`)}
                />
              ))}
            </View>
          </View>
        ) : guides.isError ? (
          <View style={styles.section}>
            <ErrorState error={guides.error} onRetry={() => void guides.refetch()} />
          </View>
        ) : null}

        {home.data?.creators.length ? (
          <View style={styles.sectionNoPadding}>
            <View style={styles.sectionHeader}>
              <SectionHeader title="Créateurs" subtitle="Ils alimentent le catalogue" />
            </View>
            <CreatorsRow creators={home.data.creators.slice(0, 10)} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: screenPadding,
  },
  logo: {
    alignSelf: 'flex-start',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  section: {
    paddingHorizontal: screenPadding,
  },
  sectionNoPadding: {
    gap: spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: screenPadding,
  },
  sectionGap: {
    gap: spacing.md,
  },
  rows: {
    gap: spacing.sm,
  },
  offline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: screenPadding,
  },
});
