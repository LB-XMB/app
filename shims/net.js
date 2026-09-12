'use strict';

/**
 * Node `net` → react-native-tcp-socket, with console-friendly tweaks:
 * - Prefer Wi-Fi on Android (avoid cellular / IPv6 bind).
 * - Rewrite PASV hosts 0.0.0.0 / 127.0.0.1 to the control host.
 */

const TcpSocket = require('react-native-tcp-socket');
const { Platform } = require('react-native');

/** @type {string | null} */
let preferredHost = null;

function setPreferredHost(host) {
  preferredHost = host && String(host).trim() ? String(host).trim() : null;
}

function rewriteHost(host) {
  if (!host || !preferredHost) return host;
  if (host === '0.0.0.0' || host === '127.0.0.1' || host.startsWith('0.')) {
    return preferredHost;
  }
  return host;
}

function normalizeOptions(options) {
  if (typeof options !== 'object' || options === null) return options;
  const next = { ...options };
  if (next.host) next.host = rewriteHost(next.host);
  if (Platform.OS === 'android' && next.interface == null) {
    next.interface = 'wifi';
  }
  if (next.connectTimeout == null && next.timeout == null) {
    next.connectTimeout = 12_000;
  }
  return next;
}

function createConnection(portOrOptions, hostOrCallback, callback) {
  let options;
  let cb = callback;

  if (typeof portOrOptions === 'object' && portOrOptions !== null) {
    options = normalizeOptions(portOrOptions);
    cb = typeof hostOrCallback === 'function' ? hostOrCallback : callback;
  } else {
    options = normalizeOptions({
      port: Number(portOrOptions),
      host: typeof hostOrCallback === 'string' ? hostOrCallback : 'localhost',
    });
    cb = typeof hostOrCallback === 'function' ? hostOrCallback : callback;
  }

  return TcpSocket.createConnection(options, cb);
}

module.exports = {
  ...TcpSocket,
  createConnection,
  connect: createConnection,
  setPreferredHost,
  Socket: TcpSocket.Socket,
  Server: TcpSocket.Server,
  isIP: TcpSocket.isIP,
  isIPv4: TcpSocket.isIPv4,
  isIPv6: TcpSocket.isIPv6,
};
