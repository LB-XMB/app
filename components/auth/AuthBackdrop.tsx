import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, Line, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Background of the sign-in page, ported from the website.
 *
 * Mirrors the layer stack of `web/src/app/login/page.tsx`: a near-black base,
 * a blue halo in the top right, a green one in the bottom left and a faint
 * grid. The CSS relies on `blur-[120px]`, which React Native cannot apply to a
 * view, so each halo is drawn as a radial gradient instead.
 */

const BASE = '#030303';
/** Tailwind `blue-600` and `emerald-600`, as used by the page. */
const BLUE = '#2563EB';
const EMERALD = '#059669';
/** Tile size of `web/public/grid.svg`. */
const GRID_SIZE = 100;

export function AuthBackdrop() {
  const { width, height } = useWindowDimensions();

  // The halos are 600 and 500 pixels wide on the website, offset by 10% of the
  // viewport. The blur spreads them further, hence the larger radius here.
  const blue = {
    cx: width * 1.1 - 300,
    cy: height * -0.1 + 300,
    r: 420,
  };
  const emerald = {
    cx: width * -0.1 + 250,
    cy: height * 1.1 - 250,
    r: 370,
  };

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <RadialGradient id="blueHalo" cx={blue.cx} cy={blue.cy} r={blue.r} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={BLUE} stopOpacity={0.22} />
          <Stop offset="0.55" stopColor={BLUE} stopOpacity={0.08} />
          <Stop offset="1" stopColor={BLUE} stopOpacity={0} />
        </RadialGradient>

        <RadialGradient
          id="emeraldHalo"
          cx={emerald.cx}
          cy={emerald.cy}
          r={emerald.r}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={EMERALD} stopOpacity={0.14} />
          <Stop offset="0.55" stopColor={EMERALD} stopOpacity={0.05} />
          <Stop offset="1" stopColor={EMERALD} stopOpacity={0} />
        </RadialGradient>

        <Pattern
          id="grid"
          width={GRID_SIZE}
          height={GRID_SIZE}
          patternUnits="userSpaceOnUse"
        >
          <Line x1="0" y1="0" x2="0" y2={GRID_SIZE} stroke="#FFFFFF" strokeWidth="1" />
          <Line x1="0" y1="0" x2={GRID_SIZE} y2="0" stroke="#FFFFFF" strokeWidth="1" />
        </Pattern>
      </Defs>

      <Rect width={width} height={height} fill={BASE} />
      <Rect width={width} height={height} fill="url(#grid)" opacity={0.05} />
      <Rect width={width} height={height} fill="url(#blueHalo)" />
      <Rect width={width} height={height} fill="url(#emeraldHalo)" />
    </Svg>
  );
}
