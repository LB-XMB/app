/** Layout primitives shared by every component of the design system. */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 44,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 26,
  pill: 999,
} as const;

/** Horizontal padding used by every screen. */
export const screenPadding = spacing.lg;

/** Extra bottom padding so content clears the floating tab bar. */
export const tabBarHeight = 64;
export const tabBarInset = 12;

export const duration = {
  fast: 150,
  normal: 240,
  slow: 380,
} as const;
