import { Image } from 'expo-image';
import { Package } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { siteUrl, uploadUrl } from '@/services/api';
import { platformColor, radius as radiusTokens, useColors } from '@/ui/theme';

export interface ResourceIconProps {
  /** Relative uploads path, or an absolute URL. */
  logo?: string | null;
  logoVersion?: string | null;
  platform?: string | null;
  size?: number;
  radius?: number;
  /** Set when the path is a website asset (e.g. `/lbxmb.png`) rather than an upload. */
  siteAsset?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Square resource artwork, falling back to a tinted placeholder. */
export function ResourceIcon({
  logo,
  logoVersion,
  platform,
  size = 56,
  radius = radiusTokens.md,
  siteAsset = false,
  style,
}: ResourceIconProps) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);
  const tint = platformColor(platform);

  const uri = useMemo(
    () => (siteAsset ? siteUrl(logo) : uploadUrl(logo, logoVersion)),
    [logo, logoVersion, siteAsset]
  );

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.item,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
        />
      ) : (
        <Package size={Math.round(size * 0.4)} color={tint} strokeWidth={2} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
