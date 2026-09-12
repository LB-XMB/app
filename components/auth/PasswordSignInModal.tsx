import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { AuthError, signInWithPassword, type AuthSuccess } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';
import { Button, Sheet, Typography } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

export interface PasswordSignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: AuthSuccess) => void;
  onUseSite: () => void;
}

export function PasswordSignInModal({
  visible,
  onClose,
  onSuccess,
  onUseSite,
}: PasswordSignInModalProps) {
  const colors = useColors();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setIdentifier('');
    setPassword('');
    setError(null);
    setBusy(false);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      onSuccess(await signInWithPassword({ identifier, password }));
      reset();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof AuthError
          ? cause.userMessage
          : cause instanceof ApiError
            ? cause.userMessage
            : 'Connexion impossible.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title="Compte LB’XMB"
      subtitle="Pseudo ou e-mail et mot de passe"
      maxHeightRatio={0.72}
    >
      <View style={styles.form}>
        <Field
          label="Pseudo ou e-mail"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          editable={!busy}
        />
        <Field
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          editable={!busy}
        />

        {error ? (
          <Typography variant="caption" color="danger">
            {error}
          </Typography>
        ) : null}

        <Button
          label={busy ? 'Connexion…' : 'Se connecter'}
          onPress={() => void submit()}
          loading={busy}
          disabled={busy || !identifier.trim() || !password}
          size="large"
        />

        <Button
          label="Continuer sur le site"
          variant="ghost"
          onPress={() => {
            if (busy) return;
            reset();
            onClose();
            onUseSite();
          }}
          disabled={busy}
        />

        {busy ? <ActivityIndicator color={colors.primary} /> : null}
      </View>
    </Sheet>
  );
}

function Field({
  label,
  ...input
}: { label: string } & ComponentProps<typeof TextInput>) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Typography variant="label" color="tertiary">
        {label}
      </Typography>
      <TextInput
        {...input}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
});
