import { CloudOff, SearchX, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Reanimated, { FadeIn } from 'react-native-reanimated';

import { ApiError } from '@/services/api';

import { useColors } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { Button } from './Button';
import { Typography } from './Typography';

interface StateViewProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Tints the icon badge; defaults to the secondary text colour. */
  tint?: string;
}

function StateView({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tint,
}: StateViewProps) {
  const colors = useColors();
  const color = tint ?? colors.textSecondary;

  return (
    <Reanimated.View entering={FadeIn.duration(260)} style={styles.container}>
      <View style={[styles.badge, { backgroundColor: `${color}1F` }]}>
        <Icon size={26} color={color} strokeWidth={2} />
      </View>
      <Typography variant="h3" align="center">
        {title}
      </Typography>
      {description ? (
        <Typography variant="caption" color="secondary" align="center">
          {description}
        </Typography>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="small"
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </Reanimated.View>
  );
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = SearchX, ...rest }: EmptyStateProps) {
  return <StateView icon={icon} {...rest} />;
}

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

/** Turns any thrown value into a readable message plus a retry action. */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const colors = useColors();
  const message =
    error instanceof ApiError
      ? error.userMessage
      : error instanceof Error
        ? error.message
        : 'Une erreur inattendue est survenue.';

  return (
    <StateView
      icon={CloudOff}
      tint={colors.danger}
      title="Ça n’a pas marché"
      description={message}
      actionLabel={onRetry ? 'Réessayer' : undefined}
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  action: {
    marginTop: spacing.sm,
  },
});
