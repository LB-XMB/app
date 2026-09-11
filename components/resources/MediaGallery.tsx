import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AnimatedPressable, Typography } from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

import type { MediaItem } from './mediaItems';
import { MediaViewer } from './MediaViewer';

export interface MediaGalleryProps {
  /** Screenshots and videos of the resource, in display order. */
  items: MediaItem[];
}

/** Horizontal, snapping strip of resource media; tapping one opens the viewer. */
export function MediaGallery({ items }: MediaGalleryProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const [opened, setOpened] = useState<number | null>(null);
  const itemWidth = Math.min(width - screenPadding * 2, 340);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        decelerationRate="fast"
        snapToInterval={itemWidth + spacing.md}
        snapToAlignment="start"
      >
        {items.map((item, index) => (
          <AnimatedPressable
            key={item.key}
            accessibilityRole="imagebutton"
            accessibilityLabel={item.kind === 'image' ? 'Agrandir la capture' : 'Lire la vidéo'}
            onPress={() => setOpened(index)}
            scale={0.98}
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
            {item.kind === 'image' ? (
              <Image
                source={{ uri: item.uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : null}

            {item.kind === 'youtube' ? (
              <Image
                source={{ uri: item.posterUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : null}

            {item.kind !== 'image' ? (
              <View style={styles.videoLayer}>
                <View style={styles.playBadge}>
                  <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                {item.kind === 'video' ? (
                  <Typography variant="captionStrong" color="#FFFFFF">
                    Vidéo
                  </Typography>
                ) : null}
              </View>
            ) : null}
          </AnimatedPressable>
        ))}
      </ScrollView>

      <MediaViewer items={items} index={opened} onClose={() => setOpened(null)} />
    </>
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
  videoLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  playBadge: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
});
