import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';

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
        return this.status === 404
          ? 'Contenu introuvable.'
          : `Le serveur a répondu une erreur (${this.status}).`;
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
      headers: {
        Accept: 'application/json',
        // FormData sets its own content type, boundary included.
        ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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
    throw new ApiError(
      'http',
      `${response.status} on ${path}`,
      response.status,
      await readServerError(response)
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError('parse', (error as Error).message);
  }
}

/** Reads the `error` field of a failed response, ignoring anything unexpected. */
async function readServerError(response: Response): Promise<string | undefined> {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === 'string' && payload.error ? payload.error : undefined;
  } catch {
    return undefined;
  }
}
