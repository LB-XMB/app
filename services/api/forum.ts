/**
 * Forum and news endpoints.
 *
 * The forum answers in camelCase but keeps the habits of the rest of the API:
 * numbers may arrive as strings, ids as integers, and message bodies embed HTML
 * comments carrying the attachments and the poll definition.
 */

import { ApiError, request } from './client';
import { asRecord, toNumber, toStringOrNull, toText } from './normalize';

type Raw = Record<string, unknown>;

export type ForumSort = 'recent' | 'popular' | 'oldest';
export type ForumReactionType = 'like' | 'dislike';
export type ForumVisibility = 'public' | 'followers' | 'private';

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  orderIndex: number;
}

export interface ForumAuthor {
  id: string;
  pseudo: string;
  /** Relative uploads path or absolute URL; resolve it with `uploadUrl()`. */
  photo: string | null;
}

export interface ForumTag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
}

/** Category as embedded in a thread payload, without the description. */
export interface ForumThreadCategory {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
}

export interface ForumPoll {
  options: string[];
  multiple: boolean;
  closed: boolean;
  /** Epoch milliseconds of the closing date, when the poll has one. */
  endsAt: number | null;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  /** Body with the attachment and poll markers stripped out. */
  content: string;
  /** Relative uploads paths of the images joined to the message. */
  attachments: string[];
  poll: ForumPoll | null;
  isPinned: boolean;
  isLocked: boolean;
  viewsCount: number;
  repliesCount: number;
  likesCount: number;
  dislikesCount: number;
  visibility: ForumVisibility;
  createdAt: string | null;
  lastReplyAt: string | null;
  tags: ForumTag[];
  author: ForumAuthor;
  category: ForumThreadCategory;
  /** Set when the thread belongs to a private group, which the app never opens. */
  groupId: string | null;
}

export interface ForumReply {
  id: string;
  threadId: string;
  content: string;
  attachments: string[];
  createdAt: string | null;
  updatedAt: string | null;
  likesCount: number;
  userLiked: boolean;
  author: ForumAuthor;
}

/** A thread plus every reply: the API embeds them all, without pagination. */
export interface ForumThreadDetail extends ForumThread {
  replies: ForumReply[];
}

export interface ForumPagination {
  page: number;
  perPage: number;
  total: number;
  pages: number;
}

export interface ForumThreadPage {
  items: ForumThread[];
  pagination: ForumPagination;
}

export interface ForumThreadReactions {
  likes: number;
  dislikes: number;
  userReaction: ForumReactionType | null;
}

/** Normalised news entry, whether it comes from the home feed or from a thread. */
export interface NewsItem {
  /** Thread id, so the app can open `/forum/{id}`. */
  id: string;
  title: string;
  excerpt: string;
  categorySlug: string;
  categoryName: string;
  categoryColor: string | null;
  authorPseudo: string;
  createdAt: string | null;
  /** First attachment, used as the illustration. */
  image: string | null;
  poll: ForumPoll | null;
}

export interface ForumThreadQuery {
  categoryId?: string;
  page?: number;
  perPage?: number;
  sort?: ForumSort;
}

/** Thread list query without the pagination, usable as a cache key. */
export type ForumThreadListQuery = Omit<ForumThreadQuery, 'page' | 'perPage'>;

export interface CreateForumThreadInput {
  categoryId: string;
  title: string;
  content: string;
  /** Console tag slugs, mandatory for the Entraide category. */
  tagSlugs?: string[];
}

const NEWS_FEED_MAX = 8;

/** Slugs whose threads only the staff may create. */
const STAFF_SLUGS = new Set(['annonce', 'annonces', 'actualite', 'actualité', 'actualites', 'sondage']);
/** The general room is a live chat: the create endpoint rejects it. */
const CHAT_SLUGS = new Set(['conversation', 'general', 'général', 'hors-sujet']);
const NEWS_SLUGS = new Set(['actualite', 'actualité', 'actualites']);
const ENTRAIDE_SLUGS = new Set(['entre-aide', 'entraide', 'aide', 'entre aide']);

