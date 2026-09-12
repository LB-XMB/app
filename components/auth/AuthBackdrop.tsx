import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Fond de la page de connexion — même atmosphère que Gradient Waves du site
 * (`#38bdf8` / `ambientLightRaysBackgroundStyle`), sans WebGL.
 */

const BASE = '#020202';
/** Couleur page d’accueil du site (`PageLightRaysBackdrop raysColor`). */
const WAVE = '#38bdf8';

export function AuthBackdrop() {
  const { width, height } = useWindowDimensions();

  // Ellipses alignées sur le CSS ambiant du site :
  // top 50%/-16%, sideR 86%/14%, sideL 14%/24%.
  const top = { cx: width * 0.5, cy: height * -0.08, rx: width * 0.72, ry: height * 0.42 };
  const sideR = { cx: width * 0.9, cy: height * 0.16, rx: width * 0.38, ry: height * 0.28 };
  const sideL = { cx: width * 0.08, cy: height * 0.28, rx: width * 0.34, ry: height * 0.26 };
  const crest = { cx: width * 0.48, cy: height * 0.12, rx: width * 0.28, ry: height * 0.12 };

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <RadialGradient id="waveTop" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={WAVE} stopOpacity={0.38} />
          <Stop offset="0.55" stopColor={WAVE} stopOpacity={0.12} />
          <Stop offset="1" stopColor={WAVE} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="waveRight" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={WAVE} stopOpacity={0.2} />
          <Stop offset="1" stopColor={WAVE} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="waveLeft" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={WAVE} stopOpacity={0.16} />
          <Stop offset="1" stopColor={WAVE} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="waveCrest" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.14} />
          <Stop offset="1" stopColor={WAVE} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Rect width={width} height={height} fill={BASE} />
      <Ellipse cx={top.cx} cy={top.cy} rx={top.rx} ry={top.ry} fill="url(#waveTop)" />
      <Ellipse cx={sideR.cx} cy={sideR.cy} rx={sideR.rx} ry={sideR.ry} fill="url(#waveRight)" />
      <Ellipse cx={sideL.cx} cy={sideL.cy} rx={sideL.rx} ry={sideL.ry} fill="url(#waveLeft)" />
      <Ellipse cx={crest.cx} cy={crest.cy} rx={crest.rx} ry={crest.ry} fill="url(#waveCrest)" />
    </Svg>
  );
}
