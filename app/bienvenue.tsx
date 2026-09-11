import { Check, Cookie, EyeOff, Link2, Lock, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Reanimated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import { Logo } from '@/components/brand/Logo';
import { WEB_URLS } from '@/services/api';
import { useSettingsStore } from '@/stores/settings';
import { AnimatedPressable, Button, Screen, Typography } from '@/ui/components';
import { radius, screenPadding, spacing, useTheme } from '@/ui/theme';

type Choice = 'full' | 'none';

interface ChoiceOption {
  value: Choice;
  label: string;
  description: string;
  icon: typeof Cookie;
}

const CHOICES: ChoiceOption[] = [
  {
    value: 'full',
    label: 'Je veux aider l’application',
    description: 'Statistiques d’usage anonymes',
    icon: Cookie,
  },
  {
    value: 'none',
    label: 'Rien du tout',
    description: 'Aucune donnée ne quitte ton appareil',
    icon: EyeOff,
  },
];

const ARGUMENTS = [
  { icon: Check, label: 'Sert uniquement à améliorer l’application' },
  { icon: Link2, label: 'Anonyme et sans lien avec ton identité' },
  { icon: Lock, label: 'On n’a pas accès à tes comptes' },
];

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const setConsent = useSettingsStore((state) => state.setConsent);
  const [choice, setChoice] = useState<Choice | null>(null);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Reanimated.View
          entering={FadeInDown.duration(520).springify().damping(18)}
          style={styles.hero}
        >
          <Logo width={92} />
          <Typography variant="display" align="center" style={styles.heroTitle}>
            Bienvenue sur{'\n'}LB’XMB
          </Typography>
          <Typography variant="body" color="secondary" align="center">
            Pour aider au développement de l’application, tu peux choisir de partager
            quelques infos d’usage.
          </Typography>
        </Reanimated.View>

        <View style={styles.choices}>
          {CHOICES.map((option, index) => {
            const isSelected = choice === option.value;
            const tint = option.value === 'full' ? colors.primary : colors.textSecondary;
            const OptionIcon = option.icon;

            return (
              <Reanimated.View
                key={option.value}
                entering={FadeInDown.duration(460)
                  .delay(180 + index * 90)
                  .springify()
                  .damping(18)}
              >
                <AnimatedPressable
                  onPress={() => setChoice(option.value)}
                  scale={0.98}
                  style={[
                    styles.choice,
                    {
                      backgroundColor: isSelected ? `${tint}1A` : colors.card,
                      borderColor: isSelected ? tint : colors.border,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={option.label}
                >
                  <View
                    style={[styles.choiceIcon, { backgroundColor: `${tint}1F` }]}
                  >
                    <OptionIcon size={20} color={tint} strokeWidth={2.2} />
                  </View>
                  <View style={styles.choiceText}>
                    <Typography variant="h3">{option.label}</Typography>
                    <Typography variant="caption" color="secondary">
                      {option.description}
                    </Typography>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: isSelected ? tint : colors.border,
                        backgroundColor: isSelected ? tint : 'transparent',
                      },
                    ]}
                  >
                    {isSelected ? (
                      <Reanimated.View entering={FadeIn.duration(160)}>
                        <Check size={13} color={colors.onPrimary} strokeWidth={3.5} />
                      </Reanimated.View>
                    ) : null}
                  </View>
                </AnimatedPressable>
              </Reanimated.View>
            );
          })}
        </View>

        <Reanimated.View
          entering={FadeInDown.duration(460).delay(380)}
          style={[
            styles.arguments,
            { backgroundColor: colors.overground, borderColor: colors.border },
          ]}
        >
          {ARGUMENTS.map(({ icon: ArgumentIcon, label }) => (
            <View key={label} style={styles.argument}>
              <ArgumentIcon size={16} color={colors.textSecondary} strokeWidth={2.2} />
              <Typography variant="caption" color="secondary" style={styles.argumentLabel}>
                {label}
              </Typography>
            </View>
          ))}
        </Reanimated.View>

        <Reanimated.View entering={FadeIn.duration(400).delay(520)}>
          <AnimatedPressable
            onPress={() => void WebBrowser.openBrowserAsync(WEB_URLS.privacy)}
            scale={0.97}
            haptic={false}
            style={styles.privacyLink}
            accessibilityRole="link"
          >
            <Typography
              variant="caption"
              color="primary"
              align="center"
              style={styles.underline}
            >
              En cas de doute, consulte notre politique de confidentialité
            </Typography>
          </AnimatedPressable>
        </Reanimated.View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.lg,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Button
          label={choice === null ? 'Fais ton choix' : 'Accepter'}
          onPress={() => choice && setConsent(choice)}
          disabled={choice === null}
          size="large"
          leading={
            choice === null ? (
              <Sparkles size={18} color={colors.onPrimary} strokeWidth={2.4} />
            ) : (
              <Check size={19} color={colors.onPrimary} strokeWidth={3} />
            )
          }
        />
        <Typography variant="caption" color="tertiary" align="center">
          Tu peux changer d’avis à tout moment depuis les paramètres.
        </Typography>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingBottom: spacing['3xl'],
    gap: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  heroTitle: {
    marginTop: spacing.xs,
  },
  choices: {
    gap: spacing.md,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius['2xl'],
    borderCurve: 'continuous',
    borderWidth: 1.5,
  },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: {
    flex: 1,
    gap: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arguments: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  argument: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  argumentLabel: {
    flex: 1,
  },
  privacyLink: {
    paddingVertical: spacing.xs,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
      default: {},
    }),
  },
});