function slugKey(slug: string): string {
  return slug.toLowerCase().trim();
}

/** True for the categories reserved to the staff (annonces, actualités, sondages). */
export function isStaffForumCategory(slug: string): boolean {
  return STAFF_SLUGS.has(slugKey(slug));
}

export function isNewsForumCategory(slug: string): boolean {
  return NEWS_SLUGS.has(slugKey(slug));
}

/** Entraide threads are refused without at least one console tag. */
export function isEntraideForumCategory(slug: string): boolean {
  return ENTRAIDE_SLUGS.has(slugKey(slug));
}

/** Categories a member can actually open a thread in. */
export function postableForumCategories(categories: ForumCategory[]): ForumCategory[] {
  return categories.filter(
    (category) => !isStaffForumCategory(category.slug) && !CHAT_SLUGS.has(slugKey(category.slug))
  );
}

/** Readable message for any value thrown by a mutation. */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.userMessage;
  if (error instanceof Error && error.message) return error.message;
  return 'Une erreur inattendue est survenue.';
}

/**
 * Some forum routes answer `200` with `success: false` and a French message
 * instead of an HTTP error, so both shapes end up as an `ApiError`.
 */
function unwrap(payload: unknown): Raw {
  const raw = asRecord(payload);
  if (raw.success === false) {
    throw new ApiError(
      'http',
      'forum request rejected',
      undefined,
      toStringOrNull(raw.error) ?? 'Le forum a refusé la requête.'
    );
  }
  return raw;
}

function requireToken(token: string | null | undefined): string {
  if (!token) {
    throw new ApiError('http', 'missing session token', 401, 'Connecte-toi pour continuer.');
  }
  return token;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return false;
}

