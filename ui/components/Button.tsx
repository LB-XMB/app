import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { AnimatedPressable } from './AnimatedPressable';
import { Typography } from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

const HEIGHTS: Record<ButtonSize, number> = {
  small: 38,
  medium: 46,
  large: 54,
};

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Overrides the variant colour, e.g. a platform accent. */
  color?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  color,
  leading,
  trailing,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const colors = useColors();
  const tint = color ?? (variant === 'danger' ? colors.danger : colors.primary);
  const isInactive = disabled || loading;

  const background =
    variant === 'primary' || variant === 'danger'
      ? tint
      : variant === 'secondary'
        ? colors.item
        : 'transparent';

  const labelColor =
    variant === 'primary' || variant === 'danger'
      ? colors.onPrimary
      : variant === 'secondary'
        ? colors.text
        : tint;

  return (
    <AnimatedPressable
      onPress={isInactive ? undefined : onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={[
        styles.base,
        {
          height: HEIGHTS[size],
          backgroundColor: background,
          borderColor: variant === 'outline' ? colors.border : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          opacity: isInactive ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: size === 'small' ? spacing.md : spacing.xl,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <>
          {leading}
          <Typography
            variant={size === 'small' ? 'title' : 'button'}
            color={labelColor}
            numberOfLines={1}
          >
            {label}
          </Typography>
          {trailing}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
  },
});
