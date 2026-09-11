import * as WebBrowser from 'expo-web-browser';
import { Fragment, useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';

import { fonts, radius, spacing, useColors, type Palette } from '@/ui/theme';

export interface ForumMarkdownProps {
  content: string;
  /** Colour of the running text; defaults to the secondary text colour. */
  color?: string;
}

/**
 * Renders the Discord-flavoured markdown the forum stores as plain text
 * (`**bold**`, `> quote`, ``` fences, `-# small`, mentions, links).
 * Anything unrecognised falls back to being displayed verbatim.
 */
export function ForumMarkdown({ content, color }: ForumMarkdownProps) {
  const colors = useColors();
  const blocks = useMemo(() => parseBlocks(content), [content]);
  const textColor = color ?? colors.textSecondary;

  if (blocks.length === 0) return null;

  return (
    <View style={styles.body}>
      {blocks.map((block, index) => (
        <Fragment key={index}>{renderBlock(block, colors, textColor, index)}</Fragment>
      ))}
    </View>
  );
}

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'small'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'list'; items: string[]; ordered: boolean }
  | { kind: 'rule' };

const HEADING_SIZES: Record<number, number> = { 1: 21, 2: 18.5, 3: 16.5 };

const FENCE = /^```/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const SMALL = /^-#\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const ORDERED = /^\s*\d+[.)]\s+(.*)$/;
const RULE = /^-{3,}$/;

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      index += 1;
      continue;
    }

    if (FENCE.test(trimmed)) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !FENCE.test((lines[index] ?? '').trim())) {
        code.push(lines[index] ?? '');
        index += 1;
      }
      index += 1;
      blocks.push({ kind: 'code', text: code.join('\n').trim() });
      continue;
    }

    if (RULE.test(trimmed)) {
      blocks.push({ kind: 'rule' });
      index += 1;
      continue;
    }

    const small = SMALL.exec(trimmed);
    if (small) {
      blocks.push({ kind: 'small', text: small[1] ?? '' });
      index += 1;
      continue;
    }

    const heading = HEADING.exec(trimmed);
    if (heading) {
      blocks.push({
        kind: 'heading',
        level: (heading[1] ?? '#').length,
        text: heading[2] ?? '',
      });
      index += 1;
      continue;
    }

    const quote = QUOTE.exec(trimmed);
    if (quote) {
      const quoted: string[] = [quote[1] ?? ''];
      index += 1;
      while (index < lines.length) {
        const next = QUOTE.exec((lines[index] ?? '').trim());
        if (!next) break;
        quoted.push(next[1] ?? '');
        index += 1;
      }
      blocks.push({ kind: 'quote', text: quoted.join('\n').trim() });
      continue;
    }

    const bullet = BULLET.exec(line);
    const ordered = ORDERED.exec(line);
    if (bullet || ordered) {
      const isOrdered = !bullet;
      const items: string[] = [(bullet ?? ordered)?.[1] ?? ''];
      index += 1;
      while (index < lines.length) {
        const current = lines[index] ?? '';
        const next = isOrdered ? ORDERED.exec(current) : BULLET.exec(current);
        if (!next) break;
        items.push(next[1] ?? '');
        index += 1;
      }
      blocks.push({ kind: 'list', items, ordered: isOrdered });
      continue;
    }

    // Consecutive plain lines belong to the same paragraph.
    const paragraph: string[] = [trimmed];
    index += 1;
    while (index < lines.length) {
      const current = lines[index] ?? '';
      const currentTrimmed = current.trim();
      if (
        currentTrimmed.length === 0 ||
        FENCE.test(currentTrimmed) ||
        RULE.test(currentTrimmed) ||
        SMALL.test(currentTrimmed) ||
        HEADING.test(currentTrimmed) ||
        QUOTE.test(currentTrimmed) ||
        BULLET.test(current) ||
        ORDERED.test(current)
      ) {
        break;
      }
      paragraph.push(currentTrimmed);
      index += 1;
    }
    blocks.push({ kind: 'paragraph', text: paragraph.join('\n') });
  }

  return blocks;
}

function renderBlock(
  block: Block,
  colors: Palette,
  textColor: string,
  key: number
): ReactNode {
  switch (block.kind) {
    case 'heading':
      return (
        <Text
          style={[
            styles.heading,
            { color: colors.text, fontSize: HEADING_SIZES[block.level] ?? 16 },
          ]}
        >
          {renderInline(block.text, colors, textColor, key)}
        </Text>
      );

    case 'small':
      return (
        <Text style={[styles.small, { color: colors.textTertiary }]}>
          {renderInline(block.text, colors, colors.textTertiary, key)}
        </Text>
      );

    case 'quote':
      return (
        <View style={[styles.quote, { borderLeftColor: colors.primary }]}>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            {renderInline(block.text, colors, colors.textSecondary, key)}
          </Text>
        </View>
      );

    case 'code':
      return (
        <View
          style={[styles.code, { backgroundColor: colors.item, borderColor: colors.border }]}
        >
          <Text style={[styles.codeText, { color: colors.text }]} selectable>
            {block.text}
          </Text>
        </View>
      );

    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.listItem}>
              <Text style={[styles.bullet, { color: colors.primary }]}>
                {block.ordered ? `${itemIndex + 1}.` : '•'}
              </Text>
              <Text style={[styles.paragraph, styles.listText, { color: textColor }]}>
                {renderInline(item, colors, textColor, key * 1000 + itemIndex)}
              </Text>
            </View>
          ))}
        </View>
      );

    case 'rule':
      return <View style={[styles.rule, { backgroundColor: colors.separator }]} />;

    default:
      return (
        <Text style={[styles.paragraph, { color: textColor }]}>
          {renderInline(block.text, colors, textColor, key)}
        </Text>
      );
  }
}

interface Segment {
  text: string;
  style?: TextStyle;
  href?: string;
}

const INLINE = new RegExp(
  [
    '(?<code>`[^`\\n]+`)',
    '(?<boldItalic>\\*\\*\\*[^*\\n]+\\*\\*\\*)',
    '(?<bold>\\*\\*[^*\\n]+\\*\\*)',
    '(?<underline>__[^_\\n]+__)',
    '(?<strike>~~[^~\\n]+~~)',
    '(?<italic>\\*[^*\\n]+\\*)',
    '(?<link>\\[[^\\]\\n]+\\]\\([^)\\s]+\\))',
    '(?<url>https?://[^\\s<>"\')\\]]+)',
    '(?<mention>@[A-Za-z0-9_.-]{2,32})',
  ].join('|'),
  'g'
);

