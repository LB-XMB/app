import { File, FileMode } from 'expo-file-system';
import TcpSocket from 'react-native-tcp-socket';

import { pkgDebug } from './pkgDebug';
import { FILE_SERVER_PORT } from './types';

type Registered = {
  uri: string;
  size: number;
  mime: string;
};

/**
 * Minimal LAN HTTP server with Range (206) support.
 * Protocol shape matches pkg-sender's RangeFileServer (Loopayeh, MIT).
 *
 * content:// (SAF) reads are serialized: opening several FileHandles on the
 * same Downloads document races and yields « Bad file descriptor ».
 * file:// stays concurrent.
 */
class HttpRangeServer {
  private server: TcpSocket.Server | null = null;
  private files = new Map<string, Registered>();
  private manifests = new Map<string, string>();
  private servedById = new Map<string, number>();
  private port = FILE_SERVER_PORT;
  private onServed: ((id: string, total: number) => void) | null = null;
  /** Chain of SAF reads — only one content:// handle open at a time. */
  private safTail: Promise<void> = Promise.resolve();

  setProgressListener(fn: ((id: string, total: number) => void) | null) {
    this.onServed = fn;
  }

  registerFile(id: string, uri: string, size: number, mime = 'application/octet-stream') {
    this.files.set(id, { uri, size, mime });
    this.servedById.set(id, 0);
  }

  registerManifest(id: string, json: string) {
    this.manifests.set(id, json);
  }

  revoke(id: string) {
    this.files.delete(id);
  }

  servedFor(id: string): number {
    return this.servedById.get(id) ?? 0;
  }

  async start(port = FILE_SERVER_PORT): Promise<number> {
    if (this.server) return this.port;
    this.port = port;

    return new Promise((resolve, reject) => {
      const server = TcpSocket.createServer((socket) => {
        void this.handleClient(socket);
      });

      server.on('error', (err) => {
        if (!this.server) reject(err);
      });

      server.listen({ port, host: '0.0.0.0', reuseAddress: true }, () => {
        this.server = server;
        resolve(port);
      });
    });
  }

  stop() {
    try {
      this.server?.close();
    } catch {
      // ignore
    }
    this.server = null;
  }

  get isRunning() {
    return this.server !== null;
  }

  private async handleClient(socket: TcpSocket.Socket) {
    let buffer = '';
    socket.on('data', (data) => {
      buffer += typeof data === 'string' ? data : data.toString('utf8');
      if (!buffer.includes('\r\n\r\n')) return;
      const headerEnd = buffer.indexOf('\r\n\r\n');
      const header = buffer.slice(0, headerEnd);
      buffer = '';
      void this.serveRequest(socket, header).catch((err) => {
        pkgDebug(`HTTP serve fail: ${err instanceof Error ? err.message : String(err)}`);
        try {
          socket.destroy();
        } catch {
          // ignore
        }
      });
    });
    socket.on('error', () => {
      try {
        socket.destroy();
      } catch {
        // ignore
      }
    });
  }

