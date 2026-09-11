import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** Message ready to be displayed to the user. */
  get userMessage(): string {
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
  method?: 'GET' | 'POST';
  body?: unknown;
}

/** Performs a JSON request against the lbxmb.fr public API. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, signal, method = 'GET', body } = options;
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
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
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
    throw new ApiError('http', `${response.status} on ${path}`, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError('parse', (error as Error).message);
  }
}
