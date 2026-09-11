import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Box, House, Search, UserPen, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

import { useSettingsStore } from '@/stores/settings';
import { Typography } from '@/ui/components';
import { radius, spacing, tabBarInset, useTheme } from '@/ui/theme';

/** Icons of the floating navigation bar, in the order of the design. */
const ROUTE_ICONS: Record<string, LucideIcon> = {
  index: House,
  catalogue: Box,
  recherche: Search,
  profil: UserPen,
};

const SPRING = { damping: 20, stiffness: 240, mass: 0.7 };

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const [trackWidth, setTrackWidth] = useState(0);

  const tabWidth = trackWidth > 0 ? trackWidth / state.routes.length : 0;
  const indicatorOffset = useDerivedValue(() =>
    withSpring(state.index * tabWidth, SPRING)
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorOffset.value }],
    width: tabWidth,
  }));

  return (
    <View
      style={[styles.wrapper, { paddingBottom: insets.bottom + tabBarInset }]}
      pointerEvents="box-none"
    >
      <View style={[styles.pill, { borderColor: colors.border }]}>
        <BlurView
          intensity={Platform.OS === 'android' ? 40 : 70}
          tint={scheme === 'dark' ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
        {/* The blur alone is too transparent over bright artwork. */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                scheme === 'dark' ? 'rgba(17, 19, 26, 0.72)' : 'rgba(255, 255, 255, 0.78)',
            },
          ]}
        />

        <View style={styles.track} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
          {tabWidth > 0 ? (
            <Reanimated.View style={[styles.indicatorSlot, indicatorStyle]}>
              <View style={[styles.indicator, { backgroundColor: `${colors.primary}24` }]} />
            </Reanimated.View>
          ) : null}

          {state.routes.map((route, index) => {
            const Icon = ROUTE_ICONS[route.name] ?? House;
            const isFocused = state.index === index;
            const { options } = descriptors[route.key] ?? {};
            const label = options?.title ?? route.name;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={label}
                style={styles.tab}
                onPress={() => {
                  if (hapticsEnabled && Platform.OS !== 'web') {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                  }
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
              >
                <Icon
                  size={22}
                  color={isFocused ? colors.primary : colors.textSecondary}
                  strokeWidth={isFocused ? 2.4 : 2}
                />
                <Typography
                  variant="label"
                  color={isFocused ? 'primary' : 'tertiary'}
                  style={styles.label}
                  numberOfLines={1}
                >
                  {label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  pill: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  track: {
    flexDirection: 'row',
    paddingVertical: 9,
  },
  indicatorSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 58,
    height: 38,
    borderRadius: radius.pill,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  label: {
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
});
