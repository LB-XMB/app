import { ChevronRight, Download } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Resource } from '@/services/api';
import { AnimatedPressable, Typography } from '@/ui/components';
import { platformColor, radius, spacing, useColors } from '@/ui/theme';

import { ResourceIcon } from './ResourceIcon';

export interface ResourceRowProps {
  resource: Resource;
  onPress: () => void;
  /** Replaces the chevron, e.g. with a remove button in the favourites list. */
  trailing?: React.ReactNode;
}

/** Compact row used by the list layout, favourites and history. */
export function ResourceRow({ resource, onPress, trailing }: ResourceRowProps) {
  const colors = useColors();
  const tint = platformColor(resource.platform);

  const meta = [resource.platform, resource.category].filter(Boolean).join(' · ');

  return (
    <AnimatedPressable
      onPress={onPress}
      scale={0.985}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={resource.title}
    >
      <ResourceIcon
        logo={resource.logo}
        logoVersion={resource.logoVersion}
        platform={resource.platform}
        size={48}
      />

      <View style={styles.body}>
        <Typography variant="title" numberOfLines={1}>
          {resource.title}
        </Typography>
        {meta ? (
          <Typography variant="caption" color="secondary" numberOfLines={1}>
            {meta}
          </Typography>
        ) : null}
        {resource.version || resource.downloads > 0 ? (
          <View style={styles.metaRow}>
            {resource.version ? (
              <View style={[styles.versionPill, { backgroundColor: `${tint}22` }]}>
                <Typography variant="mono" color={tint}>
                  v{resource.version}
                </Typography>
              </View>
            ) : null}
            {resource.downloads > 0 ? (
              <View style={styles.downloads}>
                <Download size={11} color={colors.textTertiary} strokeWidth={2.4} />
                <Typography variant="mono" color="tertiary">
                  {resource.downloads}
                </Typography>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {trailing ?? <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2.2} />}
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 1,
  },
  versionPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  downloads: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
