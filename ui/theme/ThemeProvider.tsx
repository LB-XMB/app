import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';

import { useSettingsStore, type ThemePreference } from '@/stores/settings';

import { palettes, type ColorScheme, type Palette } from './palette';
import { radius, spacing } from './tokens';

export interface Theme {
  scheme: ColorScheme;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
}

const ThemeContext = createContext<Theme>({
  scheme: 'dark',
  colors: palettes.dark,
  spacing,
  radius,
});

function resolveScheme(
  preference: ThemePreference,
  system: ColorSchemeName
): ColorScheme {
  if (preference === 'light' || preference === 'dark') return preference;
  // The website is dark-first, so an unknown system scheme falls back to dark.
  return system === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSettingsStore((state) => state.theme);
  const systemScheme = useColorScheme();

  const theme = useMemo<Theme>(() => {
    const scheme = resolveScheme(preference, systemScheme);
    return { scheme, colors: palettes[scheme], spacing, radius };
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** Shorthand for the very common `useTheme().colors`. */
export function useColors(): Palette {
  return useContext(ThemeContext).colors;
}
