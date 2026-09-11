import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryPicker } from '@/components/forum/CategoryPicker';
import { ThreadBodyField } from '@/components/forum/MessageComposer';
import { SignInCallout } from '@/components/forum/SignInCallout';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import {
  useCreateForumThread,
  useForumConsoleTags,
  usePostableForumCategories,
} from '@/hooks/useForum';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import {
  apiErrorMessage,
  isEntraideForumCategory,
} from '@/services/api';
import { useIsSignedIn } from '@/stores/session';
import { Button, Chip, Screen, Typography } from '@/ui/components';
import { radius, screenPadding, spacing, useColors } from '@/ui/theme';

export default function NewForumThreadScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const signedIn = useIsSignedIn();
  useScreenTracking('/forum/nouveau');

  const { categories, isLoading } = usePostableForumCategories();
  const create = useCreateForumThread();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagSlugs, setTagSlugs] = useState<string[]>([]);

  const selected = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId]
  );
  const needsTags = selected ? isEntraideForumCategory(selected.slug) : false;
  const tags = useForumConsoleTags(needsTags);

  const canSubmit =
    signedIn &&
    Boolean(categoryId) &&
    title.trim().length >= 3 &&
    content.trim().length >= 3 &&
    (!needsTags || tagSlugs.length > 0) &&
    !create.isPending;

  const toggleTag = (slug: string) => {
    setTagSlugs((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    );
  };

  const submit = async () => {
    if (!categoryId || !canSubmit) return;
    try {
      const id = await create.mutateAsync({
        categoryId,
        title: title.trim(),
        content: content.trim(),
        tagSlugs: needsTags ? tagSlugs : undefined,
      });
      router.replace(`/forum/${id}`);
    } catch (error) {
      Alert.alert('Publication refusée', apiErrorMessage(error));
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Nouveau sujet" />

      {!signedIn ? (
        <View style={styles.padded}>
          <SignInCallout description="Connecte-toi pour ouvrir un sujet sur le forum." />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing['3xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.group}>
            <Typography variant="label" color="tertiary">
              Catégorie
            </Typography>
            <CategoryPicker
              categories={categories}
              selectedId={categoryId}
              onSelect={(id) => {
                setCategoryId(id);
                setTagSlugs([]);
              }}
              wrap
            />
            {isLoading ? (
              <Typography variant="caption" color="tertiary">
                Chargement des catégories…
              </Typography>
            ) : null}
          </View>

          {needsTags ? (
            <View style={styles.group}>
              <Typography variant="label" color="tertiary">
                Console concernée
              </Typography>
              <View style={styles.tags}>
                {(tags.data ?? []).map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    color={tag.color ?? undefined}
                    selected={tagSlugs.includes(tag.slug)}
                    onPress={() => toggleTag(tag.slug)}
                    size="small"
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.group}>
            <Typography variant="label" color="tertiary">
              Titre
            </Typography>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Un titre clair"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.title,
                { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
              ]}
            />
          </View>

          <View style={styles.group}>
            <Typography variant="label" color="tertiary">
              Message
            </Typography>
            <ThreadBodyField value={content} onChangeText={setContent} />
          </View>

          <Button
            label={create.isPending ? 'Publication…' : 'Publier'}
            onPress={() => void submit()}
            disabled={!canSubmit}
            loading={create.isPending}
            size="large"
          />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  padded: {
    padding: screenPadding,
  },
  content: {
    paddingHorizontal: screenPadding,
    gap: spacing.xl,
  },
  group: {
    gap: spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    height: 48,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
});
