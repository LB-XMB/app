import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Box, HardDrive, House, Search, UserPen, type LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

import { useSettingsStore } from '@/stores/settings';
import { Typography } from '@/ui/components';
import { spacing, tabBarInset, useTheme } from '@/ui/theme';

import { TabBarGlass } from './TabBarGlass';

/** Icons of the floating navigation bar, in the order of the design. */
const ROUTE_ICONS: Record<string, LucideIcon> = {
  index: House,
  catalogue: Box,
  ftp: HardDrive,
  recherche: Search,
  profil: UserPen,
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  const tabs = (
    <View style={styles.track}>
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
  );

  return (
    <View
      style={[styles.wrapper, { paddingBottom: insets.bottom + tabBarInset }]}
      pointerEvents="box-none"
    >
      <TabBarGlass scheme={scheme} borderColor={colors.border}>
        {/* Fallback blur, kept under the liquid glass when it is available. */}
        <BlurView
          intensity={Platform.OS === 'android' ? 40 : 70}
          tint={scheme === 'dark' ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                scheme === 'dark' ? 'rgba(17, 19, 26, 0.55)' : 'rgba(255, 255, 255, 0.55)',
            },
          ]}
        />
        {tabs}
      </TabBarGlass>
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
  track: {
    flexDirection: 'row',
    paddingVertical: 9,
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
