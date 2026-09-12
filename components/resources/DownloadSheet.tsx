import { CheckCircle2, ChevronDown, Download, ExternalLink, FileDown, HardDrive, RotateCcw } from 'lucide-react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import Reanimated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import type { DownloadFile, DownloadGroup, ResourceDetail } from '@/services/api';
import { formatBytes } from '@/services/download';
import { enqueueDownload, retryDownloadJob } from '@/services/downloadQueue';
import { enqueueFtpUpload } from '@/services/ftpUploadQueue';
import { useActiveFtpProfile } from '@/stores/ftp';
import { useDownloadQueueStore } from '@/stores/downloadQueue';
import { AnimatedPressable, Sheet, Typography } from '@/ui/components';
import { layoutAnimation } from '@/ui/animation';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

const DOWNLOAD_DIRECTORY = 'telechargements';

function sandboxUri(fileName: string): string | null {
  try {
    const file = new File(new Directory(Paths.document, DOWNLOAD_DIRECTORY), fileName);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}
export interface DownloadSheetProps {
  visible: boolean;
  onClose: () => void;
  resource: ResourceDetail;
}

/** Lets the user pick a file when a resource ships several variants. */
export function DownloadSheet({ visible, onClose, resource }: DownloadSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Télécharger"
      subtitle={`${resource.fileCount} fichier${resource.fileCount > 1 ? 's' : ''} disponible${resource.fileCount > 1 ? 's' : ''}`}
    >
      {visible ? <DownloadList resource={resource} /> : null}
    </Sheet>
  );
}

