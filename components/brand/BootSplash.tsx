import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

const SPLASH_DEFAULT = require('@/assets/images/splash-icon.png');
const SPLASH_KAWAII = require('@/assets/images/kawaii-service-logo.png');

/** Matches `expo-splash-screen` backgroundColor in app.config.ts. */
export const BOOT_SPLASH_BG = '#07080B';

export interface BootSplashProps {
  kawaii?: boolean;
}

/**
 * JS splash shown as soon as the bundle runs — mirrors the native splash
 * background so we can swap the mark based on the persisted kawaii toggle
 * (native splash image is fixed at build time).
 */
export function BootSplash({ kawaii = false }: BootSplashProps) {
  return (
    <View style={styles.root} accessibilityLabel="LB'XMB">
      <Image
        source={kawaii ? SPLASH_KAWAII : SPLASH_DEFAULT}
        style={kawaii ? styles.kawaii : styles.default}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BOOT_SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Same visual weight as expo-splash-screen imageWidth: 240. */
  default: {
    width: 240,
    height: 240,
  },
  kawaii: {
    width: 260,
    height: Math.round(260 / 2.068),
  },
});
