import { useMemo, type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Reanimated, { LinearTransition } from 'react-native-reanimated';

import { layoutAnimation, type AnimationPreset } from '../animation';

type Align = 'start' | 'center' | 'end' | 'stretch' | 'between';

const FLEX_ALIGN: Record<Align, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  between: 'stretch',
};

const FLEX_JUSTIFY: Record<Align, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'flex-start',
  between: 'space-between',
};

export interface StackProps {
  children?: ReactNode;
  direction?: 'vertical' | 'horizontal';
  gap?: number;
  padding?: number | [number, number];
  /** Alignment on the cross axis. */
  align?: Align;
  /** Alignment on the main axis. */
  justify?: Align;
  flex?: boolean | number;
  wrap?: boolean;
  animated?: boolean;
  animation?: AnimationPreset;
  style?: StyleProp<ViewStyle>;
}

/** Flexbox helper used instead of repeating `flexDirection` everywhere. */
export function Stack({
  children,
  direction = 'vertical',
  gap = 0,
  padding,
  align = 'stretch',
  justify = 'start',
  flex,
  wrap,
  animated,
  animation = 'spring',
  style,
}: StackProps) {
  const computed = useMemo<ViewStyle>(() => {
    const [vertical, horizontal] = Array.isArray(padding)
      ? padding
      : [padding, padding];

    return {
      flexDirection: direction === 'horizontal' ? 'row' : 'column',
      alignItems: FLEX_ALIGN[align],
      justifyContent: FLEX_JUSTIFY[justify],
      gap: gap || undefined,
      paddingVertical: vertical,
      paddingHorizontal: horizontal,
      flexWrap: wrap ? 'wrap' : undefined,
      flex: flex === true ? 1 : typeof flex === 'number' ? flex : undefined,
    };
  }, [direction, gap, padding, align, justify, flex, wrap]);

  return (
    <Reanimated.View
      style={[computed, style]}
      layout={animated ? layoutAnimation(LinearTransition, animation) : undefined}
    >
      {children}
    </Reanimated.View>
  );
}
