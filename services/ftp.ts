import { Platform } from 'react-native';
import FtpService, {
  addProgressListener,
  type FileInfo,
  type ProgressInfo,
} from '@anttech/react-native-ftp';

/**
 * FTP client for the LBXMB app via `@anttech/react-native-ftp` (native).
 * Consoles (Multiman / webMAN / GoldHEN) expose plain FTP — SFTP is not supported.
 */

export type TransferProtocol = 'ftp';

export interface FtpCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
  /** Kept for persisted profiles; always treated as FTP. */
  protocol?: TransferProtocol | 'sftp';
}

export interface FtpEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
}

export class FtpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FtpError';
  }
}

export interface RemoteClient {
  connect(): Promise<void>;
  list(path?: string): Promise<FtpEntry[]>;
  /** Upload a local file path (file:// URI or absolute path) to remotePath. */
  uploadFile(localUriOrPath: string, remotePath: string): Promise<void>;
  disconnect(): Promise<void>;
}

/** Strip scheme / path / brackets so sockets always get a bare host. */
export function normalizeFtpHost(raw: string): string {
  let host = raw.trim();
  host = host.replace(/^https?:\/\//i, '');
  host = host.replace(/\/.*$/, '');
  host = host.replace(/^\[|\]$/g, '');
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(host)) {
    host = host.split(':')[0]!;
  }
  return host;
}

function joinRemotePath(base: string, name: string): string {
  if (base.endsWith('/')) return `${base}${name}`;
  return `${base}/${name}`;
}

/** Native FTP modules expect a filesystem path, not a `file://` URI. */
export function toNativePath(uriOrPath: string): string {
  if (uriOrPath.startsWith('file://')) {
    try {
      return decodeURIComponent(uriOrPath.replace(/^file:\/\//, ''));
    } catch {
      return uriOrPath.replace(/^file:\/\//, '');
    }
  }
  return uriOrPath;
}

function humanizeError(error: unknown, host: string, port: number): FtpError {
  if (error instanceof FtpError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('linking') || lower.includes("doesn't seem to be linked")) {
    return new FtpError(
      'Module FTP natif absent. Rebuild l’app (pas Expo Go) après installation de @anttech/react-native-ftp.',
    );
  }
  if (lower.includes('econnrefused') || lower.includes('connection refused') || lower.includes('refused')) {
    return new FtpError(
      `Rien n’écoute sur ${host}:${port}. Sur la console, démarre le serveur FTP et vérifie le port.`,
    );
  }
  if (lower.includes('etimedout') || lower.includes('timed out') || lower.includes('timeout')) {
    return new FtpError(
      `Délai dépassé vers ${host}:${port}. Vérifie que le téléphone et la console sont sur le même Wi-Fi (pas de VPN).`,
    );
  }
  if (
    lower.includes('enetunreach') ||
    lower.includes('ehostunreach') ||
    lower.includes('network is unreachable') ||
    lower.includes('no route')
  ) {
    return new FtpError(
      `Réseau injoignable (${host}). Vérifie l’IP locale et que le Wi-Fi n’isole pas les appareils.`,
    );
  }
  if (lower.includes('enotfound') || lower.includes('getaddrinfo') || lower.includes('address lookup')) {
    return new FtpError(`Adresse invalide : « ${host} ». Utilise une IP du type 192.168.x.x.`);
  }
  if (lower.includes('login') || lower.includes('authentication') || lower.includes('530')) {
    return new FtpError('Authentification refusée. Vérifie utilisateur / mot de passe.');
  }

  return new FtpError(message);
}

function assertPlatform(): void {
  if (Platform.OS === 'web') {
    throw new FtpError('Le transfert FTP n’est pas disponible sur le web.');
  }
}

function isDirectoryType(type: FileInfo['type']): boolean {
  return type === 'directory' || type === 'dir';
}

function listingToEntries(listing: FileInfo[], basePath: string): FtpEntry[] {
  return listing
    .map((item) => {
      const name = item.name?.trim();
      if (!name || name === '.' || name === '..') return null;
      return {
        name,
        path: joinRemotePath(basePath, name),
        isDirectory: isDirectoryType(item.type) || item.type === 'link',
        size: Number(item.size) || 0,
      } satisfies FtpEntry;
    })
    .filter((entry): entry is FtpEntry => entry !== null);
}

/** Facade kept as `FtpClient` for existing UI imports. */
export class FtpClient implements RemoteClient {
  private connected = false;
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly password: string;
  readonly protocol: TransferProtocol = 'ftp';

  constructor(credentials: FtpCredentials) {
    this.host = normalizeFtpHost(credentials.host);
    this.port = credentials.port;
    this.user = credentials.user.trim() || 'anonymous';
    this.password = credentials.password;
  }

  async connect(): Promise<void> {
    assertPlatform();
    if (!this.host) throw new FtpError('Indique l’adresse IP de ta console.');
    if (!Number.isFinite(this.port) || this.port < 1 || this.port > 65535) {
      throw new FtpError('Port FTP invalide.');
    }

    try {
      await FtpService.setup(this.host, this.port, this.user, this.password || 'anonymous@');
      this.connected = true;
    } catch (error) {
      this.connected = false;
      throw humanizeError(error, this.host, this.port);
    }
  }

  async list(path = '/'): Promise<FtpEntry[]> {
    if (!this.connected) throw new FtpError('Pas de connexion FTP.');
    try {
      const listing = await FtpService.listFiles(path);
      return listingToEntries(listing ?? [], path);
    } catch (error) {
      throw humanizeError(error, this.host, this.port);
    }
  }

  async uploadFile(localUriOrPath: string, remotePath: string): Promise<void> {
    if (!this.connected) throw new FtpError('Pas de connexion FTP.');
    try {
      await FtpService.uploadFile(toNativePath(localUriOrPath), remotePath);
    } catch (error) {
      throw humanizeError(error, this.host, this.port);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }
}

export function formatFtpSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

export { addProgressListener };
export type { ProgressInfo };
