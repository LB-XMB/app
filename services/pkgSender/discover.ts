import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import dgram from 'react-native-udp';

import { BEACON_MAGIC, BEACON_PORT, PC_ANNOUNCE_MAGIC, PC_ANNOUNCE_PORT } from './types';

export interface DiscoveredConsole {
  ip: string;
  source: 'beacon' | 'manual';
}

/**
 * Listen for PS5 receiver UDP beacons (`PKGSENDER v1` on :12801).
 * Inspired by pkg-sender NetDiscovery (Loopayeh, MIT).
 */
export function listenForBeacons(
  durationMs = 4000,
): Promise<DiscoveredConsole[]> {
  if (Platform.OS === 'web') return Promise.resolve([]);

  return new Promise((resolve) => {
    const found = new Map<string, DiscoveredConsole>();
    let socket: ReturnType<typeof dgram.createSocket> | null = null;

    const finish = () => {
      try {
        socket?.close();
      } catch {
        // ignore
      }
      resolve([...found.values()]);
    };

    try {
      socket = dgram.createSocket({ type: 'udp4', reusePort: true });
      socket.on('message', (msg, rinfo) => {
        const text = typeof msg === 'string' ? msg : Buffer.from(msg).toString('ascii');
        if (!text.startsWith(BEACON_MAGIC)) return;
        const ip = rinfo.address;
        if (!ip || ip.startsWith('127.') || ip.startsWith('169.254.')) return;
        found.set(ip, { ip, source: 'beacon' });
      });
      socket.on('error', () => finish());
      socket.bind(BEACON_PORT);
      setTimeout(finish, durationMs);
    } catch {
      finish();
    }
  });
}

/** Broadcast PC catalog endpoint so the console browser can find us. */
export function startPcAnnounce(
  lanIp: string,
  catalogPort: number,
): { stop: () => void } {
  if (Platform.OS === 'web') return { stop: () => undefined };

  let timer: ReturnType<typeof setInterval> | null = null;
  let socket: ReturnType<typeof dgram.createSocket> | null = null;

  try {
    socket = dgram.createSocket({ type: 'udp4', reusePort: true });
    socket.bind(0, () => {
      try {
        socket?.setBroadcast(true);
      } catch {
        // ignore
      }
    });
    const payload = Buffer.from(`${PC_ANNOUNCE_MAGIC} ${lanIp}:${catalogPort}`);
    timer = setInterval(() => {
      try {
        socket?.send(payload, 0, payload.length, PC_ANNOUNCE_PORT, '255.255.255.255');
      } catch {
        // ignore
      }
    }, 3000);
  } catch {
    // UDP unavailable
  }

  return {
    stop: () => {
      if (timer) clearInterval(timer);
      try {
        socket?.close();
      } catch {
        // ignore
      }
    },
  };
}
