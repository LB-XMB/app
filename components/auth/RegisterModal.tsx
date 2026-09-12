import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { AuthError, registerWithPassword, type AuthSuccess } from '@/services/api/auth';
import { ApiError } from '@/services/api/client';
import { Button, Sheet, Typography } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

export interface RegisterModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: AuthSuccess) => void;
  onUseSite: () => void;
}

export function RegisterModal({ visible, onClose, onSuccess, onUseSite }: RegisterModalProps) {
  const colors = useColors();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setUsername('');
    setPassword('');
    setConfirm('');
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
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onSuccess(await registerWithPassword({ username, password }));
      reset();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof AuthError
          ? cause.userMessage
          : cause instanceof ApiError
            ? cause.userMessage
            : 'Création de compte impossible.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title="Créer un compte"
      subtitle="Pseudo et mot de passe (min. 8 caractères)"
      maxHeightRatio={0.8}
    >
      <View style={styles.form}>
        <Field
          label="Pseudo"
          value={username}
          onChangeText={setUsername}
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
          textContentType="newPassword"
          editable={!busy}
        />
        <Field
          label="Confirmer le mot de passe"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          textContentType="newPassword"
          editable={!busy}
        />

        {error ? (
          <Typography variant="caption" color="danger">
            {error}
          </Typography>
        ) : null}

        <Button
          label={busy ? 'Création…' : 'Créer mon compte'}
          onPress={() => void submit()}
          loading={busy}
          disabled={busy || !username.trim() || password.length < 8 || !confirm}
          size="large"
        />

        <Button
          label="S’inscrire sur le site"
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
