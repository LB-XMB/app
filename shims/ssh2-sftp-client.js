'use strict';

/**
 * Stub for `ssh2-sftp-client`: real ssh2 needs Node http/child_process/crypto
 * that Metro cannot ship. Consoles use FTP; UI still offers SFTP and gets a clear error.
 */

const UNAVAILABLE =
  'SFTP indisponible sur mobile (crypto Node manquante). Utilise FTP pour Multiman / webMAN / GoldHEN.';

class SftpClientStub {
  connect() {
    return Promise.reject(new Error(UNAVAILABLE));
  }

  list() {
    return Promise.reject(new Error(UNAVAILABLE));
  }

  put() {
    return Promise.reject(new Error(UNAVAILABLE));
  }

  end() {
    return Promise.resolve();
  }
}

module.exports = SftpClientStub;
