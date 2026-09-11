/**
 * Colour palettes.
 *
 * Values are aligned with the lbxmb.fr website design tokens
 * (see `web/src/app/globals.css`) so the app and the site feel like one product.
 */

export type ColorScheme = 'light' | 'dark';

export interface Palette {
  /** Root screen background. */
  background: string;
  /** Background of grouped sections sitting on top of `background`. */
  overground: string;
  /** Elevated container (cards, sheets). */
  card: string;
  /** Rows inside a card / list. */
  item: string;
  /** Translucent surface used for glassy overlays. */
  glass: string;
  /** Brand accent, used for interactive elements. */
  primary: string;
  /** Text/icon colour drawn on top of `primary`. */
  onPrimary: string;
  /** Secondary accent, used by the resources catalogue on the website. */
  accent: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  separator: string;
  success: string;
  warning: string;
  danger: string;
  /** Colour of the skeleton placeholders. */
  skeleton: string;
  /** Backdrop behind modals. */
  backdrop: string;
}

const dark: Palette = {
  background: '#07080B',
  overground: '#0B0D12',
  card: '#11131A',
  item: '#161923',
  glass: 'rgba(255, 255, 255, 0.06)',
  primary: '#3B82F6',
  onPrimary: '#FFFFFF',
  accent: '#F97316',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.58)',
  textTertiary: 'rgba(255, 255, 255, 0.38)',
  border: 'rgba(255, 255, 255, 0.09)',
  separator: 'rgba(255, 255, 255, 0.06)',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#FF4D4D',
  skeleton: 'rgba(255, 255, 255, 0.08)',
  backdrop: 'rgba(0, 0, 0, 0.62)',
};

const light: Palette = {
  background: '#FFFFFF',
  overground: '#F3F5F9',
  card: '#FFFFFF',
  item: '#FFFFFF',
  glass: 'rgba(10, 11, 15, 0.04)',
  primary: '#1D63D8',
  onPrimary: '#FFFFFF',
  accent: '#EA6A0C',
  text: '#0A0B0F',
  textSecondary: 'rgba(10, 11, 15, 0.58)',
  textTertiary: 'rgba(10, 11, 15, 0.38)',
  border: 'rgba(10, 11, 15, 0.09)',
  separator: 'rgba(10, 11, 15, 0.07)',
  success: '#15803D',
  warning: '#B45309',
  danger: '#DC2626',
  skeleton: 'rgba(10, 11, 15, 0.07)',
  backdrop: 'rgba(0, 0, 0, 0.35)',
};

export const palettes: Record<ColorScheme, Palette> = { light, dark };

/** Console families, matching the `--color-brand-*` tokens of the website. */
export const brandColors = {
  playstation: '#0072CE',
  xbox: '#107C10',
  nintendo: '#E60012',
  windows: '#0F8AE0',
  other: '#7C7F8A',
} as const;

const PLATFORM_FAMILIES: [RegExp, keyof typeof brandColors][] = [
  [/^(ps|playstation)/i, 'playstation'],
  [/^xbox/i, 'xbox'],
  [/^(nintendo|wii|switch|3ds|ds$)/i, 'nintendo'],
  [/^windows|^pc$/i, 'windows'],
];

/** Resolves the accent colour to use for a platform label such as `PS4`. */
export function platformColor(platform?: string | null): string {
  if (!platform) return brandColors.other;
  const label = platform.trim();
  for (const [pattern, family] of PLATFORM_FAMILIES) {
    if (pattern.test(label)) return brandColors[family];
  }
  return brandColors.other;
}
