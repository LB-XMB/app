import { Platform } from 'react-native';

/**
 * Minimal FTP client aimed at game consoles (PS3 / PS4 / PS5 Multiman, etc.).
 *
 * Relies on `react-native-tcp-socket`, which is only available in a native
 * build. Expo Go and the web export cannot open a raw TCP socket.
 */

export interface FtpCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
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

type TcpSocket = {
  write: (data: string | Uint8Array, encoding?: string, callback?: () => void) => void;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  once: (event: string, listener: (...args: unknown[]) => void) => void;
  destroy: () => void;
  setEncoding?: (encoding: string) => void;
};

type TcpModule = {
  createConnection: (
    options: { host: string; port: number },
    callback?: () => void
  ) => TcpSocket;
};

function loadTcp(): TcpModule {
  if (Platform.OS === 'web') {
    throw new FtpError('Le FTP console n’est pas disponible sur le web.');
  }
  try {
    // Optional native module, linked after `npm install` + prebuild.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-tcp-socket') as TcpModule;
  } catch {
    throw new FtpError(
      'Le module FTP natif n’est pas installé. Relance un build natif après npm install.'
    );
  }
}

function joinFtpPath(base: string, name: string): string {
  if (base.endsWith('/')) return `${base}${name}`;
  return `${base}/${name}`;
}

function parentFtpPath(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  const index = trimmed.lastIndexOf('/');
  if (index <= 0) return '/';
  return trimmed.slice(0, index) || '/';
}

