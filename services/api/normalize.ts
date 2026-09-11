/**
 * The API mixes numbers with numeric strings, and embeds JSON inside strings
 * (`variantes`, `releases`, `tags`, ...). Everything is normalised here so the
 * UI only ever deals with the domain types.
 */

import type {
  ChangelogEntry,
  Contributor,
  DownloadFile,
  DownloadGroup,
  Guide,
  GuideChapter,
  GuideDetail,
  HomeStats,
  PopularResource,
  Resource,
  ResourceDetail,
  SearchHit,
  SearchHitType,
} from './types';

type Raw = Record<string, unknown>;

export function asRecord(value: unknown): Raw {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Raw) : {};
}

export function toStringOrNull(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

export function toText(value: unknown): string {
  return toStringOrNull(value) ?? '';
}

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function toNumberOrNull(value: unknown): number | null {
  const parsed = toNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Parses a value that may already be an object or still be a JSON string. */
function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function toStringArray(value: unknown): string[] {
  const parsed = Array.isArray(value) ? value : parseMaybeJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(toStringOrNull).filter((item): item is string => item !== null);
}

/** Cache-busting key derived from the resource modification date. */
function assetVersion(raw: Raw): string | null {
  const candidate =
    toStringOrNull(raw.logoVersion) ??
    toStringOrNull(raw.date_modification) ??
    toStringOrNull(raw.updated_at) ??
    toStringOrNull(raw.date_creation);
  if (!candidate) return null;
  if (/^\d+$/.test(candidate)) return candidate;
  const time = new Date(candidate).getTime();
  return Number.isFinite(time) ? String(time) : null;
}

export function normalizeResource(input: unknown): Resource {
  const raw = asRecord(input);
  const platforms = toStringArray(raw.platforms ?? raw.consoles ?? raw.consoles_json);
  const platform = toStringOrNull(raw.platform ?? raw.console) ?? platforms[0] ?? null;

  return {
    id: toText(raw.id ?? raw.resource_id),
    title: toText(raw.title ?? raw.nom),
    description: toText(raw.description),
    category: toStringOrNull(raw.category ?? raw.categorie),
    platform,
    platforms: platforms.length > 0 ? platforms : platform ? [platform] : [],
    version: toStringOrNull(raw.version),
    size: toStringOrNull(raw.size),
    downloads: toNumber(raw.downloads ?? raw.nb_telechargements),
    logo: toStringOrNull(raw.logo),
    logoVersion: assetVersion(raw),
    iconFormat: toStringOrNull(raw.iconFormat),
    author: toStringOrNull(raw.author ?? raw.auteur_name ?? raw.creator_name),
    authorAvatar: toStringOrNull(raw.authorAvatar ?? raw.author_photo ?? raw.profil_auteur),
    game: toStringOrNull(raw.jeu ?? raw.game),
    createdAt: toStringOrNull(raw.date_creation ?? raw.created_at),
  };
}

function normalizeDownloadFile(
  key: string,
  input: unknown,
  fallbackLabel: string
): DownloadFile | null {
  const raw = asRecord(input);
  const path = toStringOrNull(raw.chemin ?? raw.chemin_relatif ?? raw.fichier);
  const externalUrl = toStringOrNull(raw.url_externe ?? raw.url);
  if (!path && !externalUrl) return null;

  const fileName =
    toStringOrNull(raw.fichier) ??
    path?.split('/').filter(Boolean).pop() ??
    externalUrl?.split('/').filter(Boolean).pop() ??
    fallbackLabel;

  return {
    key,
    label: toStringOrNull(raw.nom) ?? fileName,
    fileName,
    path: externalUrl ? null : path,
    externalUrl,
    version: toStringOrNull(raw.version),
    description: toStringOrNull(raw.description),
    sizeBytes: toNumberOrNull(raw.size),
    sha256: toStringOrNull(raw.sha256),
  };
}

/**
 * `variantes` is a recursive tree: each node either holds `options`
 * (sub-groups) or describes a file.
 */
function normalizeVariantTree(input: unknown, keyPrefix = ''): DownloadGroup[] {
  const root = asRecord(input);
  const groups: DownloadGroup[] = [];

  for (const [label, value] of Object.entries(root)) {
    const node = asRecord(value);
    const key = `${keyPrefix}${label}`;
    const options = asRecord(node.options);
    const optionEntries = Object.entries(options);

    if (optionEntries.length === 0) {
      const file = normalizeDownloadFile(key, node, label);
      if (file) {
        groups.push({ key, label, files: [file], groups: [] });
      }
      continue;
    }

    const files: DownloadFile[] = [];
    const children: DownloadGroup[] = [];

    for (const [optionLabel, optionValue] of optionEntries) {
      const optionNode = asRecord(optionValue);
      const optionKey = `${key}/${optionLabel}`;
      if (Object.keys(asRecord(optionNode.options)).length > 0) {
        children.push(
          ...normalizeVariantTree({ [optionLabel]: optionNode }, `${key}/`)
        );
        continue;
      }
      const file = normalizeDownloadFile(optionKey, optionNode, optionLabel);
      if (file) files.push(file);
    }

    if (files.length > 0 || children.length > 0) {
      groups.push({ key, label, files, groups: children });
    }
  }

  return groups;
}

/** Legacy flat shape: `telechargements: { dl1: {...}, dl2: {...} }`. */
function normalizeFlatDownloads(input: unknown): DownloadGroup[] {
  const root = asRecord(input);
  const byConsole = new Map<string, DownloadFile[]>();

  for (const [key, value] of Object.entries(root)) {
    const raw = asRecord(value);
    const file = normalizeDownloadFile(key, raw, key);
    if (!file) continue;
    const group = toStringOrNull(raw.console) ?? 'Téléchargements';
    const bucket = byConsole.get(group);
    if (bucket) bucket.push(file);
    else byConsole.set(group, [file]);
  }

  return [...byConsole.entries()].map(([label, files]) => ({
    key: label,
    label,
    files,
    groups: [],
  }));
}

function countFiles(groups: DownloadGroup[]): number {
  return groups.reduce(
    (total, group) => total + group.files.length + countFiles(group.groups),
    0
  );
}

function normalizeChangelog(input: unknown): ChangelogEntry[] {
  const parsed = Array.isArray(input) ? input : parseMaybeJson(input);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((entry) => {
      const raw = asRecord(entry);
      return {
        version: toText(raw.version),
        date: toStringOrNull(raw.date),
        changes: toStringArray(raw.changes),
      };
    })
    .filter((entry) => entry.version.length > 0 || entry.changes.length > 0);
}

function normalizeContributors(input: unknown): Contributor[] {
  const parsed = Array.isArray(input) ? input : parseMaybeJson(input);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((entry) => {
      const raw = asRecord(entry);
      return {
        name: toText(raw.name),
        avatar: toStringOrNull(raw.avatar),
        role: toStringOrNull(raw.role),
      };
    })
    .filter((entry) => entry.name.length > 0);
}

function normalizeSocials(input: unknown): Record<string, string> {
  const parsed = parseMaybeJson(input) ?? input;
  const raw = asRecord(parsed);
  const socials: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const url = toStringOrNull(value);
    if (url) socials[key] = url;
  }
  return socials;
}

export function normalizeResourceDetail(input: unknown): ResourceDetail {
  const raw = asRecord(input);
  const base = normalizeResource(raw);

  const variantGroups = normalizeVariantTree(parseMaybeJson(raw.variantes));
  const flatGroups = normalizeFlatDownloads(raw.telechargements);
  let downloadGroups = variantGroups.length > 0 ? variantGroups : flatGroups;

  // Some resources only expose a single `fichier` field.
  if (downloadGroups.length === 0) {
    const single = normalizeDownloadFile(
      'default',
      { fichier: raw.fichier, chemin: raw.fichier, version: raw.version },
      base.title
    );
    if (single) {
      downloadGroups = [
        { key: 'default', label: 'Téléchargement', files: [single], groups: [] },
      ];
    }
  }

  return {
    ...base,
    id: toText(raw.resource_id ?? raw.id),
    subcategory: toStringOrNull(raw.sous_categorie),
    family: toStringOrNull(raw.plateforme),
    tags: toStringArray(raw.tags),
    media: toStringArray(raw.media_rendu ?? raw.medias),
    youtubeUrl: toStringOrNull(raw.video_youtube),
    socials: normalizeSocials(raw.reseaux_sociaux),
    changelog: normalizeChangelog(raw.changelog),
    contributors: normalizeContributors(raw.contributeurs),
    requirements: toStringArray(raw.requis),
    downloadGroups,
    fileCount: countFiles(downloadGroups),
    sourceUrl: toStringOrNull(raw.github_repo_url ?? raw.source),
    updatedAt: toStringOrNull(raw.date_modification ?? raw.updated_at),
  };
}

export function normalizeGuide(input: unknown): Guide {
  const raw = asRecord(input);
  return {
    id: toText(raw.id),
    title: toText(raw.title),
    description: toText(raw.description),
    category: toStringOrNull(raw.category),
    platform: toStringOrNull(raw.platform),
    game: toStringOrNull(raw.game ?? raw.jeu),
    author: toStringOrNull(raw.author),
    image: toStringOrNull(raw.image),
    createdAt: toStringOrNull(raw.date_creation ?? raw.created_at),
  };
}

export function normalizeGuideDetail(input: unknown): GuideDetail {
  const raw = asRecord(input);
  const content = asRecord(raw.content);
  const rawChapters = Array.isArray(content.chapters) ? content.chapters : [];

  const chapters: GuideChapter[] = rawChapters.map((entry, index) => {
    const chapter = asRecord(entry);
    const body = asRecord(chapter.content);
    return {
      id: toStringOrNull(chapter.id) ?? `ch-${index + 1}`,
      title: toStringOrNull(chapter.title) ?? `Chapitre ${index + 1}`,
      content: Object.keys(body).length > 0 ? body : null,
    };
  });

  return {
    ...normalizeGuide(raw),
    authorPhoto: toStringOrNull(raw.authorPhoto),
    chapters,
  };
}

const SEARCH_HIT_TYPES: SearchHitType[] = [
  'resource',
  'guide',
  'forum_thread',
  'shop',
  'profile',
];

export function normalizeSearchHit(input: unknown): SearchHit | null {
  const raw = asRecord(input);
  const href = toStringOrNull(raw.href);
  const title = toStringOrNull(raw.title);
  if (!href || !title) return null;

  const rawType = toStringOrNull(raw.type) ?? '';
  const type = (SEARCH_HIT_TYPES as string[]).includes(rawType)
    ? (rawType as SearchHitType)
    : 'other';

  return {
    type,
    id: toText(raw.id),
    title,
    subtitle: toStringOrNull(raw.subtitle),
    href,
    iconUrl: toStringOrNull(raw.iconUrl),
    platform: toStringOrNull(raw.platform),
  };
}

export function normalizeHomeStats(input: unknown): HomeStats {
  const raw = asRecord(input);
  return {
    resources: toNumber(raw.resources),
    users: toNumber(raw.users),
    guides: toNumber(raw.guides),
    storage: toText(raw.storage),
    storageBytes: toNumber(raw.storageBytes),
  };
}

export function normalizePopularResource(input: unknown): PopularResource | null {
  const raw = asRecord(input);
  const title = toStringOrNull(raw.title);
  const href = toStringOrNull(raw.href);
  if (!title || !href) return null;
  return {
    title,
    image: toStringOrNull(raw.image),
    href,
    slug: href.split('/').filter(Boolean).pop() ?? href,
  };
}
