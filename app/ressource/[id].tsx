import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Code2,
  Download,
  ExternalLink,
  Heart,
  History,
  Info,
  Tag,
  Users,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderAction, ScreenHeader } from '@/components/layout/ScreenHeader';
import { DownloadSheet } from '@/components/resources/DownloadSheet';
import { MediaGallery } from '@/components/resources/MediaGallery';
import { buildMediaItems } from '@/components/resources/mediaItems';
import { ResourceIcon } from '@/components/resources/ResourceIcon';
import { useResource } from '@/hooks/useResources';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { WEB_URLS } from '@/services/api';
import { downloadResourceFile } from '@/services/download';
import { trackEvent } from '@/services/analytics';
import { useFavoritesStore, useIsFavorite } from '@/stores/favorites';
import {
  Button,
  Chip,
  ErrorState,
  ListSectionTitle,
  Screen,
  Skeleton,
  Typography,
} from '@/ui/components';
import { platformColor, radius, screenPadding, spacing, useColors } from '@/ui/theme';

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  useScreenTracking('/ressource');

  const { data: resource, isLoading, isError, error, refetch } = useResource(id);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isFavorite = useIsFavorite(resource?.id);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);

  const tint = platformColor(resource?.platform);

  const mediaItems = useMemo(
    () =>
      resource
        ? buildMediaItems({
            media: resource.media,
            youtubeUrl: resource.youtubeUrl,
            cacheKey: resource.logoVersion,
          })
        : [],
    [resource]
  );

  const onDownload = async () => {
    if (!resource) return;
    trackEvent('download-open', { resource: resource.title }, '/ressource');

    const groups = resource.downloadGroups;
    const onlyFile =
      groups.length === 1 && groups[0]?.files.length === 1 && groups[0].groups.length === 0
        ? groups[0].files[0]
        : undefined;

    // A single file needs no picker.
    if (onlyFile) {
      setDownloading(true);
      await downloadResourceFile({ resource, file: onlyFile });
      setDownloading(false);
      return;
    }

    setSheetVisible(true);
  };

  if (isLoading) {
    return (
      <Screen>
        <ScreenHeader />
        <View style={styles.loading}>
          <Skeleton width={92} height={92} radius={radius.xl} />
          <Skeleton width="70%" height={24} />
          <Skeleton width="45%" height={14} />
          <Skeleton width="100%" height={54} radius={radius.pill} />
          <Skeleton width="100%" height={90} radius={radius.lg} />
        </View>
      </Screen>
    );
  }

  if (isError || !resource) {
    return (
      <Screen>
        <ScreenHeader title="Ressource" />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const meta = [
    resource.category,
    resource.subcategory !== resource.category ? resource.subcategory : null,
  ].filter(Boolean);

  return (
    <Screen glowColor={tint}>
      <ScreenHeader
        title={resource.title}
        subtitle={resource.platform ?? undefined}
        actions={
          <>
            <HeaderAction
              label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              accent={isFavorite ? colors.danger : undefined}
              onPress={() => {
                const added = toggleFavorite({
                  id: resource.id,
                  title: resource.title,
                  platform: resource.platform,
                  category: resource.category,
                  logo: resource.logo,
                  logoVersion: resource.logoVersion,
                });
                trackEvent('favorite-toggle', { added }, '/ressource');
              }}
            >
              <Heart
                size={17}
                color={isFavorite ? colors.danger : colors.text}
                fill={isFavorite ? colors.danger : 'transparent'}
                strokeWidth={2.4}
              />
            </HeaderAction>
            <HeaderAction
              label="Ouvrir sur lbxmb.fr"
              onPress={() => void WebBrowser.openBrowserAsync(WEB_URLS.resource(resource.id))}
            >
              <ExternalLink size={16} color={colors.text} strokeWidth={2.4} />
            </HeaderAction>
          </>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Reanimated.View entering={FadeInDown.duration(400)} style={styles.hero}>
          <ResourceIcon
            logo={resource.logo}
            logoVersion={resource.logoVersion}
            platform={resource.platform}
            size={92}
            radius={radius.xl}
          />
          <View style={styles.heroText}>
            <Typography variant="h1" numberOfLines={3}>
              {resource.title}
            </Typography>
            {resource.author ? (
              <Typography variant="caption" color="secondary">
                par {resource.author}
              </Typography>
            ) : null}
            <View style={styles.heroChips}>
              {resource.version ? (
                <Chip label={`v${resource.version}`} color={tint} selected size="small" />
              ) : null}
              {resource.platform ? (
                <Chip label={resource.platform} color={tint} size="small" />
              ) : null}
              {meta.map((item) => (
                <Chip key={item} label={item as string} size="small" />
              ))}
            </View>
          </View>
        </Reanimated.View>

        <View style={styles.section}>
          <Button
            label={
              resource.fileCount > 1
                ? `Télécharger (${resource.fileCount} fichiers)`
                : 'Télécharger'
            }
            onPress={() => void onDownload()}
            size="large"
            color={tint}
            loading={downloading}
            disabled={resource.fileCount === 0}
            leading={<Download size={19} color={colors.onPrimary} strokeWidth={2.6} />}
          />
          {resource.fileCount === 0 ? (
            <Typography variant="caption" color="tertiary" align="center">
              Aucun fichier publié pour le moment.
            </Typography>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <StatPill
            icon={Download}
            label="Téléchargés"
            value={formatCount(resource.downloads)}
          />
          <StatPill
            icon={History}
            label="Mise à jour"
            value={formatDate(resource.updatedAt ?? resource.createdAt)}
          />
          {resource.contributors.length > 0 ? (
            <StatPill
              icon={Users}
              label="Contributeurs"
              value={String(resource.contributors.length)}
            />
          ) : null}
        </View>

        {resource.description ? (
          <View style={styles.section}>
            <ListSectionTitle>Description</ListSectionTitle>
            <Typography variant="body" color="secondary">
              {resource.description}
            </Typography>
          </View>
        ) : null}

        {mediaItems.length > 0 ? (
          <View style={styles.sectionNoPadding}>
            <View style={styles.section}>
              <ListSectionTitle>Aperçu</ListSectionTitle>
            </View>
            <MediaGallery items={mediaItems} />
          </View>
        ) : null}

        {resource.tags.length > 0 ? (
          <View style={styles.section}>
            <ListSectionTitle>Tags</ListSectionTitle>
            <View style={styles.chips}>
              {resource.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  leading={<Tag size={10} color={colors.textSecondary} strokeWidth={2.4} />}
                />
              ))}
            </View>
          </View>
        ) : null}

        {resource.requirements.length > 0 ? (
          <View style={styles.section}>
            <ListSectionTitle>Prérequis</ListSectionTitle>
            <View
              style={[
                styles.noteCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {resource.requirements.map((requirement) => (
                <View key={requirement} style={styles.bulletRow}>
                  <Info size={14} color={colors.warning} strokeWidth={2.4} />
                  <Typography variant="caption" color="secondary" style={styles.flex}>
                    {requirement}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {resource.changelog.length > 0 ? (
          <View style={styles.section}>
            <ListSectionTitle>Changelog</ListSectionTitle>
            <View style={styles.changelog}>
              {resource.changelog.slice(0, 4).map((entry) => (
                <View
                  key={`${entry.version}-${entry.date}`}
                  style={[
                    styles.noteCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.changelogHeader}>
                    <Chip label={`v${entry.version}`} color={tint} selected size="small" />
                    {entry.date ? (
                      <Typography variant="caption" color="tertiary">
                        {formatDate(entry.date)}
                      </Typography>
                    ) : null}
                  </View>
                  {entry.changes.slice(0, 8).map((change, index) => (
                    <Typography
                      key={`${change}-${index}`}
                      variant="caption"
                      color="secondary"
                    >
                      {cleanChangelogLine(change)}
                    </Typography>
                  ))}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {resource.sourceUrl || Object.keys(resource.socials).length > 0 ? (
          <View style={styles.section}>
            <ListSectionTitle>Liens</ListSectionTitle>
            <View style={styles.chips}>
              {resource.sourceUrl ? (
                <Chip
                  label="Code source"
                  onPress={() => void WebBrowser.openBrowserAsync(resource.sourceUrl!)}
                  leading={<Code2 size={12} color={colors.textSecondary} strokeWidth={2.4} />}
                />
              ) : null}
              {Object.entries(resource.socials).map(([name, url]) => (
                <Chip
                  key={name}
                  label={name}
                  onPress={() => void WebBrowser.openBrowserAsync(url)}
                  leading={
                    <ExternalLink size={11} color={colors.textSecondary} strokeWidth={2.4} />
                  }
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <DownloadSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        resource={resource}
      />
    </Screen>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Download;
  label: string;
  value: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Icon size={14} color={colors.textTertiary} strokeWidth={2.3} />
      <Typography variant="bodyStrong" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Typography>
      <Typography variant="caption" color="tertiary" numberOfLines={2}>
        {label}
      </Typography>
    </View>
  );
}

function formatCount(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  // Short form so the three stat pills never truncate on small screens.
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

/** Changelog lines come from Markdown-ish release notes. */
function cleanChangelogLine(line: string): string {
  const cleaned = line.replace(/^#+\s*/, '').replace(/^\*\s*/, '• ').trim();
  return cleaned.startsWith('•') ? cleaned : `• ${cleaned}`;
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  loading: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  hero: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: screenPadding,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: screenPadding,
    gap: spacing.md,
  },
  sectionNoPadding: {
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: screenPadding,
  },
  statPill: {
    flex: 1,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  noteCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  changelog: {
    gap: spacing.md,
  },
  changelogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 2,
  },
  flex: {
    flex: 1,
  },
});
