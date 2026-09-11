import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import type { ColorScheme } from '@/ui/theme';
import { radius } from '@/ui/theme';

export interface TabBarGlassProps {
  children: ReactNode;
  scheme: ColorScheme;
  borderColor: string;
}

/**
 * Floating pill of the tab bar.
 *
 * On iOS 26 the real Liquid Glass material is used; everywhere else the
 * children provide the BlurView fallback.
 */
export function TabBarGlass({ children, scheme, borderColor }: TabBarGlassProps) {
  if (Platform.OS === 'ios' && isLiquidGlassSupported) {
    return (
      <LiquidGlassView
        effect="regular"
        interactive
        colorScheme={scheme}
        style={[styles.pill, styles.glass]}
      >
        {children}
      </LiquidGlassView>
    );
  }

  return <View style={[styles.pill, { borderColor }]}>{children}</View>;
}

const styles = StyleSheet.create({
  pill: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  glass: {
    // Liquid Glass draws its own border and fill.
    overflow: 'visible',
    borderWidth: 0,
  },
});
