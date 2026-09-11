import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { Creator } from '@/services/api';
import { siteUrl } from '@/services/api';
import { Typography } from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

const AVATAR = 52;

export function CreatorsRow({ creators }: { creators: Creator[] }) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {creators.map((creator) => {
        const uri = siteUrl(creator.photo);
        return (
          <View key={creator.userId} style={styles.creator}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.item, borderColor: colors.border },
              ]}
            >
              {uri ? (
                <Image
                  source={{ uri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={160}
                  cachePolicy="memory-disk"
                />
              ) : (
                <User size={20} color={colors.textTertiary} strokeWidth={2.2} />
              )}
            </View>
            <Typography variant="caption" color="secondary" numberOfLines={1}>
              {creator.pseudo}
            </Typography>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingHorizontal: screenPadding,
  },
  creator: {
    width: 64,
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