export class FtpClient {
  private control: TcpSocket | null = null;
  private buffer = '';
  private waiters: Array<{
    expect: RegExp;
    resolve: (line: string) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(private readonly credentials: FtpCredentials) {}

  async connect(): Promise<void> {
    const tcp = loadTcp();
    await new Promise<void>((resolve, reject) => {
      const socket = tcp.createConnection(
        { host: this.credentials.host, port: this.credentials.port },
        () => resolve()
      );
      this.control = socket;
      socket.setEncoding?.('utf8');
      socket.on('data', (chunk) => this.onData(String(chunk)));
      socket.on('error', (error) => {
        this.failAll(error instanceof Error ? error : new FtpError(String(error)));
        reject(error instanceof Error ? error : new FtpError(String(error)));
      });
      socket.on('close', () => {
        this.failAll(new FtpError('Connexion FTP fermée.'));
        this.control = null;
      });
    });

    await this.expect(/^220/);
    await this.send(`USER ${this.credentials.user}`, /^331|^230/);
    if (!/230/.test(this.buffer)) {
      await this.send(`PASS ${this.credentials.password}`, /^230/);
    }
    await this.send('TYPE I', /^200/);
    await this.send('OPTS UTF8 ON', /^200|^202|^500|^502/).catch(() => undefined);
  }

  async list(path = '/'): Promise<FtpEntry[]> {
    await this.send(`CWD ${path}`, /^250/);
    const { host, port, close } = await this.openDataConnection();
    const listingPromise = this.readData(host, port);
    await this.send('LIST', /^150|^125/);
    const raw = await listingPromise;
    await this.expect(/^226|^250/);
    close();
    return parseList(raw, path);
  }

  async upload(remotePath: string, bytes: Uint8Array): Promise<void> {
    const directory = parentFtpPath(remotePath);
    const fileName = remotePath.split('/').filter(Boolean).pop();
    if (!fileName) throw new FtpError('Chemin distant invalide.');

    await this.send(`CWD ${directory}`, /^250/);
    const { host, port, close } = await this.openDataConnection();
    const written = this.writeData(host, port, bytes);
    await this.send(`STOR ${fileName}`, /^150|^125/);
    await written;
    await this.expect(/^226/);
    close();
  }

  async disconnect(): Promise<void> {
    try {
      if (this.control) await this.send('QUIT', /^221/).catch(() => undefined);
    } finally {
      this.control?.destroy();
      this.control = null;
    }
  }

  private async openDataConnection(): Promise<{
    host: string;
    port: number;
    close: () => void;
  }> {
    const reply = await this.send('PASV', /^227/);
    const match = reply.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
    if (!match) throw new FtpError('Réponse PASV illisible.');
    const host = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
    const port = Number(match[5]) * 256 + Number(match[6]);
    return {
      host,
      port,
      close: () => undefined,
    };
  }

  private readData(host: string, port: number): Promise<string> {
    const tcp = loadTcp();
    return new Promise((resolve, reject) => {
      const chunks: string[] = [];
      const socket = tcp.createConnection({ host, port }, () => undefined);
      socket.setEncoding?.('utf8');
      socket.on('data', (chunk) => chunks.push(String(chunk)));
      socket.on('error', (error) =>
        reject(error instanceof Error ? error : new FtpError(String(error)))
      );
      socket.on('close', () => resolve(chunks.join('')));
    });
  }

  private writeData(host: string, port: number, bytes: Uint8Array): Promise<void> {
    const tcp = loadTcp();
    return new Promise((resolve, reject) => {
      const socket = tcp.createConnection({ host, port }, () => {
        socket.write(bytes, undefined, () => {
          socket.destroy();
          resolve();
        });
      });
      socket.on('error', (error) =>
        reject(error instanceof Error ? error : new FtpError(String(error)))
      );
    });
  }

  private send(command: string, expect: RegExp): Promise<string> {
    if (!this.control) throw new FtpError('Pas de connexion FTP.');
    this.control.write(`${command}\r\n`);
    return this.expect(expect);
  }

  private expect(expect: RegExp): Promise<string> {
    return new Promise((resolve, reject) => {
      this.waiters.push({ expect, resolve, reject });
      this.flushWaiters();
    });
  }

  private onData(chunk: string) {
    this.buffer += chunk;
    this.flushWaiters();
  }

  private flushWaiters() {
    while (this.waiters.length > 0) {
      const next = this.waiters[0];
      if (!next) return;
      const lines = this.buffer.split(/\r?\n/).filter(Boolean);
      const hit = lines.find((line) => next.expect.test(line));
      if (!hit) return;
      // Drop everything up to and including the matched reply.
      const index = this.buffer.indexOf(hit);
      this.buffer = this.buffer.slice(index + hit.length).replace(/^\r?\n/, '');
      this.waiters.shift();
      if (/^[45]\d\d/.test(hit)) {
        next.reject(new FtpError(hit));
      } else {
        next.resolve(hit);
      }
    }
  }

  private failAll(error: Error) {
    const pending = this.waiters.splice(0);
    for (const waiter of pending) waiter.reject(error);
  }
}

function parseList(raw: string, basePath: string): FtpEntry[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // UNIX LIST: drwxr-xr-x 1 user group size mon day time name
      const unix = line.match(
        /^([\-dl])[rwx\-]{9}\s+\d+\s+\S+\s+\S+\s+(\d+)\s+\S+\s+\d+\s+[\d:]+\s+(.+)$/
      );
      if (unix) {
        const name = unix[3]!;
        if (name === '.' || name === '..') return null;
        return {
          name,
          path: joinFtpPath(basePath, name),
          isDirectory: unix[1] === 'd',
          size: Number(unix[2]) || 0,
        } satisfies FtpEntry;
      }

      // DOS LIST: 01-01-80 12:00AM <DIR> name
      const dos = line.match(/^\S+\s+\S+\s+(<DIR>|\d+)\s+(.+)$/i);
      if (dos) {
        const name = dos[2]!;
        if (name === '.' || name === '..') return null;
        const isDirectory = dos[1]!.toUpperCase() === '<DIR>';
        return {
          name,
          path: joinFtpPath(basePath, name),
          isDirectory,
          size: isDirectory ? 0 : Number(dos[1]) || 0,
        } satisfies FtpEntry;
      }

      return null;
    })
    .filter((entry): entry is FtpEntry => entry !== null);
}

export function formatFtpSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}
