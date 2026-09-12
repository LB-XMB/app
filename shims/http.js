'use strict';

/** Minimal Node `http`/`https` stub so ssh2's unused HTTPAgent can load. */

class Agent {
  constructor() {}
  addRequest() {}
  destroy() {}
}

function noop() {
  throw new Error('http/https n’est pas disponible dans l’app mobile');
}

module.exports = {
  Agent,
  Server: class Server {},
  IncomingMessage: class IncomingMessage {},
  ServerResponse: class ServerResponse {},
  ClientRequest: class ClientRequest {},
  createServer: noop,
  request: noop,
  get: noop,
  globalAgent: new Agent(),
};