  private async serveRequest(socket: TcpSocket.Socket, header: string) {
    const first = header.split('\r\n')[0] ?? '';
    const match = /^(GET|HEAD)\s+(\S+)\s+HTTP\/1\.[01]/i.exec(first);
    if (!match) {
      await this.writeClose(socket, 'HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      return;
    }
    const method = match[1]!.toUpperCase();
    let path = match[2]!;
    try {
      path = decodeURIComponent(path.split('?')[0] ?? path);
    } catch {
      // keep raw
    }

    const rangeHeader = header
      .split('\r\n')
      .find((line) => line.toLowerCase().startsWith('range:'));

    if (path.startsWith('/json/') && path.endsWith('.json')) {
      const id = path.slice('/json/'.length, -'.json'.length);
      const json = this.manifests.get(id);
      if (!json) {
        await this.writeClose(socket, 'HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
        return;
      }
      const body = Buffer.from(json, 'utf8');
      const head =
        `HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\nConnection: close\r\n\r\n`;
      if (method === 'HEAD') {
        await this.writeClose(socket, head);
        return;
      }
      await this.writeClose(socket, head, body);
      return;
    }

    if (path === '/catalog') {
      const catalog = JSON.stringify(
        [...this.files.entries()].map(([id, f]) => ({
          id,
          title: id,
          size: f.size,
          format: f.mime.includes('pkg') ? 'pkg' : 'image',
          file: id,
        })),
      );
      const body = Buffer.from(catalog, 'utf8');
      const head =
        `HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n`;
      if (method === 'HEAD') {
        await this.writeClose(socket, head);
        return;
      }
      await this.writeClose(socket, head, body);
      return;
    }

    let id: string | null = null;
    if (path === '/pkg') id = 'pkg';
    else if (path.startsWith('/pkg/')) id = path.slice('/pkg/'.length);

    if (!id || !this.files.has(id)) {
      await this.writeClose(socket, 'HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
      return;
    }

    const file = this.files.get(id)!;
    let start = 0;
    let end = file.size - 1;
    let status = 200;

    if (rangeHeader) {
      const m = /bytes=(\d*)-(\d*)/i.exec(rangeHeader);
      if (m) {
        if (!m[1] && m[2]) {
          const suffix = Number(m[2]);
          if (Number.isFinite(suffix) && suffix > 0) {
            start = Math.max(0, file.size - suffix);
            end = file.size - 1;
            status = 206;
          }
        } else {
          if (m[1]) start = Number(m[1]);
          if (m[2]) end = Number(m[2]);
          if (!Number.isFinite(start)) start = 0;
          if (!Number.isFinite(end) || end >= file.size) end = file.size - 1;
          status = 206;
        }
      }
    }

    if (file.size <= 0) {
      await this.writeClose(socket, 'HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
      return;
    }

    if (start < 0 || end < start || start >= file.size) {
      await this.writeClose(
        socket,
        `HTTP/1.1 416 Range Not Satisfiable\r\nContent-Range: bytes */${file.size}\r\nContent-Length: 0\r\nAccept-Ranges: bytes\r\nConnection: close\r\n\r\n`,
      );
      return;
    }

    const length = end - start + 1;
    const statusLine = status === 206 ? 'HTTP/1.1 206 Partial Content' : 'HTTP/1.1 200 OK';
    let headers = `${statusLine}\r\n`;
    if (status === 206) {
      headers += `Content-Range: bytes ${start}-${end}/${file.size}\r\n`;
    }
    headers += `Content-Type: application/octet-stream\r\n`;
    headers += `Content-Length: ${length}\r\n`;
    headers += `Accept-Ranges: bytes\r\n`;
    headers += `Connection: close\r\n\r\n`;
    await this.writeBytes(socket, headers);

    if (method === 'HEAD') {
      socket.destroy();
      return;
    }

    await this.writeFileRange(socket, file.uri, start, end, id);
    socket.destroy();
  }

  private writeBytes(socket: TcpSocket.Socket, data: string | Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        socket.write(typeof data === 'string' ? data : data, undefined, (err?: Error) =>
          err ? reject(err) : resolve(),
        );
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private async writeClose(
    socket: TcpSocket.Socket,
    head: string,
    body?: Buffer,
  ): Promise<void> {
    try {
      if (body && body.byteLength > 0) {
        await this.writeBytes(socket, Buffer.concat([Buffer.from(head, 'utf8'), body]));
      } else {
        await this.writeBytes(socket, head);
      }
    } finally {
      try {
        socket.destroy();
      } catch {
        // ignore
      }
    }
  }

  /** Run fn alone if uri is content:// (SAF cannot share handles safely). */
  private async withSafLock<T>(uri: string, fn: () => Promise<T>): Promise<T> {
    if (!uri.startsWith('content://')) return fn();

    let release!: () => void;
    const next = new Promise<void>((r) => {
      release = r;
    });
    const prev = this.safTail;
    this.safTail = next;
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  private async writeFileRange(
    socket: TcpSocket.Socket,
    uri: string,
    start: number,
    end: number,
    id: string,
  ) {
    await this.withSafLock(uri, () => this.writeFileRangeUnlocked(socket, uri, start, end, id));
  }

  private async writeFileRangeUnlocked(
    socket: TcpSocket.Socket,
    uri: string,
    start: number,
    end: number,
    id: string,
  ) {
    const chunkSize = 256 * 1024;
    let offset = start;
    let reopenLeft = 3;

    while (offset <= end) {
      const file = new File(uri);
      let handle: ReturnType<File['open']> | null = null;
      try {
        handle = file.open(FileMode.ReadOnly);
        handle.offset = offset;
        if (handle.offset !== null && handle.offset !== offset) {
          throw new Error(
            `Seek fichier impossible (offset ${handle.offset} ≠ ${offset}) — URI non seekable.`,
          );
        }

        while (offset <= end) {
          const toRead = Math.min(chunkSize, end - offset + 1);
          let buf: Uint8Array;
          try {
            buf = handle.readBytes(toRead);
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            if (/Bad file descriptor|readBytes|file handle/i.test(msg) && reopenLeft > 0) {
              reopenLeft -= 1;
              break;
            }
            throw error;
          }
          if (buf.byteLength === 0) return;
          await this.writeBytes(socket, Buffer.from(buf));
          const served = (this.servedById.get(id) ?? 0) + buf.byteLength;
          this.servedById.set(id, served);
          this.onServed?.(id, served);
          offset += buf.byteLength;
          reopenLeft = 3;
        }
      } finally {
        if (handle) {
          try {
            handle.close();
          } catch {
            // ignore
          }
        }
      }
    }
  }
}

export const httpRangeServer = new HttpRangeServer();
