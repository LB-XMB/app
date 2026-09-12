import {
  API_BASE_URL,
  APP_CLIENT_HEADER,
  APP_USER_AGENT,
  REQUEST_TIMEOUT_MS,
} from './config';

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** `error` field returned by the API, when it sends one. */
  readonly serverMessage?: string;

  constructor(kind: ApiErrorKind, message: string, status?: number, serverMessage?: string) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.serverMessage = serverMessage;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True when the request needs a session the app does not have. */
  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** Message ready to be displayed to the user. */
  get userMessage(): string {
    // The API writes its errors in French, for users; prefer them.
    if (this.serverMessage) return this.serverMessage;

    switch (this.kind) {
      case 'timeout':
        return 'Le serveur met trop de temps à répondre.';
      case 'network':
        return 'Impossible de joindre lbxmb.fr. Vérifie ta connexion.';
      case 'parse':
        return 'Réponse inattendue du serveur.';
      default:
        if (this.status === 404) return 'Contenu introuvable.';
        if (this.status === 403) {
          return 'Accès refusé (réseau ou protection). Réessaie ou vérifie ta connexion.';
        }
        if (this.status === 401) return 'Identifiants incorrects ou session expirée.';
        if (this.status != null && this.status >= 500) {
          return 'Le serveur est momentanément indisponible. Réessaie dans un instant.';
        }
        return `Le serveur a répondu une erreur (${this.status}).`;
    }
  }
}

export type QueryValue = string | number | boolean | null | undefined;

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(path, API_BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

interface RequestOptions {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Sent as JSON, unless it already is a `FormData`. */
  body?: unknown;
  /** Session token of the signed in user, for the authenticated routes. */
  token?: string | null;
}

function commonHeaders(token?: string | null, body?: unknown, isFormData?: boolean): HeadersInit {
  return {
    Accept: 'application/json',
    'User-Agent': APP_USER_AGENT,
    'X-LBXMB-Client': APP_CLIENT_HEADER,
    // Trusted origin for Better Auth when a cookie jar still attaches visitor_token.
    Origin: API_BASE_URL,
    ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function logAuthFailure(path: string, status: number, body: string) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const truncated = body.length > 400 ? `${body.slice(0, 400)}…` : body;
    console.warn(`[auth] ${status} ${path}: ${truncated}`);
  }
}

/** Performs a JSON request against the lbxmb.fr API. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, signal, method = 'GET', body, token } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal: controller.signal,
      // Never send site cookies: Better Auth treats Cookie without Origin as CSRF (403).
      credentials: 'omit',
      headers: commonHeaders(token, body, isFormData),
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    // An abort triggered by the caller must bubble up untouched so react-query
    // does not treat a cancelled request as a failure.
    if (signal?.aborted) throw error;
    if (controller.signal.aborted) {
      throw new ApiError('timeout', `Timeout after ${REQUEST_TIMEOUT_MS}ms on ${path}`);
    }
    throw new ApiError('network', (error as Error).message);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  if (!response.ok) {
    const serverMessage = await readServerError(response);
    if (
      path.includes('/api/auth/') &&
      typeof __DEV__ !== 'undefined' &&
      __DEV__
    ) {
      logAuthFailure(path, response.status, serverMessage ?? '');
    }
    throw new ApiError('http', `${response.status} on ${path}`, response.status, serverMessage);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError('parse', (error as Error).message);
  }
}

/**
 * Auth helpers that also read Better Auth's `set-auth-token` header
 * (bearer plugin) when the JSON body has no `token`.
 */
export async function requestAuthSession(
  path: string,
  options: RequestOptions = {}
): Promise<{ token: string; body: Record<string, unknown> }> {
  const { query, method = 'POST', body, token } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal: controller.signal,
      credentials: 'omit',
      headers: commonHeaders(token, body, false),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError('timeout', `Timeout after ${REQUEST_TIMEOUT_MS}ms on ${path}`);
    }
    throw new ApiError('network', (error as Error).message);
  } finally {
    clearTimeout(timeout);
  }

  const rawText = await response.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
  } catch {
    parsed = {};
  }

  if (!response.ok) {
    const serverMessage =
      (typeof parsed.error === 'string' && parsed.error) ||
      (typeof parsed.message === 'string' && parsed.message) ||
      undefined;
    logAuthFailure(path, response.status, serverMessage ?? rawText);
    throw new ApiError('http', `${response.status} on ${path}`, response.status, serverMessage);
  }

  const headerToken = response.headers.get('set-auth-token')?.trim() || '';
  const bodyToken = typeof parsed.token === 'string' ? parsed.token.trim() : '';
  const sessionToken = bodyToken || headerToken;
  if (!sessionToken) {
    throw new ApiError(
      'parse',
      'Better Auth n’a pas renvoyé de jeton de session (token / set-auth-token).'
    );
  }

  return { token: sessionToken, body: parsed };
}

/** Reads the `error` / `message` field of a failed response. */
async function readServerError(response: Response): Promise<string | undefined> {
  try {
    const payload = (await response.json()) as { error?: unknown; message?: unknown };
    if (typeof payload.error === 'string' && payload.error) return payload.error;
    if (typeof payload.message === 'string' && payload.message) return payload.message;
    return undefined;
  } catch {
    return undefined;
  }
}
