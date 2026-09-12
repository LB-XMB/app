import { useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuideRow } from '@/components/guides/GuideRow';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useGuides } from '@/hooks/useGuides';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import {
  Chip,
  EmptyState,
  ErrorState,
  ListSectionTitle,
  Screen,
  SearchField,
  Skeleton,
} from '@/ui/components';
import { platformColor, screenPadding, spacing } from '@/ui/theme';

export default function GuidesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useScreenTracking('/guides');

  const { data, isLoading, isError, error, refetch, isRefetching } = useGuides();
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<string | undefined>();
  const debounced = useDebouncedValue(search, 250);

  const platforms = useMemo(() => {
    const unique = new Set(
      (data ?? []).map((guide) => guide.platform).filter((value): value is string => !!value)
    );
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [data]);

  /** Guides are grouped by console, like the website. */
  const sections = useMemo(() => {
    const needle = debounced.trim().toLowerCase();
    const filtered = (data ?? []).filter((guide) => {
      if (platform && guide.platform !== platform) return false;
      if (!needle) return true;
      return (
        guide.title.toLowerCase().includes(needle) ||
        guide.description.toLowerCase().includes(needle) ||
        (guide.category ?? '').toLowerCase().includes(needle)
      );
    });

    const byPlatform = new Map<string, typeof filtered>();
    for (const guide of filtered) {
      const key = guide.platform ?? 'Autres';
      const bucket = byPlatform.get(key);
      if (bucket) bucket.push(guide);
      else byPlatform.set(key, [guide]);
    }

    return [...byPlatform.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, guides]) => ({ label, guides }));
  }, [data, debounced, platform]);

  return (
    <Screen>
      <ScreenHeader title="Guides" subtitle="Tutoriels pas à pas" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
      >
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Titre, console, catégorie…"
        />

        {platforms.length > 0 ? (
          <View style={styles.chips}>
            {platforms.map((item) => (
              <Chip
                key={item}
                label={item}
                color={platformColor(item)}
                selected={platform === item}
                size="small"
                onPress={() => setPlatform(platform === item ? undefined : item)}
              />
            ))}
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.rows}>
            {[0, 1, 2, 3, 4].map((index) => (
              <Skeleton key={index} height={72} radius={16} />
            ))}
          </View>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : sections.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Aucun guide"
            description="Essaie une autre recherche ou retire le filtre de console."
          />
        ) : (
          sections.map((section) => (
            <View key={section.label} style={styles.section}>
              <ListSectionTitle>{section.label}</ListSectionTitle>
              <View style={styles.rows}>
                {section.guides.map((guide) => (
                  <GuideRow
                    key={guide.id}
                    guide={guide}
                    onPress={() => router.push(`/guides/${guide.id}`)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  rows: {
    gap: spacing.sm,
  },
});
