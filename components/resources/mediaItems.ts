import { API_BASE_URL, uploadUrl } from '@/services/api';

/**
 * Extensions the website treats as playable files rather than screenshots.
 *
 * Mirrors the test in `web/src/app/ressources/[slug]/ResourceDetailClient.tsx`.
 */
const VIDEO_EXTENSIONS = /\.(mp4|avi|mov|webm)$/i;

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;
const YOUTUBE_URL =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export interface ImageMedia {
  kind: 'image';
  key: string;
  uri: string;
}

export interface VideoMedia {
  kind: 'video';
  key: string;
  uri: string;
}

export interface YoutubeMedia {
  kind: 'youtube';
  key: string;
  videoId: string;
  /** Opened in the browser, where YouTube plays it. */
  watchUrl: string;
  /** Served through the website proxy, which ad blockers do not filter out. */
  posterUri: string;
}

export type MediaItem = ImageMedia | VideoMedia | YoutubeMedia;

/**
 * Reads a YouTube video id out of a bare id, a watch link, a short link,
 * an embed URL or a Shorts URL.
 *
 * Mirrors `normalizeYouTubeVideoId` in `web/src/lib/lite-youtube-loader.ts`.
 */
export function youtubeVideoId(input: string | null | undefined): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;
  if (YOUTUBE_ID.test(raw)) return raw;
  return raw.match(YOUTUBE_URL)?.[1] ?? null;
}

export interface BuildMediaItemsOptions {
  /** Relative uploads paths, screenshots and video files mixed together. */
  media: string[];
  youtubeUrl?: string | null;
  /** Busts the image cache when the resource is updated. */
  cacheKey?: string | null;
}

/** Builds the gallery, with the YouTube video first as on the website. */
export function buildMediaItems({
  media,
  youtubeUrl,
  cacheKey,
}: BuildMediaItemsOptions): MediaItem[] {
  const items: MediaItem[] = [];

  const videoId = youtubeVideoId(youtubeUrl);
  if (videoId) {
    items.push({
      kind: 'youtube',
      key: `youtube:${videoId}`,
      videoId,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      posterUri: `${API_BASE_URL}/api/youtube-thumb/${encodeURIComponent(videoId)}?q=hq`,
    });
  }

  for (const path of media) {
    const uri = uploadUrl(path, cacheKey);
    if (!uri) continue;
    items.push({
      kind: VIDEO_EXTENSIONS.test(path) ? 'video' : 'image',
      key: path,
      uri,
    });
  }

  return items;
}
