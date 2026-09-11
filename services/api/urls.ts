import { API_BASE_URL } from './config';

/**
 * Uploads are served by `/api/uploads/<path>`; every segment must be encoded
 * because folder names contain spaces and accents.
 *
 * Mirrors `resourceUploadUrl` in `web/src/lib/resource-contributors.ts`.
 */
export function uploadUrl(
  path: string | null | undefined,
  cacheKey?: string | null
): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    if (!cacheKey) return trimmed;
    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}v=${encodeURIComponent(cacheKey)}`;
  }

  // Paths coming from the API may already be prefixed by the uploads route.
  const relative = trimmed.replace(/^\/?(api\/uploads\/)?/i, '');
  const encoded = relative
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/');

  const base = `${API_BASE_URL}/api/uploads/${encoded}`;
  return cacheKey ? `${base}?v=${encodeURIComponent(cacheKey)}` : base;
}

/** Resolves a website-relative href (e.g. `/lbxmb.png`) to an absolute URL. */
export function siteUrl(href: string | null | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${API_BASE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}
