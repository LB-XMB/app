'use strict';

/**
 * Node `crypto` is required by ssh2. React Native has no full crypto suite
 * (no Diffie-Hellman / OpenSSH ciphers). Fail loudly so SFTP can surface a
 * clear French error instead of a cryptic Metro crash mid-handshake.
 */

function missing(name) {
  const err = new Error(
    `crypto.${name} indisponible sur mobile — le SFTP (ssh2) nécessite Node.js. Utilise FTP pour les consoles.`
  );
  err.code = 'ERR_CRYPTO_UNAVAILABLE';
  return err;
}

function throwMissing(name) {
  return function () {
    throw missing(name);
  };
}

module.exports = {
  createHash: throwMissing('createHash'),
  createHmac: throwMissing('createHmac'),
  createDiffieHellman: throwMissing('createDiffieHellman'),
  createDiffieHellmanGroup: throwMissing('createDiffieHellmanGroup'),
  createECDH: throwMissing('createECDH'),
  createCipheriv: throwMissing('createCipheriv'),
  createDecipheriv: throwMissing('createDecipheriv'),
  createSign: throwMissing('createSign'),
  createVerify: throwMissing('createVerify'),
  randomBytes: throwMissing('randomBytes'),
  randomFillSync: throwMissing('randomFillSync'),
  pbkdf2: throwMissing('pbkdf2'),
  pbkdf2Sync: throwMissing('pbkdf2Sync'),
  getCiphers: () => [],
  getHashes: () => [],
  constants: {},
};
