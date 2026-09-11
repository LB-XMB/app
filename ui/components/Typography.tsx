import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { fonts } from '../theme/fonts';
import { useColors } from '../theme/ThemeProvider';

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'captionStrong'
  | 'label'
  | 'button'
  | 'mono';

export type TypographyColor =
  | 'primary'
  | 'text'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'danger'
  | 'success'
  | 'onPrimary'
  | (string & {});

/** Syne carries the brand voice, Inter keeps long-form text readable. */
const variants: Record<TypographyVariant, TextStyle> = {
  display: { fontFamily: fonts.display.extrabold, fontSize: 32, lineHeight: 38 },
  h1: { fontFamily: fonts.display.bold, fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: fonts.display.bold, fontSize: 21, lineHeight: 27 },
  h3: { fontFamily: fonts.display.semibold, fontSize: 17, lineHeight: 23 },
  title: { fontFamily: fonts.display.semibold, fontSize: 15.5, lineHeight: 21 },
  body: { fontFamily: fonts.text.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.text.semibold, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.text.regular, fontSize: 13, lineHeight: 18 },
  captionStrong: { fontFamily: fonts.text.semibold, fontSize: 13, lineHeight: 18 },
  label: {
    fontFamily: fonts.display.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  button: { fontFamily: fonts.display.bold, fontSize: 16, lineHeight: 21 },
  mono: { fontFamily: fonts.text.medium, fontSize: 12, lineHeight: 17 },
};

const styles = StyleSheet.create(variants);

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  align?: TextStyle['textAlign'];
}

export function Typography({
  variant = 'body',
  color = 'text',
  align,
  style,
  ...rest
}: TypographyProps) {
  const colors = useColors();

  const resolved =
    color === 'text'
      ? colors.text
      : color === 'secondary'
        ? colors.textSecondary
        : color === 'tertiary'
          ? colors.textTertiary
          : color === 'primary'
            ? colors.primary
            : color === 'accent'
              ? colors.accent
              : color === 'danger'
                ? colors.danger
                : color === 'success'
                  ? colors.success
                  : color === 'onPrimary'
                    ? colors.onPrimary
                    : color;

  return (
    <Text
      {...rest}
      style={[styles[variant], { color: resolved }, align ? { textAlign: align } : null, style]}
    />
  );
}
