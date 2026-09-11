import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageComposer } from '@/components/forum/MessageComposer';
import { ReplyBubble } from '@/components/forum/ReplyBubble';
import { SignInCallout } from '@/components/forum/SignInCallout';
import { ThreadHeader } from '@/components/forum/ThreadHeader';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import {
  useForumThread,
  useForumThreadReaction,
  useForumThreadReactions,
  useReplyToForumThread,
  useTrackForumThreadView,
} from '@/hooks/useForum';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { apiErrorMessage } from '@/services/api';
import { useIsSignedIn } from '@/stores/session';
import { EmptyState, ErrorState, Screen, Skeleton, Typography } from '@/ui/components';
import { screenPadding, spacing, useColors } from '@/ui/theme';

export default function ForumThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const signedIn = useIsSignedIn();
  useScreenTracking('/forum/thread');

  const thread = useForumThread(id);
  const reactions = useForumThreadReactions(id);
  const reply = useReplyToForumThread(id ?? '');
  const react = useForumThreadReaction(id ?? '');
  useTrackForumThreadView(id);

  const locked = Boolean(thread.data?.isLocked);

  const onReply = async (content: string) => {
    try {
      await reply.mutateAsync(content);
    } catch (error) {
      Alert.alert('Réponse refusée', apiErrorMessage(error));
    }
  };

  const onReact = (reaction: 'like' | 'dislike') => {
    if (!signedIn) {
      router.push('/compte');
      return;
    }
    react.mutate(reaction, {
      onError: (error) => Alert.alert('Réaction refusée', apiErrorMessage(error)),
    });
  };

  return (
    <Screen>
      <ScreenHeader title={thread.data?.title ?? 'Sujet'} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        {thread.isError ? (
          <ErrorState error={thread.error} onRetry={() => void thread.refetch()} />
        ) : thread.isLoading || !thread.data ? (
          <View style={styles.loading}>
            <Skeleton width="40%" height={18} />
            <Skeleton width="90%" height={28} />
            <Skeleton width="100%" height={120} />
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={[
                styles.content,
                { paddingBottom: spacing.xl },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <ThreadHeader
                thread={thread.data}
                reactions={reactions.data}
                canReact={signedIn && !locked}
                onReact={onReact}
              />

              <Typography variant="label" color="tertiary" style={styles.section}>
                Réponses · {thread.data.replies.length}
              </Typography>

              {thread.data.replies.length === 0 ? (
                <EmptyState
                  title="Pas encore de réponse"
                  description="Sois le premier à contribuer à la discussion."
                />
              ) : (
                thread.data.replies.map((item) => <ReplyBubble key={item.id} reply={item} />)
              )}
            </ScrollView>

            <View
              style={[
                styles.composer,
                {
                  paddingBottom: insets.bottom + spacing.md,
                  borderTopColor: colors.separator,
                  backgroundColor: colors.background,
                },
              ]}
            >
              {locked ? (
                <Typography variant="caption" color="tertiary" align="center">
                  Ce sujet est verrouillé.
                </Typography>
              ) : signedIn ? (
                <MessageComposer submitting={reply.isPending} onSubmit={onReply} />
              ) : (
                <SignInCallout description="Connecte-toi pour répondre à ce sujet." />
              )}
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: screenPadding,
    gap: spacing.lg,
  },
  loading: {
    padding: screenPadding,
    gap: spacing.md,
  },
  section: {
    marginTop: spacing.sm,
  },
  composer: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
});
