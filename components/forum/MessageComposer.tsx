import { Send } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AnimatedPressable, Typography } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

export interface MessageComposerProps {
  placeholder?: string;
  submitting?: boolean;
  disabled?: boolean;
  onSubmit: (content: string) => void | Promise<void>;
  style?: StyleProp<ViewStyle>;
}

/** Compact text field used to reply under a thread. */
export function MessageComposer({
  placeholder = 'Écrire une réponse…',
  submitting = false,
  disabled = false,
  onSubmit,
  style,
}: MessageComposerProps) {
  const colors = useColors();
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0 && !submitting && !disabled;

  const send = async () => {
    const content = value.trim();
    if (!content || submitting || disabled) return;
    await onSubmit(content);
    setValue('');
  };

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline
        editable={!disabled && !submitting}
        style={[styles.input, { color: colors.text }]}
        textAlignVertical="top"
      />
      <AnimatedPressable
        onPress={() => void send()}
        disabled={!canSend}
        scale={0.92}
        accessibilityRole="button"
        accessibilityLabel="Envoyer"
        style={[
          styles.send,
          {
            backgroundColor: canSend ? colors.primary : colors.item,
            opacity: canSend ? 1 : 0.55,
          },
        ]}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
          <Send size={16} color={canSend ? colors.onPrimary : colors.textTertiary} strokeWidth={2.4} />
        )}
      </AnimatedPressable>
    </View>
  );
}

/** Larger composer used when opening a new thread. */
export function ThreadBodyField({
  value,
  onChangeText,
  placeholder = 'Développe ton message…',
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  const colors = useColors();

  return (
    <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline
        style={[styles.fieldInput, { color: colors.text }]}
        textAlignVertical="top"
      />
      <Typography variant="caption" color="tertiary">
        Markdown Discord supporté
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius['2xl'],
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    lineHeight: 21,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    minHeight: 180,
  },
  fieldInput: {
    flex: 1,
    minHeight: 140,
    fontSize: 15,
    lineHeight: 22,
  },
});
