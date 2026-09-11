import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Newspaper, Vote } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { uploadUrl, type NewsItem } from '@/services/api';
import { AnimatedPressable, Chip, Typography } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

import { ForumDate } from './ForumDate';

export interface NewsRowProps {
  item: NewsItem;
  delay?: number;
}

/** Row of the news list, opening the underlying forum thread. */
export function NewsRow({ item, delay = 0 }: NewsRowProps) {
  const router = useRouter();
  const colors = useColors();
  const tint = item.categoryColor ?? colors.primary;
  const image = uploadUrl(item.image);

  return (
    <Reanimated.View entering={FadeInDown.duration(360).delay(delay).springify().damping(18)}>
      <AnimatedPressable
        onPress={() => router.push(`/forum/${item.id}`)}
        scale={0.985}
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.cover}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.cover, styles.coverFallback, { backgroundColor: `${tint}22` }]}>
            {item.poll ? (
              <Vote size={22} color={tint} strokeWidth={2.2} />
            ) : (
              <Newspaper size={22} color={tint} strokeWidth={2.2} />
            )}
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.meta}>
            <Chip label={item.categoryName} color={tint} />
            <ForumDate value={item.createdAt} />
          </View>
          <Typography variant="title" numberOfLines={2}>
            {item.title}
          </Typography>
          {item.excerpt ? (
            <Typography variant="caption" color="secondary" numberOfLines={2}>
              {item.excerpt}
            </Typography>
          ) : null}
          <Typography variant="caption" color="tertiary" numberOfLines={1}>
            {item.authorPseudo}
          </Typography>
        </View>
      </AnimatedPressable>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  cover: {
    width: 84,
    height: 84,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
