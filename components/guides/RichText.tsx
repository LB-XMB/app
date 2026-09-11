import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Fragment, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { siteUrl } from '@/services/api';
import type { RichTextNode } from '@/services/api';
import { Typography } from '@/ui/components';
import { fonts, radius, spacing, useColors, type Palette } from '@/ui/theme';

/**
 * Renders the TipTap document returned by `/api/guides/{id}` natively.
 * Unknown node types fall back to rendering their children, so new editor
 * features degrade gracefully instead of disappearing.
 */
export function RichText({ node }: { node: RichTextNode | null }) {
  const colors = useColors();
  if (!node) return null;
  return <>{renderNode(node, colors, 'root')}</>;
}

const HEADING_SIZES: Record<number, number> = { 1: 22, 2: 19, 3: 17, 4: 16 };

function renderNode(node: RichTextNode, colors: Palette, key: string): ReactNode {
  const children = node.content ?? [];
  const renderChildren = (offset = 0) =>
    children.map((child, index) => renderNode(child, colors, `${key}.${index + offset}`));

  switch (node.type) {
    case 'doc':
      return (
        <View key={key} style={styles.doc}>
          {renderChildren()}
        </View>
      );

    case 'paragraph': {
      if (children.length === 0) return null;
      const align = node.attrs?.textAlign as 'left' | 'center' | 'right' | undefined;
      return (
        <Text
          key={key}
          style={[
            styles.paragraph,
            { color: colors.textSecondary },
            align ? { textAlign: align } : null,
          ]}
        >
          {renderInline(children, colors, key)}
        </Text>
      );
    }

    case 'heading': {
      const level = Number(node.attrs?.level ?? 2);
      return (
        <Text
          key={key}
          style={[
            styles.heading,
            { color: colors.text, fontSize: HEADING_SIZES[level] ?? 16 },
          ]}
        >
          {renderInline(children, colors, key)}
        </Text>
      );
    }

    case 'bulletList':
    case 'orderedList':
      return (
        <View key={key} style={styles.list}>
          {children.map((item, index) => (
            <View key={`${key}.${index}`} style={styles.listItem}>
              <Typography variant="caption" color="primary" style={styles.bullet}>
                {node.type === 'orderedList' ? `${index + 1}.` : '•'}
              </Typography>
              <View style={styles.listItemBody}>
                {(item.content ?? []).map((child, childIndex) =>
                  renderNode(child, colors, `${key}.${index}.${childIndex}`)
                )}
              </View>
            </View>
          ))}
        </View>
      );

    case 'blockquote':
      return (
        <View
          key={key}
          style={[styles.blockquote, { borderLeftColor: colors.primary }]}
        >
          {renderChildren()}
        </View>
      );

    case 'codeBlock':
      return (
        <View
          key={key}
          style={[styles.codeBlock, { backgroundColor: colors.item, borderColor: colors.border }]}
        >
          <Text style={[styles.code, { color: colors.text }]} selectable>
            {plainText(node)}
          </Text>
        </View>
      );

    case 'image': {
      const uri = siteUrl(node.attrs?.src as string | undefined);
      if (!uri) return null;
      return (
        <Image
          key={key}
          source={{ uri }}
          style={[styles.image, { backgroundColor: colors.item }]}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
        />
      );
    }

    case 'horizontalRule':
      return (
        <View key={key} style={[styles.rule, { backgroundColor: colors.separator }]} />
      );

    case 'hardBreak':
      return <Fragment key={key}>{'\n'}</Fragment>;

    case 'text':
      return (
        <Text key={key} style={{ color: colors.textSecondary }}>
          {node.text}
        </Text>
      );

    default:
      return children.length > 0 ? (
        <View key={key} style={styles.doc}>
          {renderChildren()}
        </View>
      ) : null;
  }
}

/** Inline children of a paragraph or heading, with their marks applied. */
function renderInline(nodes: RichTextNode[], colors: Palette, key: string): ReactNode {
  return nodes.map((node, index) => {
    const childKey = `${key}.i${index}`;

    if (node.type === 'hardBreak') return <Fragment key={childKey}>{'\n'}</Fragment>;

    if (node.type !== 'text') {
      // Inline images and other embeds inside a paragraph.
      return renderNode(node, colors, childKey);
    }

    const style: Record<string, unknown> = {};
    let href: string | null = null;

    for (const mark of node.marks ?? []) {
      switch (mark.type) {
        case 'bold':
          style.fontFamily = fonts.text.bold;
          break;
        case 'italic':
          style.fontStyle = 'italic';
          break;
        case 'underline':
          style.textDecorationLine = 'underline';
          break;
        case 'strike':
          style.textDecorationLine = 'line-through';
          break;
        case 'code':
          style.fontFamily = fonts.text.medium;
          style.backgroundColor = colors.item;
          break;
        case 'link':
          href = (mark.attrs?.href as string | undefined) ?? null;
          style.color = colors.primary;
          style.textDecorationLine = 'underline';
          break;
        case 'textStyle': {
          const color = mark.attrs?.color as string | undefined;
          const fontSize = mark.attrs?.fontSize as string | undefined;
          if (color) style.color = color;
          if (fontSize) {
            const parsed = Number.parseFloat(fontSize);
            if (Number.isFinite(parsed)) style.fontSize = parsed;
          }
          break;
        }
        default:
          break;
      }
    }

    return (
      <Text
        key={childKey}
        style={style}
        onPress={href ? () => void WebBrowser.openBrowserAsync(href) : undefined}
      >
        {node.text}
      </Text>
    );
  });
}

/** Flattens a node subtree into plain text. */
function plainText(node: RichTextNode): string {
  if (node.text) return node.text;
  return (node.content ?? []).map(plainText).join('');
}

const styles = StyleSheet.create({
  doc: {
    gap: spacing.md,
  },
  paragraph: {
    fontFamily: fonts.text.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  heading: {
    fontFamily: fonts.display.bold,
    lineHeight: 26,
    marginTop: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    minWidth: 16,
    paddingTop: 3,
  },
  listItemBody: {
    flex: 1,
    gap: spacing.xs,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
    gap: spacing.sm,
  },
  codeBlock: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  code: {
    fontFamily: fonts.text.medium,
    fontSize: 12.5,
    lineHeight: 19,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
  },
  rule: {
    height: StyleSheet.hairlineWidth * 2,
    marginVertical: spacing.sm,
  },
});
