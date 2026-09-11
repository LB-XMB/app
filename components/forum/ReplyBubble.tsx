import { StyleSheet, View } from 'react-native';

import type { ForumReply } from '@/services/api';
import { Typography } from '@/ui/components';
import { radius, spacing, useColors } from '@/ui/theme';

import { ForumAvatar } from './ForumAvatar';
import { ForumDate } from './ForumDate';
import { ThreadContent } from './ThreadContent';

export interface ReplyBubbleProps {
  reply: ForumReply;
}

/** One reply under a forum thread. */
export function ReplyBubble({ reply }: ReplyBubbleProps) {
  const colors = useColors();

  return (
    <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <ForumAvatar photo={reply.author.photo} pseudo={reply.author.pseudo} size={30} />
        <View style={styles.headerText}>
          <Typography variant="title" numberOfLines={1}>
            {reply.author.pseudo}
          </Typography>
          <ForumDate value={reply.createdAt} editedAt={reply.updatedAt} />
        </View>
      </View>

      <ThreadContent
        content={reply.content}
        attachments={reply.attachments}
        poll={null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
});
