import { StyleSheet, View } from 'react-native';

import { useColors } from '../theme/ThemeProvider';

export function Divider({ inset = 0 }: { inset?: number }) {
  const colors = useColors();
  return (
    <View
      style={[styles.divider, { backgroundColor: colors.separator, marginHorizontal: inset }]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    width: '100%',
  },
});
