import { useRouter } from 'expo-router';
import { ChevronLeft, Fingerprint, KeyRound, MessageCircle, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Reanimated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand/Logo';
import { ApiError } from '@/services/api';
import { AuthError, signInWithBrowser, type AuthMethod } from '@/services/api/auth';
import { useSessionStore } from '@/stores/session';
import { AnimatedPressable, Typography } from '@/ui/components';
import { radius, screenPadding, spacing, useTheme } from '@/ui/theme';

import { AuthBackdrop } from './AuthBackdrop';

interface MethodOption {
  method: AuthMethod;
  label: string;
  description: string;
  icon: typeof KeyRound;
  /** Brand colour of the provider, or `null` to use the app accent. */
  tint: string | null;
}

const METHODS: MethodOption[] = [
  {
    method: 'discord',
    label: 'Continuer avec Discord',
    description: 'Le plus rapide',
    icon: MessageCircle,
    tint: '#5865F2',
  },
  {
    method: 'password',
    label: 'Compte LB’XMB',
    description: 'Pseudo et mot de passe',
    icon: KeyRound,
    tint: null,
  },
  {
    method: 'passkey',
    label: 'Clé d’accès',
    description: 'Face ID, Touch ID ou code',
    icon: Fingerprint,
    tint: '#22C55E',
  },
];

export interface SignInViewProps {
  /**
   * `onboarding` is the step right after the privacy screen, which offers to
   * stay signed out; `standalone` is opened later on and can be dismissed.
   */
  mode: 'onboarding' | 'standalone';
}

/** Sign-in screen, on the background of the website's own login page. */
export function SignInView({ mode }: SignInViewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const signIn = useSessionStore((state) => state.signIn);
  const dismiss = useSessionStore((state) => state.dismiss);

  const [pending, setPending] = useState<AuthMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (method: AuthMethod) => {
    if (pending) return;
    setPending(method);
    setError(null);

    try {
      signIn(await signInWithBrowser(method));
      if (mode === 'standalone') router.back();
    } catch (cause) {
      const authError = cause instanceof AuthError ? cause : null;
      // Giving up is a normal outcome, it does not deserve an error message.
      if (authError?.reason === 'cancelled') {
        setError('Connexion annulée — rouvre et attends « C’est autorisé » avant de fermer.');
        return;
      }
      setError(
        authError
          ? authError.userMessage
          : cause instanceof ApiError
            ? cause.userMessage
            : cause instanceof Error && cause.message
              ? cause.message
              : 'La connexion a échoué. Réessaie.'
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <View style={styles.root}>
      <AuthBackdrop />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (mode === 'standalone' ? spacing['3xl'] : spacing['4xl']),
            paddingBottom: insets.bottom + spacing['2xl'],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Reanimated.View
          entering={FadeInDown.duration(520).springify().damping(18)}
          style={styles.hero}
        >
          <Logo width={124} />
          <Typography variant="display" align="center" style={styles.heroTitle}>
            Rejoins la{'\n'}communauté
          </Typography>
          <Typography variant="body" color="secondary" align="center">
            Connecte-toi pour participer au forum, suivre tes ressources et retrouver tes
            favoris sur tous tes appareils.
          </Typography>
        </Reanimated.View>

        <View style={styles.methods}>
          {METHODS.map((option, index) => {
            const tint = option.tint ?? colors.primary;
            const MethodIcon = option.icon;
            const isPending = pending === option.method;

            return (
              <Reanimated.View
                key={option.method}
                entering={FadeInDown.duration(460)
                  .delay(180 + index * 90)
                  .springify()
                  .damping(18)}
              >
                <AnimatedPressable
                  onPress={() => void start(option.method)}
                  disabled={pending !== null}
                  scale={0.98}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ disabled: pending !== null, busy: isPending }}
                  style={[
                    styles.method,
                    {
                      borderColor: isPending ? tint : 'rgba(255, 255, 255, 0.10)',
                      opacity: pending !== null && !isPending ? 0.45 : 1,
                    },
                  ]}
                >
                  <View style={[styles.methodIcon, { backgroundColor: `${tint}26` }]}>
                    <MethodIcon size={20} color={tint} strokeWidth={2.2} />
                  </View>
                  <View style={styles.methodText}>
                    <Typography variant="h3">{option.label}</Typography>
                    <Typography variant="caption" color="secondary">
                      {isPending ? 'En attente de validation…' : option.description}
                    </Typography>
                  </View>
                </AnimatedPressable>
              </Reanimated.View>
            );
          })}
        </View>

        {error ? (
          <Reanimated.View
            entering={FadeIn.duration(200)}
            style={[styles.error, { borderColor: `${colors.danger}40` }]}
          >
            <Typography variant="caption" color="danger" align="center">
              {error}
            </Typography>
          </Reanimated.View>
        ) : null}

        <Reanimated.View entering={FadeInDown.duration(460).delay(460)} style={styles.register}>
          <View style={styles.separator} />
          <AnimatedPressable
            onPress={() => void start('register')}
            disabled={pending !== null}
            scale={0.97}
            style={styles.registerButton}
            accessibilityRole="button"
            accessibilityLabel="Créer un compte"
          >
            <UserPlus size={17} color={colors.primary} strokeWidth={2.3} />
            <Typography variant="title" color="primary">
              Créer un compte
            </Typography>
          </AnimatedPressable>
        </Reanimated.View>

        {mode === 'onboarding' ? (
          <Reanimated.View entering={FadeIn.duration(400).delay(620)} style={styles.skipRow}>
            <AnimatedPressable
              onPress={dismiss}
              disabled={pending !== null}
              scale={0.97}
              haptic={false}
              style={styles.skip}
              accessibilityRole="button"
              accessibilityLabel="Rester déconnecté"
            >
              <Typography variant="caption" color="tertiary" align="center">
                Rester déconnecté
              </Typography>
            </AnimatedPressable>
          </Reanimated.View>
        ) : null}
      </ScrollView>

      {mode === 'standalone' ? (
        <AnimatedPressable
          onPress={() => router.back()}
          scale={0.94}
          style={[styles.back, { top: insets.top + spacing.sm }]}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ChevronLeft size={22} color={colors.text} strokeWidth={2.4} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
    gap: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  heroTitle: {
    marginTop: spacing.sm,
  },
  methods: {
    gap: spacing.md,
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius['2xl'],
    borderCurve: 'continuous',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: {
    flex: 1,
    gap: 2,
  },
  error: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    backgroundColor: 'rgba(255, 77, 77, 0.10)',
  },
  register: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth * 2,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipRow: {
    marginTop: 'auto',
  },
  skip: {
    paddingVertical: spacing.md,
  },
  back: {
    position: 'absolute',
    left: screenPadding,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
});