function toIsoOrNull(value: unknown): string | null {
  const raw = toStringOrNull(value);
  if (!raw) return null;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

const ATTACHMENTS_MARKER = /<!--\s*ATTACHMENTS:(\[[\s\S]*?\])\s*-->/;
const POLL_MARKER = /<!--\s*POLL:(\{[\s\S]*?\})\s*-->/;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

function parsePoll(source: string): ForumPoll | null {
  const match = POLL_MARKER.exec(source);
  if (!match?.[1]) return null;
  try {
    const parsed = asRecord(JSON.parse(match[1]));
    const options = Array.isArray(parsed.options)
      ? parsed.options.map(toText).filter((option) => option.length > 0)
      : [];
    if (options.length < 2) return null;
    const endsAt = toNumber(parsed.endsAt, Number.NaN);
    return {
      options,
      multiple: toBoolean(parsed.multiple),
      closed: toBoolean(parsed.closed),
      endsAt: Number.isFinite(endsAt) && endsAt > 0 ? endsAt : null,
    };
  } catch {
    return null;
  }
}

function parseAttachments(source: string): string[] {
  const match = ATTACHMENTS_MARKER.exec(source);
  if (!match?.[1]) return [];
  try {
    const parsed: unknown = JSON.parse(match[1]);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(toStringOrNull).filter((path): path is string => path !== null);
  } catch {
    return [];
  }
}

interface ParsedBody {
  content: string;
  attachments: string[];
  poll: ForumPoll | null;
}

/**
 * Splits a raw message body: attachments and polls travel as HTML comments,
 * and the Discord bridge adds its own markers that must never be displayed.
 */
function parseBody(value: unknown): ParsedBody {
  const source = toText(value);
  return {
    content: source.replace(HTML_COMMENT, '').trim(),
    attachments: parseAttachments(source),
    poll: parsePoll(source),
  };
}

/** Plain text preview of a markdown body, for list rows and cards. */
export function forumExcerpt(content: string, max = 180): string {
  const flat = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_~`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

function normalizeAuthor(input: unknown): ForumAuthor {
  const raw = asRecord(input);
  return {
    id: toText(raw.id),
    pseudo: toStringOrNull(raw.pseudo) ?? 'Membre',
    photo: toStringOrNull(raw.photo),
  };
}

function normalizeTag(input: unknown): ForumTag {
  const raw = asRecord(input);
  return {
    id: toText(raw.id ?? raw.tag_id),
    name: toStringOrNull(raw.name) ?? '',
    slug: toStringOrNull(raw.slug) ?? '',
    color: toStringOrNull(raw.color),
    icon: toStringOrNull(raw.icon),
  };
}

function normalizeVisibility(value: unknown): ForumVisibility {
  const raw = toStringOrNull(value);
  return raw === 'followers' || raw === 'private' ? raw : 'public';
}

export function normalizeForumCategory(input: unknown): ForumCategory {
  const raw = asRecord(input);
  return {
    id: toText(raw.id),
    name: toStringOrNull(raw.name) ?? '',
    slug: toStringOrNull(raw.slug) ?? '',
    description: toStringOrNull(raw.description),
    icon: toStringOrNull(raw.icon),
    color: toStringOrNull(raw.color),
    orderIndex: toNumber(raw.orderIndex),
  };
}

export function normalizeForumThread(input: unknown): ForumThread {
  const raw = asRecord(input);
  const category = asRecord(raw.category);
  const body = parseBody(raw.content);

  return {
    id: toText(raw.id),
    categoryId: toText(raw.categoryId ?? category.id),
    title: toStringOrNull(raw.title) ?? 'Sans titre',
    slug: toText(raw.slug),
    content: body.content,
    attachments: body.attachments,
    poll: body.poll,
    isPinned: toBoolean(raw.isPinned),
    isLocked: toBoolean(raw.isLocked),
    viewsCount: toNumber(raw.viewsCount),
    repliesCount: toNumber(raw.repliesCount),
    likesCount: toNumber(raw.likesCount),
    dislikesCount: toNumber(raw.dislikesCount),
    visibility: normalizeVisibility(raw.visibility),
    createdAt: toIsoOrNull(raw.createdAt),
    lastReplyAt: toIsoOrNull(raw.lastReplyAt),
    tags: Array.isArray(raw.tags) ? raw.tags.map(normalizeTag) : [],
    author: normalizeAuthor(raw.author),
    category: {
      id: toText(category.id ?? raw.categoryId),
      name: toStringOrNull(category.name) ?? 'Forum',
      slug: toStringOrNull(category.slug) ?? '',
      color: toStringOrNull(category.color),
      icon: toStringOrNull(category.icon),
    },
    groupId: toStringOrNull(raw.groupId),
  };
}

export function normalizeForumReply(input: unknown): ForumReply {
  const raw = asRecord(input);
  const body = parseBody(raw.content);
  return {
    id: toText(raw.id),
    threadId: toText(raw.threadId),
    content: body.content,
    attachments: body.attachments,
    createdAt: toIsoOrNull(raw.createdAt),
    updatedAt: toIsoOrNull(raw.updatedAt),
    likesCount: toNumber(raw.likesCount),
    userLiked: toBoolean(raw.userLiked),
    author: normalizeAuthor(raw.author),
  };
}

/** Turns a thread into the news shape used by the actualités screen. */
export function newsItemFromThread(thread: ForumThread): NewsItem {
  return {
    id: thread.id,
    title: thread.title,
    excerpt: forumExcerpt(thread.content),
    categorySlug: thread.category.slug,
    categoryName: thread.category.name,
    categoryColor: thread.category.color,
    authorPseudo: thread.author.pseudo,
    createdAt: thread.createdAt,
    image: thread.attachments[0] ?? null,
    poll: thread.poll,
  };
}

function normalizeFeedNewsItem(input: unknown): NewsItem | null {
  const raw = asRecord(input);
  // The feed also carries YouTube entries, which are not forum content.
  if (toStringOrNull(raw.kind) === 'youtube') return null;

  const id = toText(raw.id);
  const title = toStringOrNull(raw.title);
  if (!id || !title) return null;

  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments.map(toStringOrNull).filter((path): path is string => path !== null)
    : [];
  const poll = asRecord(raw.poll);
  const options = Array.isArray(poll.options)
    ? poll.options.map(toText).filter((option) => option.length > 0)
    : [];

  return {
    id,
    title,
    excerpt: forumExcerpt(toText(raw.body)),
    categorySlug: toStringOrNull(raw.categorySlug) ?? '',
    categoryName: toStringOrNull(raw.categoryName) ?? 'Actualité',
    categoryColor: toStringOrNull(raw.categoryColor),
    authorPseudo: toStringOrNull(raw.authorPseudo) ?? 'Membre',
    createdAt: toIsoOrNull(raw.createdAt),
    image: attachments[0] ?? null,
    poll:
      options.length >= 2
        ? { options, multiple: toBoolean(poll.multiple), closed: false, endsAt: null }
        : null,
  };
}

/** Applies the toggle semantics of the reaction endpoint, for optimistic updates. */
export function toggleForumReaction(
  current: ForumThreadReactions,
  reaction: ForumReactionType
): ForumThreadReactions {
  const removing = current.userReaction === reaction;
  const likes =
    current.likes -
    (current.userReaction === 'like' ? 1 : 0) +
    (!removing && reaction === 'like' ? 1 : 0);
  const dislikes =
    current.dislikes -
    (current.userReaction === 'dislike' ? 1 : 0) +
    (!removing && reaction === 'dislike' ? 1 : 0);

  return {
    likes: Math.max(0, likes),
    dislikes: Math.max(0, dislikes),
    userReaction: removing ? null : reaction,
  };
}

export async function fetchForumCategories(signal?: AbortSignal): Promise<ForumCategory[]> {
  const payload = await request<unknown>('/api/forum-social/categories', {
    signal,
    query: { locale: 'fr' },
  });
  const raw = unwrap(payload);
  const categories = Array.isArray(raw.categories) ? raw.categories : [];
  return categories
    .map(normalizeForumCategory)
    .filter((category) => category.id.length > 0)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function fetchForumThreads(
  query: ForumThreadQuery = {},
  signal?: AbortSignal
): Promise<ForumThreadPage> {
  const perPage = query.perPage ?? 20;
  const payload = await request<unknown>('/api/forum-social/threads', {
    signal,
    query: {
      category_id: query.categoryId,
      page: query.page,
      per_page: perPage,
      sort: query.sort,
    },
  });

  const raw = unwrap(payload);
  const threads = Array.isArray(raw.threads) ? raw.threads : [];
  // Group threads are listed too, but their content is reserved to members.
  const items = threads.map(normalizeForumThread).filter((thread) => thread.groupId === null);
  const pagination = asRecord(raw.pagination);
  const total = toNumber(pagination.total, items.length);

  return {
    items,
    pagination: {
      page: toNumber(pagination.page, query.page ?? 1),
      perPage: toNumber(pagination.perPage, perPage),
      total,
      pages: toNumber(pagination.pages, Math.max(1, Math.ceil(total / perPage))),
    },
  };
}

export async function fetchForumThread(
  id: string,
  token?: string | null,
  signal?: AbortSignal
): Promise<ForumThreadDetail> {
  const payload = await request<unknown>(`/api/forum-social/thread/${encodeURIComponent(id)}`, {
    signal,
    token,
  });
  const raw = unwrap(payload);
  const thread = asRecord(raw.thread);
  const replies = Array.isArray(thread.replies) ? thread.replies : [];

  return {
    ...normalizeForumThread(thread),
    replies: replies.map(normalizeForumReply),
  };
}

export async function fetchForumThreadReactions(
  id: string,
  token?: string | null,
  signal?: AbortSignal
): Promise<ForumThreadReactions> {
  const payload = await request<unknown>(
    `/api/forum-social/thread/${encodeURIComponent(id)}/reaction`,
    { signal, token }
  );
  const raw = unwrap(payload);
  const userReaction = toStringOrNull(raw.userReaction);

  return {
    likes: toNumber(raw.likes),
    dislikes: toNumber(raw.dislikes),
    userReaction: userReaction === 'like' || userReaction === 'dislike' ? userReaction : null,
  };
}

/** Increments the public view counter. Failures are non-blocking. */
export async function trackForumThreadView(id: string, token?: string | null): Promise<void> {
  try {
    await request<unknown>(`/api/forum-social/thread/${encodeURIComponent(id)}/view`, {
      method: 'POST',
      body: {},
      token,
    });
  } catch {
    // The counter is deduplicated server-side; a rejected view must not surface.
  }
}

export async function replyToForumThread(input: {
  threadId: string;
  content: string;
  token: string | null;
}): Promise<ForumReply> {
  const payload = await request<unknown>(
    `/api/forum-social/thread/${encodeURIComponent(input.threadId)}/reply`,
    {
      method: 'POST',
      token: requireToken(input.token),
      body: { content: input.content },
    }
  );
  const raw = unwrap(payload);
  return normalizeForumReply(raw.reply);
}

/** Creates a thread and returns its id. The endpoint only accepts multipart. */
export async function createForumThread(
  input: CreateForumThreadInput & { token: string | null }
): Promise<string> {
  const form = new FormData();
  form.append('category_id', input.categoryId);
  form.append('title', input.title);
  form.append('content', input.content);
  if (input.tagSlugs && input.tagSlugs.length > 0) {
    form.append('tags', JSON.stringify(input.tagSlugs));
  }

  const payload = await request<unknown>('/api/forum-social/thread/create', {
    method: 'POST',
    token: requireToken(input.token),
    body: form,
  });

  const raw = unwrap(payload);
  const id = toText(raw.threadId ?? asRecord(raw.thread).id);
  if (!id) {
    throw new ApiError('parse', 'thread id missing', undefined, 'Le sujet a été créé mais reste introuvable.');
  }
  return id;
}

export async function reactToForumThread(input: {
  threadId: string;
  reaction: ForumReactionType;
  token: string | null;
}): Promise<void> {
  const payload = await request<unknown>(
    `/api/forum-social/thread/${encodeURIComponent(input.threadId)}/reaction`,
    {
      method: 'POST',
      token: requireToken(input.token),
      body: { reaction_type: input.reaction },
    }
  );
  unwrap(payload);
}

export async function updateForumPost(input: {
  postId: string;
  content: string;
  token: string | null;
}): Promise<void> {
  const payload = await request<unknown>(
    `/api/forum-social/post/${encodeURIComponent(input.postId)}`,
    {
      method: 'PATCH',
      token: requireToken(input.token),
      body: { content: input.content },
    }
  );
  unwrap(payload);
}

export async function deleteForumPost(input: {
  postId: string;
  token: string | null;
}): Promise<void> {
  const payload = await request<unknown>(
    `/api/forum-social/post/${encodeURIComponent(input.postId)}`,
    { method: 'DELETE', token: requireToken(input.token) }
  );
  unwrap(payload);
}

/** Console tags, the only ones the Entraide category accepts. */
export async function fetchForumConsoleTags(signal?: AbortSignal): Promise<ForumTag[]> {
  const payload = await request<unknown>('/api/forum-social/tags', {
    signal,
    query: { all: 'true', category: 'console', limit: 100 },
  });
  const raw = unwrap(payload);
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  return tags.map(normalizeTag).filter((tag) => tag.slug.length > 0);
}

/** Home feed news, used as the highlight of the actualités screen. */
export async function fetchNews(limit = NEWS_FEED_MAX, signal?: AbortSignal): Promise<NewsItem[]> {
  const payload = await request<unknown>('/api/home/feed', {
    signal,
    // Only the news list is read, so the carousels are asked for nothing.
    query: {
      actualiteLimit: Math.min(Math.max(1, limit), NEWS_FEED_MAX),
      forumLimit: 0,
      youtubeLimit: 0,
    },
  });
  const raw = unwrap(payload);
  const list = Array.isArray(raw.actualites) ? raw.actualites : [];
  return list
    .map(normalizeFeedNewsItem)
    .filter((item): item is NewsItem => item !== null);
}
