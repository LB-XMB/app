import { Image } from 'expo-image';
import {
  BookOpen,
  MessageSquare,
  Package,
  ShoppingBag,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SearchHit, SearchHitType } from '@/services/api';
import { siteUrl } from '@/services/api';
import { AnimatedPressable, Typography } from '@/ui/components';
import { platformColor, radius, spacing, useColors } from '@/ui/theme';

const TYPE_ICONS: Record<SearchHitType, LucideIcon> = {
  resource: Package,
  guide: BookOpen,
  forum_thread: MessageSquare,
  shop: ShoppingBag,
  profile: User,
  other: Package,
};

export const TYPE_LABELS: Record<SearchHitType, string> = {
  resource: 'Ressources',
  guide: 'Guides',
  forum_thread: 'Forum',
  shop: 'Boutique',
  profile: 'Profils',
  other: 'Autres',
};

export interface SearchHitRowProps {
  hit: SearchHit;
  onPress: () => void;
}

export function SearchHitRow({ hit, onPress }: SearchHitRowProps) {
  const colors = useColors();
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = TYPE_ICONS[hit.type];
  const tint = hit.platform ? platformColor(hit.platform) : colors.primary;
  const uri = siteUrl(hit.iconUrl);

  useEffect(() => {
    setImageFailed(false);
  }, [uri]);

  return (
    <AnimatedPressable
      onPress={onPress}
      scale={0.985}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={hit.title}
    >
      <View
        style={[
          styles.icon,
          { backgroundColor: uri && !imageFailed ? colors.item : `${tint}1F` },
        ]}
      >
        {uri && !imageFailed ? (
          <Image
            source={{ uri }}
            recyclingKey={uri}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={0}
            cachePolicy="memory-disk"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Icon size={17} color={tint} strokeWidth={2.2} />
        )}
      </View>

      <View style={styles.body}>
        <Typography variant="title" numberOfLines={1}>
          {hit.title.trim()}
        </Typography>
        {hit.subtitle ? (
          <Typography variant="caption" color="secondary" numberOfLines={1}>
            {hit.subtitle}
          </Typography>
        ) : null}
      </View>
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
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
});
