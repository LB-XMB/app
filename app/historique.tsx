import { useRouter } from 'expo-router';
import { DownloadCloud, RotateCcw, Trash2 } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderAction, ScreenHeader } from '@/components/layout/ScreenHeader';
import { ResourceIcon } from '@/components/resources/ResourceIcon';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { formatBytes } from '@/services/download';
import { pumpDownloadQueue, retryDownloadJob } from '@/services/downloadQueue';
import { useDownloadQueueStore } from '@/stores/downloadQueue';
import { useHistoryStore } from '@/stores/history';
import {
  AnimatedPressable,
  EmptyState,
  ListSectionTitle,
  Screen,
  Typography,
} from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/historique');

  const downloads = useHistoryStore((state) => state.downloads);
  const removeDownload = useHistoryStore((state) => state.removeDownload);
  const clearDownloads = useHistoryStore((state) => state.clearDownloads);
  const jobs = useDownloadQueueStore((state) => state.jobs);
  const clearFinished = useDownloadQueueStore((state) => state.clearFinished);

  useEffect(() => {
    void pumpDownloadQueue();
  }, []);

  const activeJobs = jobs.filter(
    (job) => job.status === 'pending' || job.status === 'running' || job.status === 'error'
  );

  /** Downloads are grouped by day, newest first. */
  const groups = downloads.reduce<Map<string, typeof downloads>>((accumulator, entry) => {
    const label = formatDay(entry.downloadedAt);
    const bucket = accumulator.get(label);
    if (bucket) bucket.push(entry);
    else accumulator.set(label, [entry]);
    return accumulator;
  }, new Map());

  return (
    <Screen>
      <ScreenHeader
        title="Téléchargements"
        subtitle={`${downloads.length} fichier${downloads.length > 1 ? 's' : ''}`}
        actions={
          downloads.length > 0 ? (
            <HeaderAction
              label="Vider l’historique"
              onPress={clearDownloads}
              accent={colors.danger}
            >
              <Trash2 size={16} color={colors.danger} strokeWidth={2.4} />
            </HeaderAction>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeJobs.length > 0 ? (
          <View style={styles.group}>
            <ListSectionTitle>File d’attente</ListSectionTitle>
            <View style={styles.rows}>
              {activeJobs.map((job) => (
                <View
                  key={job.id}
                  style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <ResourceIcon
                    logo={job.resource.logo}
                    platform={job.resource.platform}
                    size={42}
                  />
                  <View style={styles.rowBody}>
                    <Typography variant="title" numberOfLines={1}>
                      {job.file.fileName}
                    </Typography>
                    <Typography variant="caption" color="secondary" numberOfLines={1}>
                      {job.status === 'running'
                        ? job.progress === null
                          ? 'Téléchargement…'
                          : `${Math.round(job.progress * 100)} %`
                        : job.status === 'pending'
                          ? 'En attente'
                          : job.error ?? 'Erreur'}
                    </Typography>
                    {job.status === 'running' && job.progress !== null ? (
                      <View style={[styles.progressTrack, { backgroundColor: colors.glass }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: colors.primary,
                              width: `${job.progress * 100}%`,
                            },
                          ]}
                        />
                      </View>
                    ) : null}
                  </View>
                  {job.status === 'running' ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : job.status === 'error' ? (
                    <AnimatedPressable
                      onPress={() => retryDownloadJob(job.id)}
                      scale={0.88}
                      style={styles.rowAction}
                      accessibilityLabel="Réessayer"
                    >
                      <RotateCcw size={16} color={colors.primary} strokeWidth={2.3} />
                    </AnimatedPressable>
                  ) : null}
                </View>
              ))}
            </View>
            <AnimatedPressable onPress={clearFinished} scale={0.98}>
              <Typography variant="caption" color="tertiary">
                Nettoyer les terminés de la file
              </Typography>
            </AnimatedPressable>
          </View>
        ) : null}

        {downloads.length === 0 && activeJobs.length === 0 ? (
          <EmptyState
            icon={DownloadCloud}
            title="Aucun téléchargement"
            description="Les fichiers que tu récupères depuis l’app apparaîtront ici."
            actionLabel="Parcourir le catalogue"
            onAction={() => router.push('/catalogue')}
          />
        ) : (
          [...groups.entries()].map(([day, entries]) => (
            <View key={day} style={styles.group}>
              <ListSectionTitle>{day}</ListSectionTitle>
              <View style={styles.rows}>
                {entries.map((entry) => (
                  <View
                    key={entry.key}
                    style={[
                      styles.row,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <ResourceIcon
                      logo={entry.logo}
                      platform={entry.platform}
                      size={42}
                    />
                    <AnimatedPressable
                      onPress={() => router.push(`/ressource/${entry.resourceId}`)}
                      scale={0.99}
                      style={styles.rowBody}
                      accessibilityRole="button"
                      accessibilityLabel={entry.resourceTitle}
                    >
                      <Typography variant="title" numberOfLines={1}>
                        {entry.resourceTitle}
                      </Typography>
                      <Typography variant="caption" color="secondary" numberOfLines={1}>
                        {entry.fileName}
                      </Typography>
                      <Typography variant="mono" color="tertiary">
                        {[
                          formatTime(entry.downloadedAt),
                          entry.version ? `v${entry.version}` : null,
                          entry.size ? formatBytes(entry.size) : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                    </AnimatedPressable>
                    <AnimatedPressable
                      onPress={() => removeDownload(entry.key)}
                      scale={0.88}
                      haptic={false}
                      style={styles.rowAction}
                      accessibilityRole="button"
                      accessibilityLabel={`Retirer ${entry.fileName}`}
                    >
                      <Trash2 size={15} color={colors.textTertiary} strokeWidth={2.2} />
                    </AnimatedPressable>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Récemment';

  const today = new Date();
  const isSameDay = date.toDateString() === today.toDateString();
  if (isSameDay) return "Aujourd'hui";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';

  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  group: {
    gap: spacing.md,
  },
  rows: {
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
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowAction: {
    padding: spacing.sm,
  },
  progressTrack: {
    height: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
