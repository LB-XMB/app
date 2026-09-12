import { ApiError, request } from './client';
import { uploadUrl } from './urls';

export interface PublicUserResource {
  id: string;
  title: string;
  platform?: string | null;
  logo?: string | null;
}

export interface PublicUserGuide {
  id: string;
  title: string;
  platform?: string | null;
}

export interface PublicUser {
  id: string;
  publicId: string | null;
  pseudo: string;
  photo: string | null;
  banner: string | null;
  bio: string | null;
  resources: PublicUserResource[];
  guides: PublicUserGuide[];
  followersCount: number;
  followingCount: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function mapResource(raw: unknown): PublicUserResource | null {
  const item = asRecord(raw);
  const id = String(item.id ?? item.resource_id ?? '').trim();
  const title = String(item.title ?? item.nom ?? '').trim();
  if (!id || !title) return null;
  return {
    id,
    title,
    platform: (item.platform ?? item.console ?? null) as string | null,
    logo: (item.logo ?? item.icon ?? null) as string | null,
  };
}

function mapGuide(raw: unknown): PublicUserGuide | null {
  const item = asRecord(raw);
  const id = String(item.id ?? item.guide_id ?? '').trim();
  const title = String(item.title ?? item.nom ?? '').trim();
  if (!id || !title) return null;
  return {
    id,
    title,
    platform: (item.platform ?? item.console ?? null) as string | null,
  };
}

export async function fetchPublicUser(
  id: string,
  signal?: AbortSignal
): Promise<PublicUser> {
  const payload = await request<{
    success?: boolean;
    user?: Record<string, unknown>;
    error?: string;
  }>(`/api/users/${encodeURIComponent(id)}`, { signal });

  if (!payload.success || !payload.user) {
    throw new ApiError('http', 'user not found', 404, payload.error ?? 'Utilisateur introuvable');
  }

  const user = payload.user;
  const photoRaw = (user.photo as string | null) ?? null;
  const bannerRaw = (user.banner as string | null) ?? null;

  return {
    id: String(user.id ?? id),
    publicId: user.publicId != null ? String(user.publicId) : null,
    pseudo: String(user.pseudo ?? 'Membre'),
    photo: photoRaw
      ? photoRaw.startsWith('http')
        ? photoRaw
        : uploadUrl(photoRaw) ?? photoRaw
      : null,
    banner: bannerRaw
      ? bannerRaw.startsWith('http')
        ? bannerRaw
        : uploadUrl(bannerRaw) ?? bannerRaw
      : null,
    bio: (user.bio ?? user.description ?? null) as string | null,
    resources: asList(user.resources).map(mapResource).filter(Boolean) as PublicUserResource[],
    guides: asList(user.guides).map(mapGuide).filter(Boolean) as PublicUserGuide[],
    followersCount: Number(user.followersCount ?? 0),
    followingCount: Number(user.followingCount ?? 0),
  };
}
