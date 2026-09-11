import { X } from 'lucide-react-native';
import { useCallback, useEffect, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '../theme/ThemeProvider';
import { duration, radius, spacing } from '../theme/tokens';
import { AnimatedPressable } from './AnimatedPressable';
import { Typography } from './Typography';

const SPRING = { damping: 26, stiffness: 260, mass: 0.9 };
/** Drag distance past which the sheet closes instead of springing back. */
const DISMISS_THRESHOLD = 110;

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Fraction of the screen height the sheet may occupy. */
  maxHeightRatio?: number;
}

/** Bottom sheet with a drag handle and swipe-to-dismiss. */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeightRatio = 0.85,
}: SheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const translateY = useSharedValue(height);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING);
      backdropOpacity.value = withTiming(1, { duration: duration.normal });
    } else {
      translateY.value = height;
      backdropOpacity.value = 0;
    }
  }, [visible, height, translateY, backdropOpacity]);

  const close = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: duration.fast });
    translateY.value = withTiming(height, { duration: duration.normal }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [backdropOpacity, translateY, height, onClose]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 900) {
        backdropOpacity.value = withTiming(0, { duration: duration.fast });
        translateY.value = withTiming(height, { duration: duration.normal }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0, SPRING);
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={close}
    >
      <View style={styles.root}>
        <Reanimated.View
          style={[styles.backdrop, { backgroundColor: colors.backdrop }, backdropStyle]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Fermer" />
        </Reanimated.View>

        <Reanimated.View
          style={[
            styles.panel,
            {
              backgroundColor: colors.overground,
              borderColor: colors.border,
              maxHeight: height * maxHeightRatio,
              paddingBottom: insets.bottom + spacing.lg,
            },
            panelStyle,
          ]}
        >
          <GestureDetector gesture={panGesture}>
            <View style={styles.header}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              {title ? (
                <View style={styles.titleRow}>
                  <View style={styles.titles}>
                    <Typography variant="h2" numberOfLines={1}>
                      {title}
                    </Typography>
                    {subtitle ? (
                      <Typography variant="caption" color="secondary" numberOfLines={2}>
                        {subtitle}
                      </Typography>
                    ) : null}
                  </View>
                  <AnimatedPressable
                    onPress={close}
                    scale={0.9}
                    style={[styles.closeButton, { backgroundColor: colors.glass }]}
                    accessibilityRole="button"
                    accessibilityLabel="Fermer"
                  >
                    <X size={18} color={colors.textSecondary} strokeWidth={2.5} />
                  </AnimatedPressable>
                </View>
              ) : null}
            </View>
          </GestureDetector>

          {children}
        </Reanimated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderCurve: 'continuous',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
  header: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: radius.pill,
    alignSelf: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
