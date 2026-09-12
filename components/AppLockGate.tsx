import * as LocalAuthentication from 'expo-local-authentication';
import { Lock } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { useSettingsStore } from '@/stores/settings';
import { Button, Typography } from '@/ui/components';
import { spacing, useColors } from '@/ui/theme';

export async function canUseAppLock(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

async function authenticate(promptMessage: string): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const available = await canUseAppLock();
  if (!available) return true;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Annuler',
    disableDeviceFallback: false,
  });
  return result.success;
}

function AppLockOverlay({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const colors = useColors();
  const [locked, setLocked] = useState(true);
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await authenticate(t('lock.unlock'));
      if (!cancelled && ok) setLocked(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [challenge, t]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        setLocked(true);
        setChallenge((value) => value + 1);
      }
    });
    return () => sub.remove();
  }, []);

  const onUnlockPress = () => {
    setBusy(true);
    void authenticate(t('lock.unlock'))
      .then((ok) => {
        if (ok) setLocked(false);
      })
      .finally(() => setBusy(false));
  };

  if (!locked) return <>{children}</>;

  return (
    <View style={[styles.lock, { backgroundColor: colors.background }]}>
      <Lock size={36} color={colors.primary} strokeWidth={2} />
      <Typography variant="h2" align="center">
        {t('lock.title')}
      </Typography>
      <Typography variant="body" color="secondary" align="center">
        {t('lock.hint')}
      </Typography>
      <Button
        label={busy ? '…' : t('lock.unlock')}
        onPress={onUnlockPress}
        disabled={busy}
      />
    </View>
  );
}

/** Blocks the UI until biometric / device unlock succeeds when opt-in is on. */
export function AppLockGate({ children }: { children: ReactNode }) {
  const enabled = useSettingsStore((state) => state.appLockEnabled);
  if (!enabled) return <>{children}</>;
  return <AppLockOverlay>{children}</AppLockOverlay>;
}

const styles = StyleSheet.create({
  lock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['2xl'],
  },
});
