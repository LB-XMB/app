import type { ExpoConfig } from 'expo/config';

const VERSION = '1.0.0';

const config: ExpoConfig = {
  name: "LB'XMB",
  slug: 'lbxmb',
  version: VERSION,
  scheme: 'lbxmb',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  backgroundColor: '#07080B',
  primaryColor: '#3B82F6',
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'fr.lbxmb.app',
    buildNumber: VERSION,
    supportsTablet: true,
    infoPlist: {
      CFBundleDisplayName: "LB'XMB",
      ITSAppUsesNonExemptEncryption: false,
      UIViewControllerBasedStatusBarAppearance: true,
    },
  },
  android: {
    package: 'fr.lbxmb.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#07080B',
    },
  },
  web: {
    bundler: 'metro',
    output: 'single',
  },
  plugins: [
    [
      'expo-router',
      {
        origin: 'https://lbxmb.fr',
      },
    ],
    'expo-font',
    'expo-web-browser',
    'expo-sharing',
    [
      'expo-splash-screen',
      {
        image: './assets/images/icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: '#07080B',
        dark: {
          backgroundColor: '#07080B',
        },
      },
    ],
    [
      'expo-image',
      {
        enableLiveTextInteraction: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: false,
  },
  extra: {
    apiBaseUrl: 'https://lbxmb.fr',
    umamiHost: 'https://analytics.lbxmb.fr',
    umamiWebsiteId: '45efc25a-b0f4-4e86-b2a6-3f30ebb8e7a5',
  },
};

export default config;
