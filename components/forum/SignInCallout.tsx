import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, Typography } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

export interface SignInCalloutProps {
  /** Short reason shown under the title. */
  description?: string;
}

/** Soft prompt inviting a visitor to sign in before writing. */
export function SignInCallout({
  description = 'Connecte-toi pour poster, répondre et réagir.',
}: SignInCalloutProps) {
  const router = useRouter();
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Typography variant="title">Compte requis</Typography>
      <Typography variant="caption" color="secondary">
        {description}
      </Typography>
      <Button
        label="Se connecter"
        size="small"
        fullWidth={false}
        leading={<LogIn size={15} color={colors.onPrimary} strokeWidth={2.4} />}
        onPress={() => router.push('/compte')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'flex-start',
  },
});
