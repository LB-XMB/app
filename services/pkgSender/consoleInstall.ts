import { FILE_SERVER_PORT, RECEIVER_PORT, type ConsoleMode } from './types';

function encodeUrlOnce(url: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(url));
  } catch {
    return encodeURIComponent(url);
  }
}

function jsonEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, ' ').replace(/\n/g, ' ');
}

async function getText(url: string, ms = 3000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** RPI probe: body contains Unsupported method + fail. */
export async function isRpiOnline(ip: string): Promise<boolean> {
  const body = await getText(`http://${ip}:${RECEIVER_PORT}/api`, 3000);
  return !!body && body.includes('Unsupported method') && body.includes('fail');
}

/** PS5 receiver also answers on /api; treat success/status JSON as online too. */
export async function isReceiverOnline(ip: string): Promise<boolean> {
  const body = await getText(`http://${ip}:${RECEIVER_PORT}/api`, 3000);
  if (!body) return false;
  if (body.includes('Unsupported method') && body.includes('fail')) return true;
  // pkg-receiver may return a short probe payload
  if (body.includes('status') || body.includes('ok') || body.length < 64) return true;
  return false;
}

export async function isGoldHenOnline(ip: string): Promise<boolean> {
  const body = await getText(`http://${ip}:9090/status`, 3000);
  if (!body) return false;
  return body.replace(/\s/g, '').includes('"status":"ready"');
}

export async function detectConsoleMode(ip: string): Promise<ConsoleMode> {
  if (await isRpiOnline(ip)) {
    // Same /api signature for RPI and often for PS5 receiver — check version endpoint.
    const version = await getText(`http://${ip}:${RECEIVER_PORT}/api/version`, 2000);
    if (version && version.includes('build')) return 'ps5';
    return 'rpi';
  }
  if (await isReceiverOnline(ip)) {
    const version = await getText(`http://${ip}:${RECEIVER_PORT}/api/version`, 2000);
    if (version && version.includes('build')) return 'ps5';
    return 'rpi';
  }
  if (await isGoldHenOnline(ip)) return 'goldhen';
  return 'offline';
}

export async function diagnoseConsole(ip: string): Promise<string> {
  const parts: string[] = [];
  for (const [port, path] of [
    [12800, '/api'],
    [9090, '/status'],
  ] as const) {
    const body = await getText(`http://${ip}:${port}${path}`, 2500);
    parts.push(body ? `${port}: ok` : `${port}: closed`);
  }
  return parts.join(' · ');
}

/**
 * Push install task to PS5 receiver or PS4 RPI (POST /api/install).
 * Console then downloads the PKG from our local HTTP server.
 */
export async function pushInstall(opts: {
  consoleIp: string;
  fileUrl: string;
  name?: string;
  iconUrl?: string;
}): Promise<{ ok: boolean; reply: string }> {
  const enc = encodeUrlOnce(opts.fileUrl.replace(/^https:/i, 'http:'));
  let json = `{"type":"direct","packages":["${enc}"]}`;
  if (opts.name?.trim()) {
    json = `{"type":"direct","packages":["${enc}"],"name":"${jsonEscape(opts.name.trim())}"}`;
  }
  if (opts.iconUrl?.trim()) {
    const icon = encodeUrlOnce(opts.iconUrl.replace(/^https:/i, 'http:'));
    json = json.slice(0, -1) + `,"icon_url":"${jsonEscape(icon)}"}`;
  }

  for (const port of [RECEIVER_PORT, 9090]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(`http://${opts.consoleIp}:${port}/api/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const reply = await res.text();
      if (res.ok || reply.includes('"success"')) {
        return { ok: reply.includes('success') || res.ok, reply };
      }
    } catch {
      // try next port
    }
  }
  return { ok: false, reply: 'Aucune réponse sur :12800 / :9090' };
}

/** Ask PS5 receiver to pull a file into /data/homebrew (disc images). */
export async function pullToHomebrew(opts: {
  consoleIp: string;
  fileUrl: string;
  remoteName: string;
  mode?: 'overwrite' | 'resume';
}): Promise<{ ok: boolean; reply: string }> {
  const path = `/data/homebrew/${opts.remoteName.replace(/^\/+/, '')}`;
  const body = JSON.stringify({
    url: opts.fileUrl,
    path,
    mode: opts.mode ?? 'overwrite',
  });
  try {
    const res = await fetch(`http://${opts.consoleIp}:${RECEIVER_PORT}/api/files/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const reply = await res.text();
    return { ok: res.ok || reply.includes('"ok"'), reply };
  } catch (error) {
    return {
      ok: false,
      reply: error instanceof Error ? error.message : 'Pull impossible',
    };
  }
}

export function pkgUrl(lanIp: string, id: string, port = FILE_SERVER_PORT): string {
  return `http://${lanIp}:${port}/pkg/${encodeURIComponent(id)}`;
}

export function manifestUrl(lanIp: string, id: string, port = FILE_SERVER_PORT): string {
  return `http://${lanIp}:${port}/json/${encodeURIComponent(id)}.json`;
}

export function buildGoldHenManifest(fileUrl: string, fileSize: number, digest = ''): string {
  const eu = fileUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const dg = digest.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return (
    `{"originalFileSize":${fileSize}` +
    `,"packageDigest":"${dg}"` +
    `,"numberOfSplitFiles":1` +
    `,"pieces":[{"url":"${eu}"` +
    `,"fileOffset":0` +
    `,"fileSize":${fileSize}` +
    `,"hashValue":"0000000000000000000000000000000000000000"}]}`
  );
}
