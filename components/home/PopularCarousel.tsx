import { ScrollView, StyleSheet, View } from 'react-native';

import type { PopularResource } from '@/services/api';
import { ResourceIcon } from '@/components/resources/ResourceIcon';
import { AnimatedPressable, Skeleton, Typography } from '@/ui/components';
import { radius, screenPadding, spacing } from '@/ui/theme';

const TILE_WIDTH = 96;

export interface PopularCarouselProps {
  items: PopularResource[];
  loading?: boolean;
  onSelect: (item: PopularResource) => void;
}

/** Horizontal strip of resource artwork, as on the website home page. */
export function PopularCarousel({ items, loading, onSelect }: PopularCarouselProps) {
  if (loading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEnabled={false}
      >
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={styles.tile}>
            <Skeleton width={TILE_WIDTH} height={TILE_WIDTH} radius={radius.lg} />
            <Skeleton width={TILE_WIDTH - 20} height={11} />
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      decelerationRate="fast"
      snapToInterval={TILE_WIDTH + spacing.md}
      snapToAlignment="start"
    >
      {items.map((item) => (
        <AnimatedPressable
          key={item.href}
          onPress={() => onSelect(item)}
          scale={0.95}
          style={styles.tile}
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          <ResourceIcon
            logo={item.image}
            siteAsset
            size={TILE_WIDTH}
            radius={radius.lg}
          />
          <Typography variant="captionStrong" numberOfLines={2} style={styles.label}>
            {item.title}
          </Typography>
        </AnimatedPressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingHorizontal: screenPadding,
  },
  tile: {
    width: TILE_WIDTH,
    gap: spacing.sm,
  },
  label: {
    textAlign: 'center',
  },
});
