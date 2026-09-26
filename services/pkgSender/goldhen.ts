import { Buffer } from 'buffer';
import TcpSocket from 'react-native-tcp-socket';

import { loadPs4DpiPayload } from './ps4DpiPayload';
import { pkgDebug } from './pkgDebug';

const MARKER = new Uint8Array([0xb4, 0xb4, 0xb4, 0xb4, 0xb4, 0xb4]);

function indexOf(hay: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function parseIpv4(ip: string): Uint8Array {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    throw new Error(`IP PC invalide pour GoldHEN : ${ip}`);
  }
  return new Uint8Array(parts);
}

function u32le(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

function blob(buf: Buffer): Buffer {
  return Buffer.concat([u32le(buf.length), buf]);
}

async function connectPayloadPort(ip: string): Promise<TcpSocket.Socket | null> {
  for (const port of [9090, 9021, 9020]) {
    try {
      const sock = await new Promise<TcpSocket.Socket>((resolve, reject) => {
        const s = TcpSocket.createConnection({ host: ip, port }, () => resolve(s));
        s.setTimeout(3000);
        s.on('timeout', () => {
          try {
            s.destroy();
          } catch {
            // ignore
          }
          reject(new Error('timeout'));
        });
        s.on('error', reject);
      });
      return sock;
    } catch {
      // next port
    }
  }
  return null;
}

function writeAll(socket: TcpSocket.Socket, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.write(data, undefined, (err?: Error) => (err ? reject(err) : resolve()));
  });
}

/**
 * GoldHEN install path from pkg-sender Ps4Installer (Loopayeh, MIT):
 * patch payload with PC IP + callback port, inject via binloader, answer callback.
 */
export async function pushGoldHen(opts: {
  consoleIp: string;
  lanIp: string;
  /** Manifest URL (not raw PKG). */
  manifestUrl: string;
  title: string;
  /** Full CONTENT_ID (e.g. UP9000-CUSA…_00-…) — required by BGFT. */
  contentId?: string;
  titleId?: string;
  packageSize: number;
  contentType?: string;
}): Promise<{ ok: boolean; reply: string }> {
  const payload = loadPs4DpiPayload();
  const marker = indexOf(payload, MARKER);
  if (marker < 0) return { ok: false, reply: 'Marqueur payload GoldHEN introuvable.' };

  let acceptResolve: ((s: TcpSocket.Socket) => void) | null = null;
  const accepted = new Promise<TcpSocket.Socket>((resolve, reject) => {
    acceptResolve = resolve;
    setTimeout(() => reject(new Error('timeout')), 15_000);
  });

  const cbServer = TcpSocket.createServer((client) => {
    acceptResolve?.(client);
  });

  let cbPort = 0;
  try {
    await new Promise<void>((resolve, reject) => {
      cbServer.listen({ port: 0, host: '0.0.0.0', reuseAddress: true }, () => {
        const addr = cbServer.address();
        if (addr && typeof addr === 'object' && 'port' in addr) cbPort = addr.port;
        resolve();
      });
      cbServer.on('error', reject);
    });
  } catch (error) {
    return {
      ok: false,
      reply: error instanceof Error ? error.message : 'Listener PC impossible',
    };
  }

  const patched = new Uint8Array(payload);
  try {
    patched.set(parseIpv4(opts.lanIp), marker);
  } catch (error) {
    cbServer.close();
    return {
      ok: false,
      reply: error instanceof Error ? error.message : 'IP invalide',
    };
  }
  // Port big-endian ushort at marker+4 (pkg-sender)
  patched[marker + 4] = (cbPort >> 8) & 0xff;
  patched[marker + 5] = cbPort & 0xff;
  pkgDebug(`GoldHEN patch lan=${opts.lanIp} cbPort=${cbPort}`);

  let injected = false;
  let lastErr = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ps = await connectPayloadPort(opts.consoleIp);
    if (!ps) {
      lastErr = 'Binloader fermé sur 9090/9021/9020 — active GoldHEN Payload Server';
      pkgDebug(`binloader try ${attempt}/3 fail`);
    } else {
      try {
        await writeAll(ps, Buffer.from(patched));
        injected = true;
        pkgDebug(`payload injecté try ${attempt}`);
        try {
          ps.destroy();
        } catch {
          // ignore
        }
        break;
      } catch (error) {
        lastErr = error instanceof Error ? error.message : 'Envoi payload échoué';
        pkgDebug(`payload send fail: ${lastErr}`);
        try {
          ps.destroy();
        } catch {
          // ignore
        }
      }
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
  }

  if (!injected) {
    cbServer.close();
    return { ok: false, reply: lastErr };
  }

  let cb: TcpSocket.Socket;
  try {
    pkgDebug('attente callback console…');
    cb = await accepted;
    pkgDebug('callback reçu');
  } catch {
    cbServer.close();
    return {
      ok: false,
      reply: 'Payload envoyé mais la console n’a pas rappelé (IP / firewall ?)',
    };
  }

  try {
    let cat = (opts.contentType ?? '').trim().toUpperCase();
    if (!cat.startsWith('PS4')) cat = cat.length === 0 ? 'PS4GD' : `PS4${cat}`;
    pkgDebug(
      `callback packet type=${cat} cid=${(opts.contentId ?? '').slice(0, 36)} size=${opts.packageSize} url=${opts.manifestUrl}`
    );

    const urlB = Buffer.from(opts.manifestUrl, 'utf8');
    const nameB = Buffer.from(opts.title || opts.contentId || opts.titleId || 'PKG', 'utf8');
    // DPI / pkg-sender send CONTENT_ID here — TitleId alone causes BGFT errors.
    const idB = Buffer.from(opts.contentId ?? '', 'utf8');
    const typeB = Buffer.from(cat, 'utf8');
    const sizeB = Buffer.alloc(8);
    // package size as little-endian int64 low/high — pkg-sender uses BitConverter on long (8 bytes LE)
    sizeB.writeBigUInt64LE(BigInt(opts.packageSize), 0);

    const packet = Buffer.concat([
      u32le(1),
      blob(urlB),
      blob(nameB),
      blob(idB),
      blob(typeB),
      sizeB,
      u32le(0), // no icon
    ]);

    await writeAll(cb, packet);
    cb.destroy();
    cbServer.close();
    return { ok: true, reply: 'Package Sent via GoldHEN' };
  } catch (error) {
    try {
      cb.destroy();
    } catch {
      // ignore
    }
    cbServer.close();
    return {
      ok: false,
      reply: error instanceof Error ? error.message : 'Callback GoldHEN échoué',
    };
  }
}
