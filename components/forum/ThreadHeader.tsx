import { ThumbsDown, ThumbsUp } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { ForumThread, ForumThreadReactions } from '@/services/api';
import { AnimatedPressable, Chip, Typography } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

import { ForumAvatar } from './ForumAvatar';
import { ForumDate } from './ForumDate';
import { ThreadContent } from './ThreadContent';

export interface ThreadHeaderProps {
  thread: ForumThread;
  reactions?: ForumThreadReactions;
  onReact?: (reaction: 'like' | 'dislike') => void;
  canReact?: boolean;
}

/** Title, author, body and reactions of a forum thread. */
export function ThreadHeader({ thread, reactions, onReact, canReact }: ThreadHeaderProps) {
  const colors = useColors();
  const tint = thread.category.color ?? colors.primary;
  const likes = reactions?.likes ?? thread.likesCount;
  const dislikes = reactions?.dislikes ?? thread.dislikesCount;
  const userReaction = reactions?.userReaction ?? null;

  return (
    <View style={styles.root}>
      <View style={styles.meta}>
        <Chip label={thread.category.name} color={tint} />
        <ForumDate value={thread.createdAt} />
      </View>

      <Typography variant="h1">{thread.title}</Typography>

      <View style={styles.author}>
        <ForumAvatar photo={thread.author.photo} pseudo={thread.author.pseudo} size={36} />
        <View style={styles.authorText}>
          <Typography variant="title">{thread.author.pseudo}</Typography>
          <Typography variant="caption" color="tertiary">
            {thread.repliesCount} réponse{thread.repliesCount > 1 ? 's' : ''} · {thread.viewsCount}{' '}
            vue{thread.viewsCount > 1 ? 's' : ''}
          </Typography>
        </View>
      </View>

      <ThreadContent
        content={thread.content}
        attachments={thread.attachments}
        poll={thread.poll}
      />

      <View style={styles.reactions}>
        <ReactionButton
          icon={ThumbsUp}
          count={likes}
          active={userReaction === 'like'}
          disabled={!canReact}
          onPress={() => onReact?.('like')}
        />
        <ReactionButton
          icon={ThumbsDown}
          count={dislikes}
          active={userReaction === 'dislike'}
          disabled={!canReact}
          onPress={() => onReact?.('dislike')}
        />
      </View>
    </View>
  );
}

function ReactionButton({
  icon: Icon,
  count,
  active,
  disabled,
  onPress,
}: {
  icon: typeof ThumbsUp;
  count: number;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const tint = active ? colors.primary : colors.textSecondary;

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      scale={0.94}
      style={[
        styles.reaction,
        {
          backgroundColor: active ? `${colors.primary}1F` : colors.item,
          borderColor: active ? colors.primary : colors.border,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <Icon size={16} color={tint} strokeWidth={2.3} fill={active ? tint : 'transparent'} />
      <Typography variant="captionStrong" color={tint}>
        {count}
      </Typography>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  authorText: {
    flex: 1,
    gap: 2,
  },
  reactions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
});
