import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { uploadUrl } from '@/services/api';
import { Typography } from '@/ui/components';
import { radius, useColors } from '@/ui/theme';

export interface ForumAvatarProps {
  /** Relative uploads path or absolute URL of the member photo. */
  photo: string | null;
  pseudo: string;
  size?: number;
}

/** Member avatar, falling back to the initial when no photo is set. */
export function ForumAvatar({ photo, pseudo, size = 32 }: ForumAvatarProps) {
  const colors = useColors();
  const uri = uploadUrl(photo);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          backgroundColor: colors.item,
          borderColor: colors.border,
        },
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
        <Typography variant="captionStrong" color="secondary">
          {pseudo.slice(0, 1).toUpperCase()}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
