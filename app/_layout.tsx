import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useRef, useState } from 'react';

import { AppLockGate } from '@/components/AppLockGate';
import { BootSplash } from '@/components/brand/BootSplash';
import { AppProviders } from '@/components/providers/AppProviders';
import { WhatsNewSheet } from '@/components/WhatsNewSheet';
import '@/i18n';
import { useSessionStore } from '@/stores/session';
import { readKawaiiLogoPref, useSettingsStore } from '@/stores/settings';
import { fontAssets, useTheme } from '@/ui/theme';

void SplashScreen.preventAutoHideAsync();

/** Keep the JS splash visible long enough to actually see the kawaii mark. */
const BOOT_SPLASH_MIN_MS = 700;

function RootNavigator() {
  const { colors, scheme } = useTheme();
  const consent = useSettingsStore((state) => state.consent);
  const signInPrompt = useSessionStore((state) => state.prompt);
  const onboarded = consent !== 'unset' && signInPrompt === 'answered';

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <AppLockGate>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Protected guard={consent === 'unset'}>
          <Stack.Screen name="bienvenue" options={{ animation: 'fade' }} />
        </Stack.Protected>

        <Stack.Protected guard={consent !== 'unset' && signInPrompt === 'unset'}>
          <Stack.Screen name="connexion" options={{ animation: 'fade' }} />
        </Stack.Protected>

        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="ressource/[id]" />
          <Stack.Screen name="guides/index" />
          <Stack.Screen name="guides/[id]" />
          <Stack.Screen name="favoris" />
          <Stack.Screen name="listes/index" />
          <Stack.Screen name="listes/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="profil/[id]" />
          <Stack.Screen name="historique" />
          <Stack.Screen name="parametres" />
          <Stack.Screen name="a-propos" />
          <Stack.Screen name="widgets" />
          <Stack.Screen name="compte" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="forum/index" />
          <Stack.Screen name="forum/[id]" />
          <Stack.Screen name="forum/nouveau" />
          <Stack.Screen name="actualites" />
        </Stack.Protected>
      </Stack>
      <WhatsNewSheet />
    </AppLockGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const kawaiiBoot = useRef(readKawaiiLogoPref()).current;
  const bootStartedAt = useRef(Date.now());
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    // Hand off from the baked native splash to the JS splash (same bg).
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    const elapsed = Date.now() - bootStartedAt.current;
    // Always show a short branded splash when kawaii is on; otherwise exit ASAP.
    const minMs = kawaiiBoot ? BOOT_SPLASH_MIN_MS : 0;
    const wait = Math.max(0, minMs - elapsed);
    const timer = setTimeout(() => setBootDone(true), wait);
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError, kawaiiBoot]);

  if (!bootDone) {
    return <BootSplash kawaii={kawaiiBoot} />;
  }

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
