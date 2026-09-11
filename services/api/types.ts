/** Domain types exposed to the UI, after normalisation of the API payloads. */

export type SortOrder = 'recent' | 'popular';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string | null;
  /** Primary console, e.g. `PS4`. */
  platform: string | null;
  platforms: string[];
  version: string | null;
  size: string | null;
  downloads: number;
  /** Relative uploads path; use `uploadUrl()` to build the image URL. */
  logo: string | null;
  logoVersion: string | null;
  iconFormat: string | null;
  author: string | null;
  authorAvatar: string | null;
  game: string | null;
  createdAt: string | null;
}

export interface ResourcePage {
  items: Resource[];
  pagination: Pagination;
}

export interface ResourceFilters {
  platforms: string[];
  categories: string[];
}

/** A downloadable file, leaf of the download tree. */
export interface DownloadFile {
  /** Stable identifier within a resource. */
  key: string;
  label: string;
  fileName: string;
  /** Relative uploads path, when the file is hosted by lbxmb.fr. */
  path: string | null;
  /** Set instead of `path` when the download points elsewhere. */
  externalUrl: string | null;
  version: string | null;
  description: string | null;
  sizeBytes: number | null;
  sha256: string | null;
}

/** Group of downloads, e.g. one per console or per file kind. */
export interface DownloadGroup {
  key: string;
  label: string;
  files: DownloadFile[];
  groups: DownloadGroup[];
}

export interface ChangelogEntry {
  version: string;
  date: string | null;
  changes: string[];
}

export interface Contributor {
  name: string;
  avatar: string | null;
  role: string | null;
}

export interface ResourceDetail extends Resource {
  subcategory: string | null;
  family: string | null;
  tags: string[];
  /** Relative uploads paths of the screenshots. */
  media: string[];
  youtubeUrl: string | null;
  socials: Record<string, string>;
  changelog: ChangelogEntry[];
  contributors: Contributor[];
  requirements: string[];
  /** Normalised download tree, whatever shape the API used. */
  downloadGroups: DownloadGroup[];
  /** Total number of downloadable files, across all groups. */
  fileCount: number;
  sourceUrl: string | null;
  updatedAt: string | null;
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  category: string | null;
  platform: string | null;
  game: string | null;
  author: string | null;
  /** Website-relative image path. */
  image: string | null;
  createdAt: string | null;
}

/** Subset of the TipTap document model returned by the guides endpoint. */
export interface RichTextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface RichTextNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: RichTextMark[];
  content?: RichTextNode[];
}

export interface GuideChapter {
  id: string;
  title: string;
  content: RichTextNode | null;
}

export interface GuideDetail extends Guide {
  authorPhoto: string | null;
  chapters: GuideChapter[];
}

export type SearchHitType = 'resource' | 'guide' | 'forum_thread' | 'shop' | 'profile' | 'other';

export interface SearchHit {
  type: SearchHitType;
  id: string;
  title: string;
  subtitle: string | null;
  /** Website-relative path of the hit. */
  href: string;
  iconUrl: string | null;
  platform: string | null;
}

export interface HomeStats {
  resources: number;
  users: number;
  guides: number;
  storage: string;
  storageBytes: number;
}

export interface CommunityStats {
  members: number;
  threads: number;
  posts: number;
}

export interface Creator {
  userId: string;
  pseudo: string;
  /** Website-relative avatar path. */
  photo: string | null;
}

export interface PopularResource {
  title: string;
  /** Website-relative image path. */
  image: string | null;
  /** Website path, e.g. `/ressources/rufus`. */
  href: string;
  /** Slug extracted from `href`, usable with `/api/resources/{id}`. */
  slug: string;
}

export interface HomeAggregate {
  stats: HomeStats;
  creators: Creator[];
  popularResources: PopularResource[];
}
