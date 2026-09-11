import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '../theme/ThemeProvider';
import { radius as radiusTokens, spacing } from '../theme/tokens';
import { AnimatedPressable } from './AnimatedPressable';

export interface CardProps {
  children?: ReactNode;
  onPress?: () => void;
  padding?: number;
  radius?: number;
  /** Uses the translucent glass surface instead of the solid card colour. */
  glass?: boolean;
  bordered?: boolean;
  /** Tints the border, e.g. with the platform colour. */
  accent?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  onPress,
  padding = spacing.lg,
  radius = radiusTokens.xl,
  glass = false,
  bordered = true,
  accent,
  style,
}: CardProps) {
  const colors = useColors();

  const containerStyle: ViewStyle = {
    backgroundColor: glass ? colors.glass : colors.card,
    borderRadius: radius,
    padding,
    borderWidth: bordered ? StyleSheet.hairlineWidth * 2 : 0,
    borderColor: accent ?? colors.border,
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        style={[styles.base, containerStyle, style]}
        accessibilityRole="button"
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[styles.base, containerStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderCurve: 'continuous',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      default: {},
    }),
  },
});