function DownloadList({ resource }: { resource: ResourceDetail }) {
  const colors = useColors();
  const activeFtp = useActiveFtpProfile();
  const jobs = useDownloadQueueStore((state) => state.jobs);
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    resource.downloadGroups.length === 1
      ? new Set(resource.downloadGroups.map((group) => group.key))
      : new Set<string>()
  );

  const jobFor = (fileKey: string) =>
    jobs.find(
      (job) =>
        job.resource.id === resource.id &&
        job.file.key === fileKey &&
        (job.status === 'pending' || job.status === 'running' || job.status === 'error')
    ) ??
    jobs.find(
      (job) =>
        job.resource.id === resource.id && job.file.key === fileKey && job.status === 'done'
    );

  const start = async (file: DownloadFile) => {
    await enqueueDownload(
      {
        id: resource.id,
        title: resource.title,
        platform: resource.platform,
        logo: resource.logo,
      },
      file
    );
  };

  const sendViaFtp = (file: DownloadFile, localUri: string | null) => {
    if (!activeFtp) {
      Alert.alert(
        'Profil FTP manquant',
        'Crée un profil console dans l’onglet FTP avant d’envoyer un fichier.'
      );
      return;
    }
    if (localUri) {
      const remote = activeFtp.lastPath.endsWith('/')
        ? `${activeFtp.lastPath}${file.fileName}`
        : `${activeFtp.lastPath}/${file.fileName}`;
      enqueueFtpUpload({
        profileId: activeFtp.id,
        fileName: file.fileName,
        localUri,
        remotePath: remote,
      });
      Alert.alert('Ajouté à la file FTP', `${file.fileName} → ${activeFtp.name}`);
      return;
    }
    void (async () => {
      await start(file);
      Alert.alert(
        'Téléchargement lancé',
        'Une fois le fichier prêt, réouvre cette feuille pour l’envoyer via FTP.'
      );
    })();
  };

  const toggleGroup = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const renderFile = (file: DownloadFile) => {
    const job = jobFor(file.key);
    const isRunning = job?.status === 'running';
    const isPending = job?.status === 'pending';
    const isDone = job?.status === 'done';
    const isFailed = job?.status === 'error';
    const isExternal = file.externalUrl !== null;
    const ratio = job?.progress ?? null;
    const localUri = job?.localUri ?? sandboxUri(file.fileName);

    const meta = [
      file.version ? `v${file.version}` : null,
      file.sizeBytes ? formatBytes(file.sizeBytes) : null,
      isExternal ? 'Lien externe' : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <View key={file.key} style={styles.fileBlock}>
        <AnimatedPressable
          onPress={() => {
            if (isRunning || isPending) return;
            if (isFailed && job) {
              retryDownloadJob(job.id);
              return;
            }
            void start(file);
          }}
          disabled={isRunning || isPending}
          scale={0.985}
          style={[styles.file, { backgroundColor: colors.card, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={`Télécharger ${file.label}`}
        >
          <View
            style={[
              styles.fileIcon,
              {
                backgroundColor: isDone || localUri
                  ? `${colors.success}1F`
                  : isFailed
                    ? `${colors.danger}1F`
                    : `${colors.primary}1F`,
              },
            ]}
          >
            {isRunning || isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : isDone || localUri ? (
              <CheckCircle2 size={18} color={colors.success} strokeWidth={2.4} />
            ) : isFailed ? (
              <RotateCcw size={17} color={colors.danger} strokeWidth={2.4} />
            ) : isExternal ? (
              <ExternalLink size={17} color={colors.primary} strokeWidth={2.4} />
            ) : (
              <FileDown size={17} color={colors.primary} strokeWidth={2.4} />
            )}
          </View>

          <View style={styles.fileBody}>
            <Typography variant="title" numberOfLines={1}>
              {file.label}
            </Typography>
            {isRunning ? (
              <Typography variant="caption" color="secondary">
                {ratio === null ? 'Téléchargement…' : `${Math.round(ratio * 100)} %`}
              </Typography>
            ) : isPending ? (
              <Typography variant="caption" color="secondary">
                En file d’attente…
              </Typography>
            ) : isFailed ? (
              <Typography variant="caption" color="danger" numberOfLines={2}>
                {job?.error ?? 'Échec — appuie pour réessayer'}
              </Typography>
            ) : isDone || localUri ? (
              <Typography variant="caption" color="success">
                {isDone ? 'Terminé' : 'Déjà sur l’appareil'}
              </Typography>
            ) : meta ? (
              <Typography variant="caption" color="secondary" numberOfLines={1}>
                {meta}
              </Typography>
            ) : null}

            {isRunning && ratio !== null ? (
              <View style={[styles.progressTrack, { backgroundColor: colors.glass }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${ratio * 100}%` },
                  ]}
                />
              </View>
            ) : null}
          </View>
        </AnimatedPressable>

        {!isExternal && !isRunning && !isPending ? (
          <AnimatedPressable
            onPress={() => sendViaFtp(file, localUri)}
            scale={0.985}
            style={[styles.ftpRow, { backgroundColor: colors.item, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel={`Envoyer ${file.label} via FTP`}
          >
            <HardDrive size={15} color={colors.primary} strokeWidth={2.3} />
            <Typography variant="caption" color="secondary" style={styles.flex}>
              {localUri ? 'Envoyer via FTP' : 'Télécharger puis envoyer via FTP'}
            </Typography>
          </AnimatedPressable>
        ) : null}
      </View>
    );
  };

  const renderGroup = (group: DownloadGroup, depth = 0) => {
    const isOpen = expanded.has(group.key);
    const count =
      group.files.length +
      group.groups.reduce((total, child) => total + child.files.length, 0);

    return (
      <View key={group.key} style={[styles.group, depth > 0 && styles.nestedGroup]}>
        <AnimatedPressable
          onPress={() => toggleGroup(group.key)}
          scale={0.99}
          haptic={false}
          style={styles.groupHeader}
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
        >
          <Typography variant="h3" style={styles.flex} numberOfLines={1}>
            {group.label}
          </Typography>
          <Typography variant="caption" color="tertiary">
            {count} fichier{count > 1 ? 's' : ''}
          </Typography>
          <ChevronDown
            size={17}
            color={colors.textTertiary}
            strokeWidth={2.4}
            style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
          />
        </AnimatedPressable>

        {isOpen ? (
          <Reanimated.View
            entering={FadeIn.duration(180)}
            layout={layoutAnimation(LinearTransition, 'list')}
            style={styles.groupBody}
          >
            {group.files.map(renderFile)}
            {group.groups.map((child) => renderGroup(child, depth + 1))}
          </Reanimated.View>
        ) : null}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {resource.downloadGroups.map((group) => renderGroup(group))}

      <View style={styles.note}>
        <Download size={13} color={colors.textTertiary} strokeWidth={2.2} />
        <Typography variant="caption" color="tertiary" style={styles.flex}>
          Les fichiers partent en file d’attente (un à la fois). Suivi dans Téléchargements.
        </Typography>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  group: {
    gap: spacing.sm,
  },
  nestedGroup: {
    paddingLeft: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  groupBody: {
    gap: spacing.sm,
  },
  fileBlock: {
    gap: spacing.xs,
  },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  fileIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBody: {
    flex: 1,
    gap: 3,
  },
  ftpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  flex: {
    flex: 1,
  },
});
