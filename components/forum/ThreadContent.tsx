import { Image } from 'expo-image';
import { CircleDot, Vote } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { buildMediaItems } from '@/components/resources/mediaItems';
import { MediaViewer } from '@/components/resources/MediaViewer';
import type { ForumPoll } from '@/services/api';
import { AnimatedPressable, Typography } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

import { ForumMarkdown } from './ForumMarkdown';

export interface ThreadContentProps {
  content: string;
  /** Relative uploads paths of the joined images. */
  attachments: string[];
  poll: ForumPoll | null;
  /** Colour of the running text. */
  color?: string;
}

/** Body of a thread or of a reply: markdown, images and poll. */
export function ThreadContent({ content, attachments, poll, color }: ThreadContentProps) {
  const colors = useColors();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const media = useMemo(() => buildMediaItems({ media: attachments }), [attachments]);
  const single = media.length === 1;

  return (
    <View style={styles.container}>
      {content.length > 0 ? <ForumMarkdown content={content} color={color} /> : null}

      {media.length > 0 ? (
        <View style={styles.media}>
          {media.map((item, index) => (
            <AnimatedPressable
              key={item.key}
              onPress={() => setViewerIndex(index)}
              scale={0.98}
              style={[
                styles.thumb,
                single ? styles.thumbSingle : styles.thumbGrid,
                { backgroundColor: colors.item, borderColor: colors.border },
              ]}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Pièce jointe ${index + 1}`}
            >
              <Image
                source={{ uri: item.kind === 'youtube' ? item.posterUri : item.uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={180}
                cachePolicy="memory-disk"
              />
            </AnimatedPressable>
          ))}
        </View>
      ) : null}

      {poll ? (
        <View style={[styles.poll, { backgroundColor: colors.item, borderColor: colors.border }]}>
          <View style={styles.pollHeader}>
            <Vote size={14} color={colors.primary} strokeWidth={2.4} />
            <Typography variant="captionStrong" color="primary">
              {poll.closed ? 'Sondage terminé' : 'Sondage'}
            </Typography>
          </View>
          {poll.options.map((option) => (
            <View key={option} style={styles.pollOption}>
              <CircleDot size={13} color={colors.textTertiary} strokeWidth={2.2} />
              <Typography variant="caption" color="secondary" style={styles.flex}>
                {option}
              </Typography>
            </View>
          ))}
          <Typography variant="caption" color="tertiary">
            {poll.multiple
              ? 'Plusieurs réponses possibles, sur lbxmb.fr.'
              : 'Le vote se fait sur lbxmb.fr.'}
          </Typography>
        </View>
      ) : null}

      <MediaViewer items={media} index={viewerIndex} onClose={() => setViewerIndex(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  media: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumb: {
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  thumbSingle: {
    width: '100%',
    height: 200,
  },
  thumbGrid: {
    flexBasis: '47%',
    flexGrow: 1,
    height: 120,
  },
  poll: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
