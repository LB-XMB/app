import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '../theme/ThemeProvider';
import { radius as radiusTokens } from '../theme/tokens';

export interface IconBadgeProps {
  icon: LucideIcon;
  color?: string;
  size?: number;
  iconSize?: number;
  radius?: number;
  /** Solid background instead of the 12% tint. */
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Rounded square holding an icon, used in lists and stat cards. */
export function IconBadge({
  icon: Icon,
  color,
  size = 36,
  iconSize,
  radius = radiusTokens.md,
  filled = false,
  style,
}: IconBadgeProps) {
  const colors = useColors();
  const tint = color ?? colors.primary;

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: filled ? tint : `${tint}1F`,
        },
        style,
      ]}
    >
      <Icon
        size={iconSize ?? Math.round(size * 0.5)}
        color={filled ? colors.onPrimary : tint}
        strokeWidth={2.2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
});
