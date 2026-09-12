import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, RefreshCw } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { HeaderAction, ScreenHeader } from '@/components/layout/ScreenHeader';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { fetchWidgetPayloads } from '@/services/widgetData';
import {
  EmptyState,
  ErrorState,
  ListSectionTitle,
  Screen,
  Typography,
} from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

export default function WidgetsStubScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/widgets');

  const query = useQuery({
    queryKey: ['widgets', 'preview'],
    queryFn: ({ signal }) => fetchWidgetPayloads(signal),
  });

  return (
    <Screen>
      <ScreenHeader
        title={t('widgets.title')}
        subtitle={t('widgets.stub')}
        actions={
          <HeaderAction label="Rafraîchir" onPress={() => void query.refetch()}>
            <RefreshCw size={16} color={colors.primary} strokeWidth={2.4} />
          </HeaderAction>
        }
      />

      {query.isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : !query.data ? (
        <EmptyState icon={LayoutGrid} title={t('widgets.title')} />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing['3xl'] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.group}>
            <ListSectionTitle>Stats communauté</ListSectionTitle>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Typography variant="body">
                {query.data.stats.resources} ressources · {query.data.stats.guides} guides ·{' '}
                {query.data.stats.users} membres
              </Typography>
            </View>
          </View>

          <View style={styles.group}>
            <ListSectionTitle>Populaires</ListSectionTitle>
            {query.data.popular.map((item) => (
              <View
                key={item.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Typography variant="title">{item.title}</Typography>
                <Typography variant="caption" color="secondary">
                  {item.href}
                </Typography>
              </View>
            ))}
          </View>

          <Typography variant="caption" color="tertiary">
            Mis à jour {new Date(query.data.fetchedAt).toLocaleString()}
          </Typography>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    gap: spacing.xl,
  },
  loader: {
    paddingTop: spacing['3xl'],
    alignItems: 'center',
  },
  group: {
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: 4,
  },
});
