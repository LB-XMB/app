import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { AnimatedPressable } from './AnimatedPressable';
import { Typography } from './Typography';

export interface ChipProps {
  label: string;
  /** Accent colour; defaults to the theme accent. */
  color?: string;
  selected?: boolean;
  onPress?: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  size?: 'small' | 'medium';
  /** Renders the label as a spaced-out uppercase tag. */
  uppercase?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Pill used for platforms, categories and filter values. */
export function Chip({
  label,
  color,
  selected = false,
  onPress,
  leading,
  trailing,
  size = 'medium',
  uppercase = false,
  style,
}: ChipProps) {
  const colors = useColors();
  const tint = color ?? colors.primary;

  // An explicit colour tints the outline so platform badges stay recognisable
  // even when the chip is not selected.
  const tinted = color !== undefined && !selected;

  const containerStyle: ViewStyle = {
    backgroundColor: selected ? tint : tinted ? `${tint}1A` : colors.glass,
    borderColor: selected ? tint : tinted ? `${tint}66` : colors.border,
    paddingVertical: size === 'small' ? 4 : 7,
    paddingHorizontal: size === 'small' ? spacing.sm : spacing.md,
  };

  const content = (
    <>
      {leading}
      <Typography
        variant={uppercase ? 'label' : 'captionStrong'}
        color={selected ? colors.onPrimary : tinted ? tint : colors.textSecondary}
        numberOfLines={1}
        style={size === 'small' && !uppercase ? styles.smallLabel : undefined}
      >
        {label}
      </Typography>
      {trailing}
    </>
  );

  if (!onPress) {
    return <View style={[styles.chip, containerStyle, style]}>{content}</View>;
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      scale={0.94}
      style={[styles.chip, containerStyle, style]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  smallLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});
