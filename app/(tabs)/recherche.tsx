import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Clock, Search, SearchX, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchHitRow, TYPE_LABELS } from '@/components/search/SearchHitRow';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { MIN_SEARCH_LENGTH, useSiteSearch } from '@/hooks/useSiteSearch';
import { API_BASE_URL, type SearchHit, type SearchHitType } from '@/services/api';
import { trackEvent } from '@/services/analytics';
import { useHistoryStore } from '@/stores/history';
import {
  AnimatedPressable,
  EmptyState,
  ErrorState,
  ListSectionTitle,
  Screen,
  SearchField,
  Typography,
} from '@/ui/components';
import { radius, screenPadding, spacing, tabBarHeight, tabBarInset, useColors } from '@/ui/theme';

/** Order in which result groups are displayed. */
const TYPE_ORDER: SearchHitType[] = [
  'resource',
  'guide',
  'forum_thread',
  'shop',
  'profile',
  'other',
];

export default function SearchScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/recherche');

  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 350);
  const { data, isLoading, isFetching, isError, error, refetch } = useSiteSearch(debounced);

  const searches = useHistoryStore((state) => state.searches);
  const addSearch = useHistoryStore((state) => state.addSearch);
  const removeSearch = useHistoryStore((state) => state.removeSearch);

  const groups = useMemo(() => {
    const byType = new Map<SearchHitType, SearchHit[]>();
    for (const hit of data ?? []) {
      const bucket = byType.get(hit.type);
      if (bucket) bucket.push(hit);
      else byType.set(hit.type, [hit]);
    }
    return TYPE_ORDER.filter((type) => byType.has(type)).map((type) => ({
      type,
      hits: byType.get(type) ?? [],
    }));
  }, [data]);

  const openHit = (hit: SearchHit) => {
    addSearch(debounced);
    trackEvent('search-open', { type: hit.type }, '/recherche');

    if (hit.type === 'resource') {
      router.push(`/ressource/${hit.id}`);
      return;
    }
    if (hit.type === 'guide') {
      router.push(`/guides/${hit.id}`);
      return;
    }
    // Forum, shop and profiles have no native screen yet.
    void WebBrowser.openBrowserAsync(`${API_BASE_URL}${hit.href}`);
  };

  const showHistory = debounced.trim().length < MIN_SEARCH_LENGTH;

  return (
    <Screen>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Typography variant="h1">Recherche</Typography>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Ressource, guide, sujet du forum…"
          onSubmit={() => addSearch(query)}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + tabBarHeight + tabBarInset + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showHistory ? (
          searches.length > 0 ? (
            <View style={styles.group}>
              <ListSectionTitle>Recherches récentes</ListSectionTitle>
              <View style={styles.historyList}>
                {searches.map((entry) => (
                  <View
                    key={entry}
                    style={[
                      styles.historyRow,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <AnimatedPressable
                      onPress={() => setQuery(entry)}
                      scale={0.99}
                      style={styles.historyPress}
                      accessibilityRole="button"
                    >
                      <Clock size={15} color={colors.textTertiary} strokeWidth={2.2} />
                      <Typography variant="bodyStrong" numberOfLines={1} style={styles.flex}>
                        {entry}
                      </Typography>
                    </AnimatedPressable>
                    <AnimatedPressable
                      onPress={() => removeSearch(entry)}
                      scale={0.88}
                      haptic={false}
                      style={styles.historyRemove}
                      accessibilityRole="button"
                      accessibilityLabel={`Oublier ${entry}`}
                    >
                      <X size={14} color={colors.textTertiary} strokeWidth={2.6} />
                    </AnimatedPressable>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <EmptyState
              icon={Search}
              title="Cherche dans tout le site"
              description="Ressources, guides, sujets du forum et profils, en une seule requête."
            />
          )
        ) : isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Aucun résultat"
            description={`Rien ne correspond à « ${debounced.trim()} ».`}
          />
        ) : (
          <>
            {isFetching ? (
              <View style={styles.inlineLoader}>
                <ActivityIndicator size="small" color={colors.textTertiary} />
              </View>
            ) : null}
            {groups.map((group) => (
              <View key={group.type} style={styles.group}>
                <ListSectionTitle>{TYPE_LABELS[group.type]}</ListSectionTitle>
                <View style={styles.hits}>
                  {group.hits.map((hit, index) => (
                    <SearchHitRow
                      key={`${hit.type}-${hit.id}-${hit.href}`}
                      hit={hit}
                      delay={index * 35}
                      onPress={() => openHit(hit)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  content: {
    paddingHorizontal: screenPadding,
    gap: spacing.xl,
  },
  group: {
    gap: spacing.md,
  },
  hits: {
    gap: spacing.sm,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingRight: spacing.sm,
  },
  historyPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  historyRemove: {
    padding: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  loader: {
    paddingVertical: spacing['4xl'],
  },
  inlineLoader: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
});
