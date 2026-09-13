import type { ExpoConfig } from 'expo/config';

import { version as packageVersion } from './package.json';

/**
 * Release builds get their version from the git tag: the workflow writes it
 * into package.json, which also keeps EAS builds in sync.
 */
const VERSION = process.env.APP_VERSION ?? packageVersion;

/**
 * Stores require a build number that only ever grows. Deriving it from the
 * semantic version keeps it reproducible: 1.2.3 becomes 10203. Minor and patch
 * are therefore capped at 99.
 */
function buildNumber(version: string): number {
  const [major, minor, patch] = version
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
  return (major ?? 0) * 10_000 + (minor ?? 0) * 100 + (patch ?? 0);
}

const BUILD = Number.parseInt(process.env.APP_BUILD_NUMBER ?? '', 10) || buildNumber(VERSION);

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
    buildNumber: String(BUILD),
    supportsTablet: true,
    associatedDomains: ['applinks:lbxmb.fr', 'applinks:www.lbxmb.fr'],
    infoPlist: {
      CFBundleDisplayName: "LB'XMB",
      ITSAppUsesNonExemptEncryption: false,
      UIViewControllerBasedStatusBarAppearance: true,
      // The app never opens a local server, only https endpoints.
      NSAppTransportSecurity: { NSAllowsArbitraryLoads: false },
      NSFaceIDUsageDescription:
        'LB’XMB utilise Face ID pour déverrouiller l’application lorsque le verrouillage est activé.',
    },
  },
  android: {
    package: 'fr.lbxmb.app',
    versionCode: BUILD,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#07080B',
    },
    // Downloads land in the app sandbox and are handed to the share sheet, so
    // no storage or media permission is needed.
    permissions: [
      'android.permission.INTERNET',
      'android.permission.POST_NOTIFICATIONS',
    ],
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'lbxmb.fr',
            pathPrefix: '/ressources',
          },
          {
            scheme: 'https',
            host: 'lbxmb.fr',
            pathPrefix: '/guides',
          },
          {
            scheme: 'https',
            host: 'lbxmb.fr',
            pathPrefix: '/forum',
          },
          {
            scheme: 'https',
            host: 'lbxmb.fr',
            pathPrefix: '/profil',
          },
          {
            scheme: 'https',
            host: 'www.lbxmb.fr',
            pathPrefix: '/ressources',
          },
          {
            scheme: 'https',
            host: 'www.lbxmb.fr',
            pathPrefix: '/guides',
          },
          {
            scheme: 'https',
            host: 'www.lbxmb.fr',
            pathPrefix: '/forum',
          },
          {
            scheme: 'https',
            host: 'www.lbxmb.fr',
            pathPrefix: '/profil',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        data: [{ scheme: 'lbxmb' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
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
    'expo-secure-store',
    'expo-localization',
    'expo-local-authentication',
    [
      'expo-notifications',
      {
        color: '#3B82F6',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        // The asset is square with internal padding, so the visible wordmark is
        // roughly 55 % of this width once Android has applied its circular mask.
        imageWidth: 240,
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
    'expo-video',
    [
      'react-native-android-widget',
      {
        widgets: [
          {
            name: 'Stats',
            label: 'Stats communauté',
            description: 'Ressources, guides et membres LB’XMB',
            minWidth: '180dp',
            minHeight: '110dp',
            targetCellWidth: 4,
            targetCellHeight: 2,
            resizeMode: 'horizontal|vertical',
            updatePeriodMillis: 1_800_000,
          },
          {
            name: 'Popular',
            label: 'Populaires',
            description: 'Ressources populaires LB’XMB',
            minWidth: '180dp',
            minHeight: '110dp',
            targetCellWidth: 4,
            targetCellHeight: 2,
            resizeMode: 'horizontal|vertical',
            updatePeriodMillis: 1_800_000,
          },
        ],
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
