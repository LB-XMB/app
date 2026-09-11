import { CheckCircle2, ChevronDown, Download, ExternalLink, FileDown } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Reanimated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import type { DownloadFile, DownloadGroup, ResourceDetail } from '@/services/api';
import { downloadResourceFile, formatBytes } from '@/services/download';
import { AnimatedPressable, Sheet, Typography } from '@/ui/components';
import { layoutAnimation } from '@/ui/animation';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

export interface DownloadSheetProps {
  visible: boolean;
  onClose: () => void;
  resource: ResourceDetail;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'running'; key: string; ratio: number | null }
  | { kind: 'done'; key: string }
  | { kind: 'error'; key: string; message: string };

/** Lets the user pick a file when a resource ships several variants. */
export function DownloadSheet({ visible, onClose, resource }: DownloadSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Télécharger"
      subtitle={`${resource.fileCount} fichier${resource.fileCount > 1 ? 's' : ''} disponible${resource.fileCount > 1 ? 's' : ''}`}
    >
      {/* Remounting on open resets the progress and expanded groups. */}
      {visible ? <DownloadList resource={resource} /> : null}
    </Sheet>
  );
}

function DownloadList({ resource }: { resource: ResourceDetail }) {
  const colors = useColors();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    // A lone group is open from the start; several groups stay collapsed.
    resource.downloadGroups.length === 1
      ? new Set(resource.downloadGroups.map((group) => group.key))
      : new Set<string>()
  );

  const start = async (file: DownloadFile) => {
    setStatus({ kind: 'running', key: file.key, ratio: null });
    const outcome = await downloadResourceFile({
      resource,
      file,
      onProgress: ({ ratio }) => setStatus({ kind: 'running', key: file.key, ratio }),
    });

    if (outcome.status === 'error') {
      setStatus({ kind: 'error', key: file.key, message: outcome.message });
      return;
    }
    if (outcome.status === 'cancelled') {
      setStatus({ kind: 'idle' });
      return;
    }
    setStatus({ kind: 'done', key: file.key });
  };

  const toggleGroup = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const renderFile = (file: DownloadFile) => {
    const isRunning = status.kind === 'running' && status.key === file.key;
    const isDone = status.kind === 'done' && status.key === file.key;
    const isFailed = status.kind === 'error' && status.key === file.key;
    const isExternal = file.externalUrl !== null;

    const meta = [
      file.version ? `v${file.version}` : null,
      file.sizeBytes ? formatBytes(file.sizeBytes) : null,
      isExternal ? 'Lien externe' : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <AnimatedPressable
        key={file.key}
        onPress={isRunning ? undefined : () => void start(file)}
        disabled={isRunning}
        scale={0.985}
        style={[styles.file, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel={`Télécharger ${file.label}`}
      >
        <View
          style={[
            styles.fileIcon,
            {
              backgroundColor: isDone
                ? `${colors.success}1F`
                : isFailed
                  ? `${colors.danger}1F`
                  : `${colors.primary}1F`,
            },
          ]}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isDone ? (
            <CheckCircle2 size={18} color={colors.success} strokeWidth={2.4} />
          ) : isExternal ? (
            <ExternalLink size={17} color={colors.primary} strokeWidth={2.4} />
          ) : (
            <FileDown size={17} color={isFailed ? colors.danger : colors.primary} strokeWidth={2.4} />
          )}
        </View>

        <View style={styles.fileBody}>
          <Typography variant="title" numberOfLines={1}>
            {file.label}
          </Typography>
          {isRunning ? (
            <Typography variant="caption" color="secondary">
              {status.ratio === null
                ? 'Téléchargement…'
                : `${Math.round(status.ratio * 100)} %`}
            </Typography>
          ) : isFailed ? (
            <Typography variant="caption" color="danger" numberOfLines={2}>
              {status.message}
            </Typography>
          ) : isDone ? (
            <Typography variant="caption" color="success">
              Terminé
            </Typography>
          ) : meta ? (
            <Typography variant="caption" color="secondary" numberOfLines={1}>
              {meta}
            </Typography>
          ) : null}

          {isRunning && status.ratio !== null ? (
            <View style={[styles.progressTrack, { backgroundColor: colors.glass }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${status.ratio * 100}%` },
                ]}
              />
            </View>
          ) : null}
        </View>
      </AnimatedPressable>
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
          Le fichier est enregistré dans l’app, puis le menu de partage s’ouvre pour le
          ranger où tu veux.
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
