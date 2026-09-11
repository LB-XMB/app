import { Eye, Lock, MessageCircle, Pin, ThumbsUp } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import { forumExcerpt, type ForumThread } from '@/services/api';
import { AnimatedPressable, Chip, Typography } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

import { ForumAvatar } from './ForumAvatar';
import { ForumDate } from './ForumDate';

export interface ThreadRowProps {
  thread: ForumThread;
  onPress: () => void;
  delay?: number;
}

/** Row of the forum thread list. */
export function ThreadRow({ thread, onPress, delay = 0 }: ThreadRowProps) {
  const colors = useColors();
  const tint = thread.category.color ?? colors.primary;
  const excerpt = forumExcerpt(thread.content, 140);

  return (
    <Reanimated.View entering={FadeInDown.duration(360).delay(delay).springify().damping(18)}>
      <AnimatedPressable
        onPress={onPress}
        scale={0.985}
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel={thread.title}
      >
        <View style={styles.top}>
          <Chip label={thread.category.name} color={tint} />
          <View style={styles.flags}>
            {thread.isPinned ? <Pin size={13} color={colors.warning} strokeWidth={2.4} /> : null}
            {thread.isLocked ? <Lock size={13} color={colors.textTertiary} strokeWidth={2.4} /> : null}
            <ForumDate value={thread.createdAt} />
          </View>
        </View>

        <Typography variant="title" numberOfLines={2}>
          {thread.title}
        </Typography>

        {excerpt ? (
          <Typography variant="caption" color="secondary" numberOfLines={2}>
            {excerpt}
          </Typography>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.author}>
            <ForumAvatar photo={thread.author.photo} pseudo={thread.author.pseudo} size={22} />
            <Typography variant="captionStrong" color="secondary" numberOfLines={1}>
              {thread.author.pseudo}
            </Typography>
          </View>

          <View style={styles.stats}>
            <Stat icon={MessageCircle} value={thread.repliesCount} />
            <Stat icon={Eye} value={thread.viewsCount} />
            <Stat icon={ThumbsUp} value={thread.likesCount} />
          </View>
        </View>
      </AnimatedPressable>
    </Reanimated.View>
  );
}

function Stat({ icon: Icon, value }: { icon: typeof Eye; value: number }) {
  const colors = useColors();
  return (
    <View style={styles.stat}>
      <Icon size={12} color={colors.textTertiary} strokeWidth={2.2} />
      <Typography variant="caption" color="tertiary">
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  flags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  author: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
