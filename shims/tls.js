'use strict';

/**
 * Node `tls` → react-native-tcp-socket TLS helpers.
 * ftp-ts calls `tls.connect(options)`; tcp-socket exposes `connectTLS`.
 */

const TcpSocket = require('react-native-tcp-socket');
const net = require('./net');

function connect(options, callback) {
  const opts =
    typeof options === 'object' && options !== null
      ? {
          ...options,
          host: options.host,
          port: options.port,
          tls: true,
        }
      : options;

  // Prefer net shim so PASV host rewrite + Android Wi-Fi apply.
  if (typeof opts === 'object' && opts !== null && opts.host) {
    // connectTLS creates Socket then TLSSocket; pass through tcp-socket API.
  }

  return TcpSocket.connectTLS(opts, callback);
}

module.exports = {
  connect,
  createServer: TcpSocket.createTLSServer,
  TLSSocket: TcpSocket.TLSSocket,
  Server: TcpSocket.TLSServer,
};
