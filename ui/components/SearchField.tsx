import { Search, X } from 'lucide-react-native';
import { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInput as TextInputType,
  type ViewStyle,
} from 'react-native';

import { fonts } from '../theme/fonts';
import { useColors } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { AnimatedPressable } from './AnimatedPressable';

export interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SearchField = forwardRef<TextInputType, SearchFieldProps>(
  function SearchField(
    { value, onChangeText, placeholder = 'Rechercher…', autoFocus, onSubmit, style },
    ref
  ) {
    const colors = useColors();

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.item, borderColor: colors.border },
          style,
        ]}
      >
        <Search size={18} color={colors.textSecondary} strokeWidth={2.4} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          selectionColor={colors.primary}
          style={[styles.input, { color: colors.text }]}
        />
        {value.length > 0 ? (
          <AnimatedPressable
            onPress={() => onChangeText('')}
            scale={0.88}
            haptic={false}
            style={[styles.clear, { backgroundColor: colors.glass }]}
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
          >
            <X size={13} color={colors.textSecondary} strokeWidth={3} />
          </AnimatedPressable>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  input: {
    flex: 1,
    fontFamily: fonts.text.medium,
    fontSize: 15,
    padding: 0,
  },
  clear: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
