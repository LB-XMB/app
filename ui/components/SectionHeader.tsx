import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useColors } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { AnimatedPressable } from './AnimatedPressable';
import { Typography } from './Typography';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.titles}>
        <Typography variant="h2">{title}</Typography>
        {subtitle ? (
          <Typography variant="caption" color="secondary">
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <AnimatedPressable
          onPress={onAction}
          scale={0.95}
          style={styles.action}
          accessibilityRole="button"
        >
          <Typography variant="captionStrong" color="primary">
            {actionLabel}
          </Typography>
          <ChevronRight size={15} color={colors.primary} strokeWidth={2.5} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
  },
});
