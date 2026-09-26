/**
 * PKG → console over LAN.
 * Protocol inspired by PKG Sender (Loopayeh) — MIT:
 * https://github.com/Loopayeh/pkg-sender
 */

export const PKG_SENDER_CREDIT = {
  name: 'PKG Sender',
  author: 'Loopayeh',
  url: 'https://github.com/Loopayeh/pkg-sender',
  license: 'MIT',
} as const;

export const FILE_SERVER_PORT = 9898;
export const RECEIVER_PORT = 12800;
export const BEACON_PORT = 12801;
export const BEACON_MAGIC = 'PKGSENDER';
export const PC_ANNOUNCE_PORT = 12802;
export const PC_ANNOUNCE_MAGIC = 'PKGSENDER-PC';

export type ConsoleMode = 'ps5' | 'rpi' | 'goldhen' | 'offline';

export interface PkgLocalFile {
  id: string;
  name: string;
  uri: string;
  size: number;
  kind: 'pkg' | 'image';
}

export interface PkgSendJob {
  id: string;
  fileId: string;
  fileName: string;
  localUri: string;
  size: number;
  kind: 'pkg' | 'image';
  status: 'pending' | 'running' | 'done' | 'error';
  error: string | null;
  /** Bytes served by the local HTTP server for this id. */
  served: number;
  createdAt: string;
}
