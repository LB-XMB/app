import { useLocalSearchParams } from 'expo-router';
import { ChevronDown, FileText, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Share, ScrollView, StyleSheet, View } from 'react-native';
import Reanimated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RichText } from '@/components/guides/RichText';
import { HeaderAction, ScreenHeader } from '@/components/layout/ScreenHeader';
import { useGuide } from '@/hooks/useGuides';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import type { GuideChapter } from '@/services/api';
import { WEB_URLS } from '@/services/api';
import { layoutAnimation } from '@/ui/animation';
import {
  AnimatedPressable,
  Chip,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  Typography,
} from '@/ui/components';
import { platformColor, radius, screenPadding, spacing, useColors } from '@/ui/theme';

export default function GuideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/guides/detail');

  const { data: guide, isLoading, isError, error, refetch } = useGuide(id);

  if (isLoading) {
    return (
      <Screen>
        <ScreenHeader title="Guide" />
        <View style={styles.loading}>
          <Skeleton width="80%" height={24} />
          <Skeleton width="40%" height={13} />
          <Skeleton height={120} radius={radius.lg} />
          <Skeleton height={90} radius={radius.lg} />
        </View>
      </Screen>
    );
  }

  if (isError || !guide) {
    return (
      <Screen>
        <ScreenHeader title="Guide" />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const tint = platformColor(guide.platform);

  return (
    <Screen glowColor={tint}>
      <ScreenHeader
        title={guide.title}
        subtitle={guide.platform ?? undefined}
        actions={
          <HeaderAction
            label="Partager"
            onPress={() => {
              const url = WEB_URLS.guide(guide.id);
              void Share.share({
                title: guide.title,
                message: `${guide.title}\n${url}`,
                url,
              });
            }}
          >
            <Share2 size={16} color={colors.text} strokeWidth={2.4} />
          </HeaderAction>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Typography variant="h1">{guide.title}</Typography>
          {guide.description ? (
            <Typography variant="body" color="secondary">
              {guide.description}
            </Typography>
          ) : null}
          <View style={styles.chips}>
            {guide.platform ? (
              <Chip label={guide.platform} color={tint} selected size="small" />
            ) : null}
            {guide.category ? <Chip label={guide.category} size="small" /> : null}
            {guide.author ? <Chip label={`par ${guide.author}`} size="small" /> : null}
          </View>
        </View>

        {guide.chapters.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Guide sans contenu"
            description="Ce guide n’a pas encore de chapitre publié."
          />
        ) : (
          <Chapters chapters={guide.chapters} />
        )}
      </ScrollView>
    </Screen>
  );
}

/** Accordion of chapters; the first one is expanded on mount. */
function Chapters({ chapters }: { chapters: GuideChapter[] }) {
  const colors = useColors();
  const [openChapters, setOpenChapters] = useState<Set<string>>(
    () => new Set(chapters.slice(0, 1).map((chapter) => chapter.id))
  );

  const toggle = (chapterId: string) =>
    setOpenChapters((current) => {
      const next = new Set(current);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });

  return (
    <>
      {chapters.map((chapter) => {
        const isOpen = openChapters.has(chapter.id);
        return (
          <View
            key={chapter.id}
            style={[
              styles.chapter,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <AnimatedPressable
              onPress={() => toggle(chapter.id)}
              scale={0.995}
              haptic={false}
              style={styles.chapterHeader}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
            >
              <Typography variant="h3" style={styles.flex} numberOfLines={2}>
                {chapter.title}
              </Typography>
              <ChevronDown
                size={18}
                color={colors.textTertiary}
                strokeWidth={2.4}
                style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
              />
            </AnimatedPressable>

            {isOpen ? (
              <Reanimated.View
                entering={FadeIn.duration(200)}
                layout={layoutAnimation(LinearTransition, 'list')}
                style={styles.chapterBody}
              >
                <RichText node={chapter.content} />
              </Reanimated.View>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  loading: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  hero: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chapter: {
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  chapterBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  flex: {
    flex: 1,
  },
});
