import { Children, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { AnimatedPressable } from './AnimatedPressable';
import { Typography } from './Typography';

export interface ListProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Grouped container, in the spirit of iOS inset lists. */
export function List({ children, style }: ListProps) {
  const colors = useColors();
  const items = Children.toArray(children).filter(Boolean);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {items.map((child, index) => (
        <View key={index}>
          {index > 0 ? (
            <View style={[styles.separator, { backgroundColor: colors.separator }]} />
          ) : null}
          {child}
        </View>
      ))}
    </View>
  );
}

export interface ListItemProps {
  title: string;
  subtitle?: string | null;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Tints the title, used for destructive rows. */
  titleColor?: string;
  disabled?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  titleColor,
  disabled,
}: ListItemProps) {
  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.itemText}>
        <Typography variant="title" color={titleColor} numberOfLines={1}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="secondary" numberOfLines={2}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </>
  );

  if (!onPress || disabled) {
    return <View style={[styles.item, disabled && styles.disabled]}>{content}</View>;
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      scale={0.985}
      style={styles.item}
      accessibilityRole="button"
    >
      {content}
    </AnimatedPressable>
  );
}

/** Small uppercase heading placed above a `List`. */
export function ListSectionTitle({ children }: { children: string }) {
  return (
    <Typography variant="label" color="tertiary" style={styles.sectionTitle}>
      {children}
    </Typography>
  );
}

List.Item = ListItem;
List.SectionTitle = ListSectionTitle;

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    minHeight: 54,
  },
  disabled: {
    opacity: 0.45,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  leading: {
    width: 28,
    alignItems: 'center',
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth * 2,
    marginLeft: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
});
