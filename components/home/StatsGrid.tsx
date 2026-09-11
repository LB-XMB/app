import { BookOpen, HardDrive, Package, Users, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
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
            <Skeleton width={30} height={30} radius={radius.sm} />
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={10} />
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
            <Typography variant="h2" numberOfLines={1}>
              {tile.value}
            </Typography>
            <Typography variant="label" color="tertiary" numberOfLines={1}>
              {tile.label}
            </Typography>
          </Reanimated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '44%',
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
    marginBottom: 2,
  },
});
