type Listener = (lines: string[]) => void;

const MAX_LINES = 80;
const lines: string[] = [];
const listeners = new Set<Listener>();

function notify() {
  const snapshot = [...lines];
  for (const listener of listeners) listener(snapshot);
}

/** Temporary in-app PKG / GoldHEN debug log (shown on the PKG tab). */
export function pkgDebug(message: string): void {
  const stamp = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const line = `${stamp} ${message}`;
  lines.push(line);
  while (lines.length > MAX_LINES) lines.shift();
  // Also print to Metro / logcat for adb.
  console.log(`[pkg] ${message}`);
  notify();
}

export function clearPkgDebug(): void {
  lines.length = 0;
  notify();
}

export function getPkgDebugLines(): string[] {
  return [...lines];
}

export function subscribePkgDebug(listener: Listener): () => void {
  listeners.add(listener);
  listener([...lines]);
  return () => {
    listeners.delete(listener);
  };
}
