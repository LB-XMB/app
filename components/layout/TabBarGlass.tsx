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
 * iOS uses a plain clipped View (Liquid Glass was hard to read). Android /
 * others keep the same container; blur/overlay live in TabBar children.
 */
export function TabBarGlass({ children, borderColor }: TabBarGlassProps) {
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
        shadowOpacity: 0.28,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
});
