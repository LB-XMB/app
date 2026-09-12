import { Download } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Resource } from '@/services/api';
import { AnimatedPressable, Chip, Typography } from '@/ui/components';
import { platformColor, radius, spacing, useColors } from '@/ui/theme';

import { ResourceIcon } from './ResourceIcon';

export interface ResourceCardProps {
  resource: Resource;
  onPress: () => void;
}

/** Grid tile used by the catalogue and the home carousels. */
export function ResourceCard({ resource, onPress }: ResourceCardProps) {
  const colors = useColors();
  const tint = platformColor(resource.platform);

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={resource.title}
    >
      <ResourceIcon
        logo={resource.logo}
        logoVersion={resource.logoVersion}
        platform={resource.platform}
        size={52}
      />

      <View style={styles.body}>
        <Typography variant="title" numberOfLines={2}>
          {resource.title}
        </Typography>
        {resource.category ? (
          <Typography variant="caption" color="secondary" numberOfLines={1}>
            {resource.category}
          </Typography>
        ) : null}
      </View>

      <View style={styles.footer}>
        {resource.platform ? (
          <Chip label={resource.platform} color={tint} size="small" />
        ) : (
          <View />
        )}
        <View style={styles.downloads}>
          <Download size={12} color={colors.textTertiary} strokeWidth={2.4} />
          <Typography variant="mono" color="tertiary">
            {resource.downloads}
          </Typography>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  downloads: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
