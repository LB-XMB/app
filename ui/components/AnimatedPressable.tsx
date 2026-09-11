import * as Haptics from 'expo-haptics';
import { forwardRef, type ReactNode } from 'react';
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle, type View } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useSettingsStore } from '@/stores/settings';

import { duration } from '../theme/tokens';

const AnimatedView = Reanimated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  /** Scale applied while pressed. */
  scale?: number;
  /** Opacity applied while pressed. */
  pressedOpacity?: number;
  haptic?: false | Haptics.ImpactFeedbackStyle;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pressable with the spring + fade feedback used across the app.
 */
export const AnimatedPressable = forwardRef<View, AnimatedPressableProps>(
  function AnimatedPressable(
    {
      children,
      scale = 0.97,
      pressedOpacity = 0.75,
      haptic = Haptics.ImpactFeedbackStyle.Soft,
      style,
      onPressIn,
      onPressOut,
      disabled,
      ...rest
    },
    ref
  ) {
    const progress = useSharedValue(0);
    const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: withSpring(1 - progress.value * (1 - scale), {
            damping: 22,
            stiffness: 420,
          }),
        },
      ],
      opacity: withTiming(1 - progress.value * (1 - pressedOpacity), {
        duration: duration.fast,
      }),
    }));

    return (
      <AnimatedView
        ref={ref}
        {...rest}
        disabled={disabled}
        style={[style, animatedStyle]}
        onPressIn={(event) => {
          progress.value = 1;
          if (haptic !== false && hapticsEnabled && Platform.OS !== 'web') {
            void Haptics.impactAsync(haptic);
          }
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          progress.value = 0;
          onPressOut?.(event);
        }}
      >
        {children}
      </AnimatedView>
    );
  }
);
