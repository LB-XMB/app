import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Play, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable, Button, Typography } from '@/ui/components';
import { duration, radius, spacing, useColors } from '@/ui/theme';

import type { MediaItem } from './mediaItems';

const MAX_SCALE = 4;
/** Pinching below this is treated as "back to fit", so the pager takes over. */
const ZOOM_EPSILON = 1.02;

export interface MediaViewerProps {
  items: MediaItem[];
  /** Index of the media being viewed; `null` keeps the viewer closed. */
  index: number | null;
  onClose: () => void;
}

/** Full screen media viewer: swipe between items, pinch or double tap to zoom. */
export function MediaViewer({ items, index, onClose }: MediaViewerProps) {
  return (
    <Modal
      visible={index !== null}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      {index !== null ? (
        <Viewer key={index} items={items} initialIndex={index} onClose={onClose} />
      ) : null}
    </Modal>
  );
}

interface ViewerProps {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

function Viewer({ items, initialIndex, onClose }: ViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(initialIndex);
  const [pagingEnabled, setPagingEnabled] = useState(true);

  // `contentOffset` is iOS only, so the initial page is set once laid out.
  const jumpToInitial = useCallback(() => {
    scroller.current?.scrollTo({ x: initialIndex * width, animated: false });
  }, [initialIndex, width]);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        scrollEnabled={pagingEnabled && items.length > 1}
        showsHorizontalScrollIndicator={false}
        onLayout={jumpToInitial}
        onMomentumScrollEnd={(event) => {
          setCurrent(Math.round(event.nativeEvent.contentOffset.x / width));
        }}
      >
        {items.map((item) => (
          <View key={item.key} style={{ width, height }}>
            {item.kind === 'image' ? (
              <ZoomableImage
                uri={item.uri}
                onClose={onClose}
                onZoomChange={(zoomed) => setPagingEnabled(!zoomed)}
              />
            ) : (
              <VideoPage item={item} />
            )}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        {items.length > 1 ? (
          <View style={styles.counter}>
            <Typography variant="captionStrong" color="#FFFFFF">
              {current + 1} / {items.length}
            </Typography>
          </View>
        ) : (
          <View />
        )}

        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={onClose}
          style={styles.close}
        >
          <X size={20} color="#FFFFFF" strokeWidth={2.4} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

interface ZoomableImageProps {
  uri: string;
  onClose: () => void;
  onZoomChange: (zoomed: boolean) => void;
}

function ZoomableImage({ uri, onClose, onZoomChange }: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const [zoomed, setZoomed] = useState(false);

  // The pager must stop stealing horizontal drags while the image is zoomed.
  useEffect(() => {
    onZoomChange(zoomed);
  }, [onZoomChange, zoomed]);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(startScale.value * event.scale, 1), MAX_SCALE);
    })
    .onEnd(() => {
      if (scale.value <= ZOOM_EPSILON) {
        scale.value = withTiming(1, { duration: duration.fast });
        offsetX.value = withTiming(0, { duration: duration.fast });
        offsetY.value = withTiming(0, { duration: duration.fast });
        scheduleOnRN(setZoomed, false);
      } else {
        scheduleOnRN(setZoomed, true);
      }
    });

  const pan = Gesture.Pan()
    .enabled(zoomed)
    .averageTouches(true)
    .onStart(() => {
      startX.value = offsetX.value;
      startY.value = offsetY.value;
    })
    .onUpdate((event) => {
      offsetX.value = startX.value + event.translationX;
      offsetY.value = startY.value + event.translationY;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > ZOOM_EPSILON) {
        scale.value = withSpring(1, { damping: 22, stiffness: 220 });
        offsetX.value = withSpring(0, { damping: 22, stiffness: 220 });
        offsetY.value = withSpring(0, { damping: 22, stiffness: 220 });
        scheduleOnRN(setZoomed, false);
      } else {
        scale.value = withSpring(2.5, { damping: 22, stiffness: 220 });
        scheduleOnRN(setZoomed, true);
      }
    });

  const tapToClose = Gesture.Tap().onEnd((_event, success) => {
    if (success && scale.value <= ZOOM_EPSILON) {
      scheduleOnRN(onClose);
    }
  });

  const gesture = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTap, tapToClose),
    Gesture.Simultaneous(pinch, pan)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Reanimated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={160}
          cachePolicy="memory-disk"
        />
      </Reanimated.View>
    </GestureDetector>
  );
}

interface VideoPageProps {
  item: Extract<MediaItem, { kind: 'video' | 'youtube' }>;
}

/**
 * Videos play in the system browser: YouTube cannot be embedded without a
 * WebView, and hosted files stream fine from there.
 */
function VideoPage({ item }: VideoPageProps) {
  const colors = useColors();
  const target = item.kind === 'youtube' ? item.watchUrl : item.uri;

  return (
    <View style={styles.videoPage}>
      {item.kind === 'youtube' ? (
        <Image
          source={{ uri: item.posterUri }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={160}
          cachePolicy="memory-disk"
        />
      ) : null}

      <View style={styles.videoOverlay}>
        <View style={[styles.videoIcon, { backgroundColor: colors.primary }]}>
          <Play size={28} color={colors.onPrimary} fill={colors.onPrimary} />
        </View>
        <Typography variant="h3" color="#FFFFFF" align="center">
          {item.kind === 'youtube' ? 'Vidéo YouTube' : 'Vidéo'}
        </Typography>
        <Button
          label="Lire la vidéo"
          fullWidth={false}
          onPress={() => void WebBrowser.openBrowserAsync(target)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
  },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  counter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  videoPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['3xl'],
  },
  videoIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
