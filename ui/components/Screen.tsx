import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '../theme/ThemeProvider';

export interface ScreenProps {
  children: ReactNode;
  /** Draws the soft accent glow used at the top of most screens. */
  glow?: boolean;
  /** Overrides the glow colour, e.g. with a platform accent. */
  glowColor?: string;
  style?: StyleProp<ViewStyle>;
}

/** Root container of every screen: background colour plus optional accent glow. */
export function Screen({ children, glow = true, glowColor, style }: ScreenProps) {
  const colors = useColors();
  const tint = glowColor ?? colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {glow ? (
        <LinearGradient
          colors={[`${tint}2E`, `${tint}0F`, `${tint}00`]}
          locations={[0, 0.45, 1]}
          style={styles.glow}
          pointerEvents="none"
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 440,
  },
});
