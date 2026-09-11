import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable, Typography } from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  /** Action buttons displayed on the right. */
  actions?: ReactNode;
  /** Hides the title, e.g. while a hero image is still visible. */
  transparent?: boolean;
}

/** Back button plus optional title, used by every pushed screen. */
export function ScreenHeader({
  title,
  subtitle,
  actions,
  transparent = false,
}: ScreenHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: transparent ? 'transparent' : colors.background,
          borderBottomColor: transparent ? 'transparent' : colors.separator,
        },
      ]}
    >
      <AnimatedPressable
        onPress={() => router.back()}
        scale={0.9}
        style={[styles.button, { backgroundColor: colors.item, borderColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel="Retour"
      >
        <ChevronLeft size={20} color={colors.text} strokeWidth={2.4} />
      </AnimatedPressable>

      <View style={styles.titles}>
        {title ? (
          <Typography variant="h3" numberOfLines={1}>
            {title}
          </Typography>
        ) : null}
        {subtitle ? (
          <Typography variant="caption" color="secondary" numberOfLines={1}>
            {subtitle}
          </Typography>
        ) : null}
      </View>

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

/** Circular header action, matching the back button. */
export function HeaderAction({
  children,
  onPress,
  label,
  accent,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  accent?: string;
}) {
  const colors = useColors();
  return (
    <AnimatedPressable
      onPress={onPress}
      scale={0.9}
      style={[
        styles.button,
        {
          backgroundColor: accent ? `${accent}24` : colors.item,
          borderColor: accent ?? colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  titles: {
    flex: 1,
    gap: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
