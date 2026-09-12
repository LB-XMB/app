import { WifiOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Typography } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

/** Shown when a detail screen serves persisted data after a network failure. */
export function OfflineCacheBanner({ visible }: { visible: boolean }) {
  const colors = useColors();
  if (!visible) return null;
  return (
    <View style={[styles.banner, { backgroundColor: `${colors.warning}22`, borderColor: colors.border }]}>
      <WifiOff size={14} color={colors.warning} strokeWidth={2.3} />
      <Typography variant="caption" color="secondary" style={styles.text}>
        Hors ligne (cache)
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  text: {
    flex: 1,
  },
});
