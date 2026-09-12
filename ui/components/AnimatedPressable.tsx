import * as Haptics from 'expo-haptics';
import { forwardRef, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useSettingsStore } from '@/stores/settings';

const AnimatedView = Reanimated.createAnimatedComponent(Pressable);

const SPRING = { damping: 22, stiffness: 420 } as const;

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
 *
 * Animations are started from the press handlers — never from inside
 * `useAnimatedStyle`, which would spawn a new spring on every frame.
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
      transform: [{ scale: 1 - progress.value * (1 - scale) }],
      opacity: 1 - progress.value * (1 - pressedOpacity),
    }));

    return (
      <AnimatedView
        ref={ref}
        {...rest}
        disabled={disabled}
        style={[style, animatedStyle]}
        onPressIn={(event) => {
          progress.value = withSpring(1, SPRING);
          if (haptic !== false && hapticsEnabled && Platform.OS !== 'web') {
            void Haptics.impactAsync(haptic);
          }
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          progress.value = withSpring(0, SPRING);
          onPressOut?.(event);
        }}
      >
        {children}
      </AnimatedView>
    );
  }
);
