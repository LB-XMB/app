import { BookOpen, HardDrive, Package, Users, type LucideIcon } from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import type { HomeStats } from '@/services/api';
import { Skeleton, Typography } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

interface StatTile {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}

export interface StatsGridProps {
  stats?: HomeStats;
  loading?: boolean;
}

function formatCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(value);
}

export function StatsGrid({ stats, loading }: StatsGridProps) {
  const colors = useColors();

  if (loading || !stats) {
    return (
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Skeleton width={28} height={28} radius={radius.sm} />
            <Skeleton width="70%" height={VALUE_SLOT} />
            <Skeleton width="50%" height={LABEL_SLOT} />
          </View>
        ))}
      </View>
    );
  }

  const tiles: StatTile[] = [
    {
      icon: Package,
      label: 'Ressources',
      value: formatCount(stats.resources),
      color: colors.primary,
    },
    {
      icon: BookOpen,
      label: 'Guides',
      value: formatCount(stats.guides),
      color: colors.accent,
    },
    { icon: Users, label: 'Membres', value: formatCount(stats.users), color: colors.success },
    {
      icon: HardDrive,
      label: 'Hébergés',
      value: stats.storage || '—',
      color: colors.warning,
    },
  ];

  return (
    <View style={styles.grid}>
      {tiles.map((tile, index) => {
        const TileIcon = tile.icon;
        return (
          <Reanimated.View
            key={tile.label}
            entering={FadeInDown.duration(380).delay(index * 60)}
            style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${tile.color}1F` }]}>
              <TileIcon size={15} color={tile.color} strokeWidth={2.4} />
            </View>
            <View style={styles.valueSlot}>
              <Typography variant="h2" numberOfLines={1} style={styles.valueText}>
                {tile.value}
              </Typography>
            </View>
            <View style={styles.labelSlot}>
              <Typography variant="label" color="tertiary" numberOfLines={1}>
                {tile.label}
              </Typography>
            </View>
          </Reanimated.View>
        );
      })}
    </View>
  );
}

/** Match Typography h2 / label metrics so every tile shares the same baselines. */
const VALUE_SLOT = 28;
const LABEL_SLOT = 14;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  tile: {
    width: '48.5%',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueSlot: {
    height: VALUE_SLOT,
    justifyContent: 'center',
  },
  valueText: {
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
    fontVariant: ['tabular-nums'],
    lineHeight: VALUE_SLOT,
  },
  labelSlot: {
    height: LABEL_SLOT,
    justifyContent: 'center',
  },
});
