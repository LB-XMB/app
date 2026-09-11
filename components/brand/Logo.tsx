import { Image } from 'expo-image';
import { StyleSheet, type StyleProp, type ImageStyle } from 'react-native';

const LOGO = require('@/assets/images/logo.png');

/** Aspect ratio of the wordmark asset (640 × 372). */
const ASPECT = 1.72;

export interface LogoProps {
  width?: number;
  style?: StyleProp<ImageStyle>;
}

/** LB'XMB wordmark, cropped tight to the artwork. */
export function Logo({ width = 96, style }: LogoProps) {
  return (
    <Image
      source={LOGO}
      style={[{ width, height: Math.round(width / ASPECT) }, styles.logo, style]}
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
