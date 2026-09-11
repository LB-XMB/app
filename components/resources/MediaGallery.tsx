import { Image } from 'expo-image';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { uploadUrl } from '@/services/api';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

export interface MediaGalleryProps {
  /** Relative uploads paths of the screenshots. */
  media: string[];
  cacheKey?: string | null;
}

/** Horizontal, snapping strip of resource screenshots. */
export function MediaGallery({ media, cacheKey }: MediaGalleryProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const itemWidth = Math.min(width - screenPadding * 2, 340);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      decelerationRate="fast"
      snapToInterval={itemWidth + spacing.md}
      snapToAlignment="start"
    >
      {media.map((path) => {
        const uri = uploadUrl(path, cacheKey);
        if (!uri) return null;
        return (
          <View
            key={path}
            style={[
              styles.item,
              {
                width: itemWidth,
                height: itemWidth * 0.56,
                backgroundColor: colors.item,
                borderColor: colors.border,
              },
            ]}
          >
            <Image
              source={{ uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingHorizontal: screenPadding,
  },
  item: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
