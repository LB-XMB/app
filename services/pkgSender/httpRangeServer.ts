import { File, FileMode } from 'expo-file-system';
import TcpSocket from 'react-native-tcp-socket';

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
 * Reads are streamed via FileHandle (seek + chunked readBytes) — never
 * `File.slice` / `bytesSync`, which load the whole multi‑GB PKG into RAM.
 */
class HttpRangeServer {
  private server: TcpSocket.Server | null = null;
  private files = new Map<string, Registered>();
  private manifests = new Map<string, string>();
  private servedById = new Map<string, number>();
  private port = FILE_SERVER_PORT;
  private onServed: ((id: string, total: number) => void) | null = null;

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
      void this.serveRequest(socket, header).catch(() => {
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
      this.writeRaw(socket, 'HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      socket.destroy();
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
        this.writeRaw(socket, 'HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }
      const body = Buffer.from(json, 'utf8');
      this.writeRaw(
        socket,
        `HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n`,
      );
      if (method !== 'HEAD') socket.write(body);
      socket.destroy();
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
      this.writeRaw(
        socket,
        `HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n`,
      );
      if (method !== 'HEAD') socket.write(body);
      socket.destroy();
      return;
    }

    let id: string | null = null;
    if (path === '/pkg') id = 'pkg';
    else if (path.startsWith('/pkg/')) id = path.slice('/pkg/'.length);

    if (!id || !this.files.has(id)) {
      this.writeRaw(socket, 'HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    const file = this.files.get(id)!;
    let start = 0;
    let end = file.size - 1;
    let status = 200;

    if (rangeHeader) {
      const m = /bytes=(\d*)-(\d*)/i.exec(rangeHeader);
      if (m) {
        // Suffix form: bytes=-N (last N bytes) — used by some BGFT clients.
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
      this.writeRaw(socket, 'HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    if (start < 0 || end < start || start >= file.size) {
      this.writeRaw(
        socket,
        `HTTP/1.1 416 Range Not Satisfiable\r\nContent-Range: bytes */${file.size}\r\nConnection: close\r\n\r\n`,
      );
      socket.destroy();
      return;
    }

    const length = end - start + 1;
    const statusLine = status === 206 ? 'HTTP/1.1 206 Partial Content' : 'HTTP/1.1 200 OK';
    const extra =
      status === 206 ? `Content-Range: bytes ${start}-${end}/${file.size}\r\n` : '';
    this.writeRaw(
      socket,
      `${statusLine}\r\nContent-Type: ${file.mime}\r\nAccept-Ranges: bytes\r\nContent-Length: ${length}\r\n${extra}Access-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n`,
    );

    if (method === 'HEAD') {
      socket.destroy();
      return;
    }

    await this.writeFileRange(socket, file.uri, start, end, id);
    socket.destroy();
  }

  private writeRaw(socket: TcpSocket.Socket, text: string) {
    socket.write(text);
  }

  private async writeFileRange(
    socket: TcpSocket.Socket,
    uri: string,
    start: number,
    end: number,
    id: string,
  ) {
    const file = new File(uri);
    // ReadOnly works for file:// and content:// (SAF) without loading the whole PKG.
    const handle = file.open(FileMode.ReadOnly);
    try {
      handle.offset = start;
      const chunkSize = 512 * 1024;
      let offset = start;
      while (offset <= end) {
        const toRead = Math.min(chunkSize, end - offset + 1);
        const buf = handle.readBytes(toRead);
        if (buf.byteLength === 0) break;
        await new Promise<void>((resolve, reject) => {
          socket.write(Buffer.from(buf), undefined, (err?: Error) =>
            err ? reject(err) : resolve(),
          );
        });
        const served = (this.servedById.get(id) ?? 0) + buf.byteLength;
        this.servedById.set(id, served);
        this.onServed?.(id, served);
        offset += buf.byteLength;
      }
    } finally {
      try {
        handle.close();
      } catch {
        // ignore
      }
    }
  }
}

export const httpRangeServer = new HttpRangeServer();
