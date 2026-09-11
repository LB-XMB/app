import { Easing, LinearTransition } from 'react-native-reanimated';

import { duration } from './theme/tokens';

type LayoutBuilder = typeof LinearTransition;

export type AnimationPreset = 'spring' | 'list' | 'smooth';

/**
 * Applies one of the shared layout presets to a Reanimated layout builder.
 *
 * @example layout={layoutAnimation(LinearTransition, 'list')}
 */
export function layoutAnimation(builder: LayoutBuilder, preset: AnimationPreset = 'spring') {
  switch (preset) {
    case 'list':
      return builder.duration(duration.normal).easing(Easing.out(Easing.exp));
    case 'smooth':
      return builder.springify().damping(24).stiffness(220).mass(0.9);
    default:
      return builder.springify().damping(20).stiffness(300).mass(1);
  }
}

/** Stagger helper so lists appear one row after another. */
export function staggerDelay(index: number, step = 45, max = 360): number {
  return Math.min(index * step, max);
}