function parseSegments(text: string, colors: Palette): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  INLINE.lastIndex = 0;

  let match = INLINE.exec(text);
  while (match) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index) });
    }
    segments.push(toSegment(match, colors));
    cursor = match.index + match[0].length;
    match = INLINE.exec(text);
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

function toSegment(match: RegExpExecArray, colors: Palette): Segment {
  const groups = match.groups ?? {};
  const raw = match[0];

  if (groups.code) return { text: strip(raw, 1), style: { fontFamily: fonts.text.medium, backgroundColor: colors.item } };
  if (groups.boldItalic)
    return { text: strip(raw, 3), style: { fontFamily: fonts.text.bold, fontStyle: 'italic' } };
  if (groups.bold) return { text: strip(raw, 2), style: { fontFamily: fonts.text.bold } };
  if (groups.underline) return { text: strip(raw, 2), style: { textDecorationLine: 'underline' } };
  if (groups.strike) return { text: strip(raw, 2), style: { textDecorationLine: 'line-through' } };
  if (groups.italic) return { text: strip(raw, 1), style: { fontStyle: 'italic' } };
  if (groups.mention)
    return { text: raw, style: { fontFamily: fonts.text.semibold, color: colors.primary } };

  if (groups.link) {
    const parts = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(raw);
    return {
      text: parts?.[1] ?? raw,
      href: parts?.[2],
      style: { color: colors.primary, textDecorationLine: 'underline' },
    };
  }

  return { text: raw, href: raw, style: { color: colors.primary, textDecorationLine: 'underline' } };
}

function strip(value: string, delimiter: number): string {
  return value.slice(delimiter, value.length - delimiter);
}

function renderInline(
  text: string,
  colors: Palette,
  textColor: string,
  key: number
): ReactNode {
  return parseSegments(text, colors).map((segment, index) => (
    <Text
      key={`${key}.${index}`}
      style={segment.style}
      onPress={
        segment.href ? () => void WebBrowser.openBrowserAsync(segment.href!) : undefined
      }
    >
      {segment.text}
    </Text>
  ));
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.sm,
  },
  paragraph: {
    fontFamily: fonts.text.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  heading: {
    fontFamily: fonts.display.bold,
    lineHeight: 26,
    marginTop: 2,
  },
  small: {
    fontFamily: fonts.text.regular,
    fontSize: 12.5,
    lineHeight: 18,
  },
  quote: {
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
  },
  code: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  codeText: {
    fontFamily: fonts.text.medium,
    fontSize: 12.5,
    lineHeight: 19,
  },
  list: {
    gap: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    fontFamily: fonts.text.semibold,
    fontSize: 14,
    lineHeight: 23,
    minWidth: 14,
  },
  listText: {
    flex: 1,
  },
  rule: {
    height: StyleSheet.hairlineWidth * 2,
    marginVertical: spacing.xs,
  },
});
