import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { AppProviders } from '@/components/providers/AppProviders';
import { useSettingsStore } from '@/stores/settings';
import { fontAssets, useTheme } from '@/ui/theme';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colors, scheme } = useTheme();
  const consent = useSettingsStore((state) => state.consent);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/* The privacy screen is the only reachable route until it is answered. */}
        <Stack.Protected guard={consent === 'unset'}>
          <Stack.Screen name="bienvenue" options={{ animation: 'fade' }} />
        </Stack.Protected>

        <Stack.Protected guard={consent !== 'unset'}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="ressource/[id]" />
          <Stack.Screen name="guides/index" />
          <Stack.Screen name="guides/[id]" />
          <Stack.Screen name="favoris" />
          <Stack.Screen name="historique" />
          <Stack.Screen name="parametres" />
          <Stack.Screen name="a-propos" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Rendering before the fonts resolve would flash system typography.
  if (!fontsLoaded && !fontError) return null;

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
