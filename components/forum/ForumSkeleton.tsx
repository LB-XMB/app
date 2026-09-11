import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/ui/components';
import { radius, spacing } from '@/ui/theme';

/** Placeholder rows while the forum list is loading. */
export function ForumListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.card}>
          <Skeleton width={88} height={22} radius={radius.pill} />
          <Skeleton width="78%" height={18} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="92%" height={14} />
          <View style={styles.footer}>
            <Skeleton width={120} height={16} radius={radius.pill} />
            <Skeleton width={72} height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Placeholder of a news row. */
export function NewsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.news}>
          <Skeleton width={84} height={84} radius={radius.lg} />
          <View style={styles.newsBody}>
            <Skeleton width={96} height={18} radius={radius.pill} />
            <Skeleton width="90%" height={16} />
            <Skeleton width="70%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  news: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  newsBody: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
});
