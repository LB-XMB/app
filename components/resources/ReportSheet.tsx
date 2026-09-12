import { Flag } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ApiError } from '@/services/api';
import { REPORT_REASONS, submitReport, type ReportType } from '@/services/api/reports';
import { useIsSignedIn, useSessionStore } from '@/stores/session';
import { AnimatedPressable, Sheet, Typography } from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

const SUPPORT_MAIL =
  'mailto:support@lbxmb.fr?subject=Signalement%20LBXMB&body=Type%3A%20';

export interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  type: ReportType;
  targetId: string;
  label: string;
}

export function ReportSheet({ visible, onClose, type, targetId, label }: ReportSheetProps) {
  const colors = useColors();
  const router = useRouter();
  const signedIn = useIsSignedIn();
  const token = useSessionStore((state) => state.token);
  const [busy, setBusy] = useState(false);

  const send = async (reasonLabel: string) => {
    if (!signedIn || !token) {
      Alert.alert(
        'Connexion requise',
        'Connecte-toi pour envoyer un signalement, ou écris à support@lbxmb.fr.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se connecter',
            onPress: () => {
              onClose();
              router.push('/compte');
            },
          },
          {
            text: 'E-mail',
            onPress: () => {
              void Linking.openURL(`${SUPPORT_MAIL}${encodeURIComponent(type)}%0AId%3A%20${encodeURIComponent(targetId)}%0A${encodeURIComponent(label)}`);
              onClose();
            },
          },
        ]
      );
      return;
    }

    setBusy(true);
    try {
      await submitReport({
        token,
        type,
        id: targetId,
        reason: reasonLabel,
        label,
      });
      Alert.alert('Merci', 'Ton signalement a bien été envoyé à l’équipe.');
      onClose();
    } catch (error) {
      Alert.alert(
        'Envoi impossible',
        error instanceof ApiError ? error.userMessage : 'Réessaie dans un instant.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Signaler" subtitle={label} maxHeightRatio={0.65}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Typography variant="caption" color="secondary">
          Choisis un motif. Pas de modération dans l’app — l’équipe traite côté site.
        </Typography>
        {REPORT_REASONS.map((reason) => (
          <AnimatedPressable
            key={reason.id}
            disabled={busy}
            onPress={() => void send(reason.label)}
            scale={0.985}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Flag size={16} color={colors.danger} strokeWidth={2.3} />
            <Typography variant="title" style={styles.flex}>
              {reason.label}
            </Typography>
          </AnimatedPressable>
        ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  flex: {
    flex: 1,
  },
});
