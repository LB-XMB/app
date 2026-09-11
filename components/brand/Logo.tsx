import { Image } from 'expo-image';
import { StyleSheet, type StyleProp, type ImageStyle } from 'react-native';

const LOGO = require('@/assets/images/logo.png');

export interface LogoProps {
  width?: number;
  style?: StyleProp<ImageStyle>;
}

/** LB'XMB wordmark. The source asset is square with transparent padding. */
export function Logo({ width = 96, style }: LogoProps) {
  return (
    <Image
      source={LOGO}
      style={[{ width, height: width }, styles.logo, style]}
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
