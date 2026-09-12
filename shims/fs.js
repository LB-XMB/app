'use strict';

/**
 * Minimal `fs` stub: ftp-ts / ssh2-sftp-client may require('fs') at load time.
 * Path-based put/get is unsupported — pass Buffer / streams from the app instead.
 */

function unsupported(name) {
  return function () {
    throw new Error(
      `fs.${name} n’est pas disponible dans l’app. Utilise un Buffer ou un flux.`
    );
  };
}

module.exports = {
  createReadStream: unsupported('createReadStream'),
  createWriteStream: unsupported('createWriteStream'),
  readFile: unsupported('readFile'),
  readFileSync: unsupported('readFileSync'),
  writeFile: unsupported('writeFile'),
  writeFileSync: unsupported('writeFileSync'),
  existsSync: () => false,
  statSync: unsupported('statSync'),
  promises: {
    readFile: unsupported('promises.readFile'),
    writeFile: unsupported('promises.writeFile'),
    access: unsupported('promises.access'),
    stat: unsupported('promises.stat'),
  },
};
