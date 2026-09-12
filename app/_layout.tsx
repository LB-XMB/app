import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { AppLockGate } from '@/components/AppLockGate';
import { AppProviders } from '@/components/providers/AppProviders';
import { WhatsNewSheet } from '@/components/WhatsNewSheet';
import '@/i18n';
import { useSessionStore } from '@/stores/session';
import { useSettingsStore } from '@/stores/settings';
import { fontAssets, useTheme } from '@/ui/theme';

void SplashScreen.preventAutoHideAsync();

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

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
