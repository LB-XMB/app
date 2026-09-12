import { Buffer } from 'buffer';
import { Platform } from 'react-native';

/**
 * Ensure Node globals exist before ftp-ts / ssh2 pull in stream/net.
 * Loaded first from index.js.
 */
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
    platform: Platform.OS,
    version: '',
    versions: {},
    nextTick: (cb, ...args) => queueMicrotask(() => cb(...args)),
  };
} else {
  if (!globalThis.process.platform) globalThis.process.platform = Platform.OS;
  if (!globalThis.process.nextTick) {
    globalThis.process.nextTick = (cb, ...args) => queueMicrotask(() => cb(...args));
  }
}
