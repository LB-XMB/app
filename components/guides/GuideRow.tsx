import { BookOpen, ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Guide } from '@/services/api';
import { AnimatedPressable, IconBadge, Typography } from '@/ui/components';
import { platformColor, radius, spacing, useColors } from '@/ui/theme';

export interface GuideRowProps {
  guide: Guide;
  onPress: () => void;
}

export function GuideRow({ guide, onPress }: GuideRowProps) {
  const colors = useColors();
  const tint = platformColor(guide.platform);
  const meta = [guide.platform, guide.category].filter(Boolean).join(' · ');

  return (
    <AnimatedPressable
      onPress={onPress}
      scale={0.985}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={guide.title}
    >
      <IconBadge icon={BookOpen} color={tint} size={44} radius={radius.md} />

      <View style={styles.body}>
        <Typography variant="title" numberOfLines={2}>
          {guide.title}
        </Typography>
        {meta ? (
          <Typography variant="caption" color="secondary" numberOfLines={1}>
            {meta}
          </Typography>
        ) : null}
      </View>

      <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2.2} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  body: {
    flex: 1,
    gap: 3,
  },
});
