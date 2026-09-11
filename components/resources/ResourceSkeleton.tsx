import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

export function ResourceCardSkeleton() {
  const colors = useColors();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Skeleton width={52} height={52} radius={radius.md} />
      <View style={styles.lines}>
        <Skeleton width="85%" height={13} />
        <Skeleton width="55%" height={11} />
      </View>
      <Skeleton width={64} height={20} radius={radius.pill} />
    </View>
  );
}

export function ResourceRowSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton width={48} height={48} radius={radius.md} />
      <View style={styles.lines}>
        <Skeleton width="60%" height={13} />
        <Skeleton width="40%" height={11} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 168,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  lines: {
    flex: 1,
    gap: spacing.sm,
  },
});
