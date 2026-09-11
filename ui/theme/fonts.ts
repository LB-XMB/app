import {
  Syne_500Medium,
  Syne_600SemiBold,
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

/**
 * Two families, following the website: Syne carries the brand (titles, buttons,
 * labels) while Inter handles running text where Syne's display shapes would
 * hurt readability.
 */
export const fontAssets = {
  'Syne-Medium': Syne_500Medium,
  'Syne-SemiBold': Syne_600SemiBold,
  'Syne-Bold': Syne_700Bold,
  'Syne-ExtraBold': Syne_800ExtraBold,
  'Inter-Regular': Inter_400Regular,
  'Inter-Medium': Inter_500Medium,
  'Inter-SemiBold': Inter_600SemiBold,
  'Inter-Bold': Inter_700Bold,
} as const;

export type FontName = keyof typeof fontAssets;

export const fonts = {
  display: {
    medium: 'Syne-Medium',
    semibold: 'Syne-SemiBold',
    bold: 'Syne-Bold',
    extrabold: 'Syne-ExtraBold',
  },
  text: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
} as const;
