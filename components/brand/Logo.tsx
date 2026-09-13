import { Image } from 'expo-image';
import { StyleSheet, type StyleProp, type ImageStyle } from 'react-native';

import { useSettingsStore } from '@/stores/settings';

const LOGO_DEFAULT = require('@/assets/images/logo.png');
const LOGO_KAWAII = require('@/assets/images/kawaii-service-logo.png');

/** Aspect ratio of the default wordmark (640 × 372). */
const ASPECT_DEFAULT = 1.72;
/** Aspect ratio of the kawaii service logo (2277 × 1101). */
const ASPECT_KAWAII = 2.068;

export interface LogoProps {
  width?: number;
  style?: StyleProp<ImageStyle>;
  /** Force a variant; otherwise follows the settings toggle. */
  variant?: 'default' | 'kawaii';
}

/** LB'XMB wordmark, cropped tight to the artwork. */
export function Logo({ width = 96, style, variant }: LogoProps) {
  const kawaiiPref = useSettingsStore((state) => state.kawaiiLogo);
  const kawaii = variant === 'kawaii' || (variant == null && kawaiiPref);
  const aspect = kawaii ? ASPECT_KAWAII : ASPECT_DEFAULT;

  return (
    <Image
      source={kawaii ? LOGO_KAWAII : LOGO_DEFAULT}
      style={[{ width, height: Math.round(width / aspect) }, styles.logo, style]}
      contentFit="contain"
      accessibilityLabel="LB'XMB"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});
