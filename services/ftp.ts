import { Buffer } from 'buffer';
import { Platform } from 'react-native';

import type { IListingElement } from 'ftp-ts';

/**
 * FTP / SFTP client for the LBXMB app.
 *
 * - FTP  → `ftp-ts` over `react-native-tcp-socket` (Metro `net`/`tls` shims)
 * - SFTP → `ssh2-sftp-client` (needs full Node crypto; consoles use FTP)
 */

export type TransferProtocol = 'ftp' | 'sftp';

export interface FtpCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
  protocol?: TransferProtocol;
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
  upload(remotePath: string, bytes: Uint8Array): Promise<void>;
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

function humanizeError(error: unknown, host: string, port: number): FtpError {
  if (error instanceof FtpError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('err_crypto') || lower.includes('crypto.') || lower.includes('indisponible')) {
    return new FtpError(
      'SFTP indisponible sur mobile (crypto Node manquante). Utilise FTP pour Multiman / webMAN / GoldHEN.'
    );
  }
  if (lower.includes('econnrefused') || lower.includes('connection refused') || lower.includes('refused connection')) {
    return new FtpError(
      `Rien n’écoute sur ${host}:${port}. Sur la console, démarre le serveur FTP et vérifie le port.`
    );
  }
  if (lower.includes('etimedout') || lower.includes('timed out') || lower.includes('timeout')) {
    return new FtpError(
      `Délai dépassé vers ${host}:${port}. Vérifie que le téléphone et la console sont sur le même Wi-Fi (pas de VPN).`
    );
  }
  if (
    lower.includes('enetunreach') ||
    lower.includes('ehostunreach') ||
    lower.includes('network is unreachable') ||
    lower.includes('no route')
  ) {
    return new FtpError(
      `Réseau injoignable (${host}). Vérifie l’IP locale et que le Wi-Fi n’isole pas les appareils.`
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
    throw new FtpError('Le transfert FTP/SFTP n’est pas disponible sur le web.');
  }
}

function listingToEntries(listing: Array<IListingElement | string>, basePath: string): FtpEntry[] {
  return listing
    .map((item) => {
      if (typeof item === 'string') {
        const name = item.trim();
        if (!name || name === '.' || name === '..') return null;
        return {
          name,
          path: joinRemotePath(basePath, name),
          isDirectory: false,
          size: 0,
        } satisfies FtpEntry;
      }
      const name = item.name?.trim();
      if (!name || name === '.' || name === '..') return null;
      const type = item.type || '-';
      return {
        name,
        path: joinRemotePath(basePath, name),
        isDirectory: type === 'd' || type === 'l',
        size: Number(item.size) || 0,
      } satisfies FtpEntry;
    })
    .filter((entry): entry is FtpEntry => entry !== null);
}

function setNetPreferredHost(host: string): void {
  try {
    // Must go through Metro's `net` alias so PASV rewrite uses the same module instance.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const net = require('net') as { setPreferredHost?: (h: string) => void };
    net.setPreferredHost?.(host);
  } catch {
    // Non-fatal if the shim is unavailable (e.g. tests).
  }
}

class FtpTsClient implements RemoteClient {
  private client: import('ftp-ts').default | null = null;
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly password: string;

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

    setNetPreferredHost(this.host);

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const FTP = require('ftp-ts').default as typeof import('ftp-ts').default;
      this.client = await FTP.connect({
        host: this.host,
        port: this.port,
        user: this.user,
        password: this.password || 'anonymous@',
        connTimeout: 12_000,
        pasvTimeout: 12_000,
        dataTimeout: 12_000,
        secure: false,
      });
      await this.client.binary().catch(() => undefined);
    } catch (error) {
      this.client = null;
      throw humanizeError(error, this.host, this.port);
    }
  }

  async list(path = '/'): Promise<FtpEntry[]> {
    if (!this.client) throw new FtpError('Pas de connexion FTP.');
    try {
      await this.client.cwd(path);
      const listing = await this.client.list();
      return listingToEntries(listing, path);
    } catch (error) {
      throw humanizeError(error, this.host, this.port);
    }
  }

  async upload(remotePath: string, bytes: Uint8Array): Promise<void> {
    if (!this.client) throw new FtpError('Pas de connexion FTP.');
    try {
      await this.client.put(Buffer.from(bytes), remotePath);
    } catch (error) {
      throw humanizeError(error, this.host, this.port);
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.client?.end();
    } finally {
      this.client = null;
      setNetPreferredHost('');
    }
  }
}

class SftpClientAdapter implements RemoteClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly password: string;

  constructor(credentials: FtpCredentials) {
    this.host = normalizeFtpHost(credentials.host);
    this.port = credentials.port;
    this.user = credentials.user.trim() || 'anonymous';
    this.password = credentials.password;
  }

  async connect(): Promise<void> {
    assertPlatform();
    if (!this.host) throw new FtpError('Indique l’adresse IP du serveur.');
    if (!Number.isFinite(this.port) || this.port < 1 || this.port > 65535) {
      throw new FtpError('Port SFTP invalide.');
    }

    setNetPreferredHost(this.host);

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SftpClient = require('ssh2-sftp-client') as new () => {
        connect: (opts: object) => Promise<void>;
        list: (path: string) => Promise<Array<{ name: string; type: string; size: number }>>;
        put: (input: Buffer, remote: string) => Promise<string>;
        end: () => Promise<void>;
      };
      this.client = new SftpClient();
      await this.client.connect({
        host: this.host,
        port: this.port,
        username: this.user,
        password: this.password,
        readyTimeout: 12_000,
      });
    } catch (error) {
      await this.disconnect().catch(() => undefined);
      throw humanizeError(error, this.host, this.port);
    }
  }

  async list(path = '/'): Promise<FtpEntry[]> {
    if (!this.client) throw new FtpError('Pas de connexion SFTP.');
    try {
      const listing = await this.client.list(path);
      return listing
        .map((item: { name: string; type: string; size: number }) => {
          const name = item.name?.trim();
          if (!name || name === '.' || name === '..') return null;
          return {
            name,
            path: joinRemotePath(path, name),
            isDirectory: item.type === 'd' || item.type === 'l',
            size: Number(item.size) || 0,
          } satisfies FtpEntry;
        })
        .filter((entry: FtpEntry | null): entry is FtpEntry => entry !== null);
    } catch (error) {
      throw humanizeError(error, this.host, this.port);
    }
  }

  async upload(remotePath: string, bytes: Uint8Array): Promise<void> {
    if (!this.client) throw new FtpError('Pas de connexion SFTP.');
    try {
      await this.client.put(Buffer.from(bytes), remotePath);
    } catch (error) {
      throw humanizeError(error, this.host, this.port);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client?.end();
    } finally {
      this.client = null;
      setNetPreferredHost('');
    }
  }
}

/** Facade kept as `FtpClient` for existing UI imports. */
export class FtpClient implements RemoteClient {
  private readonly inner: RemoteClient;
  readonly protocol: TransferProtocol;

  constructor(credentials: FtpCredentials) {
    this.protocol = credentials.protocol ?? 'ftp';
    this.inner =
      this.protocol === 'sftp' ? new SftpClientAdapter(credentials) : new FtpTsClient(credentials);
  }

  connect(): Promise<void> {
    return this.inner.connect();
  }

  list(path?: string): Promise<FtpEntry[]> {
    return this.inner.list(path);
  }

  upload(remotePath: string, bytes: Uint8Array): Promise<void> {
    return this.inner.upload(remotePath, bytes);
  }

  disconnect(): Promise<void> {
    return this.inner.disconnect();
  }
}

export function formatFtpSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}
