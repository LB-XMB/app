/**
 * Maps incoming https://lbxmb.fr/… and lbxmb://… URLs to Expo Router paths.
 */
export function mapIncomingPath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '/';

  let pathname = trimmed;
  let search = '';

  try {
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
      const url = new URL(trimmed);
      pathname = url.pathname || '/';
      search = url.search || '';
      if (url.protocol === 'lbxmb:') {
        // lbxmb://ressource/123 → host=ressource, pathname=/123
        const host = url.hostname || url.host;
        if (host && pathname === '/') pathname = `/${host}`;
        else if (host) pathname = `/${host}${pathname}`;
      }
    }
  } catch {
    pathname = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  pathname = pathname.replace(/\/+$/, '') || '/';
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'ressources' && parts[1]) {
    return `/ressource/${encodeURIComponent(parts[1])}${search}`;
  }
  if (parts[0] === 'ressource' && parts[1]) {
    return `/ressource/${encodeURIComponent(parts[1])}${search}`;
  }
  if (parts[0] === 'guides' && parts[1]) {
    return `/guides/${encodeURIComponent(parts[1])}${search}`;
  }
  if (parts[0] === 'guide' && parts[1]) {
    return `/guides/${encodeURIComponent(parts[1])}${search}`;
  }
  if (parts[0] === 'forum') {
    if (parts[1] === 'thread' || parts[1] === 'post') {
      if (parts[2]) return `/forum/${encodeURIComponent(parts[2])}${search}`;
    }
    if (parts[1] && parts[1] !== 'nouveau') {
      return `/forum/${encodeURIComponent(parts[1])}${search}`;
    }
    return `/forum${search}`;
  }
  if (parts[0] === 'profil' && parts[1]) {
    return `/profil/${encodeURIComponent(parts[1])}${search}`;
  }
  if (parts[0] === 'listes') {
    if (parts[1]) return `/listes/${encodeURIComponent(parts[1])}${search}`;
    return '/listes';
  }
  if (parts[0] === 'notifications') return '/notifications';

  // Already an app path (e.g. /catalogue, /ressource/…).
  return `${pathname}${search}`;
}
