import { AppState, type AppStateStatus, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import type { SessionUser } from '@/stores/session';

import { ApiError, request, requestAuthSession } from './client';
import { API_BASE_URL, SITE_AUTH_EMAIL_DOMAIN } from './config';

/**
 * Sign-in for the mobile app.
 *
 * - Password / register: Better Auth directly (no Cap), Bearer session token.
 * - Discord / « Continuer sur le site »: web challenge (`/api/auth/qr/*` route
 *   name is historical — the app never shows a QR code). Opens `/app/autoriser`
 *   then claim → same Bearer session token as password login.
 */

const POLL_INTERVAL_MS = 1500;
/** After the user returns to the app, keep polling in case approve just landed. */
const LATE_APPROVAL_CHECKS = 12;

export type AuthFailureReason = 'cancelled' | 'expired' | 'failed';

export class AuthError extends Error {
  readonly reason: AuthFailureReason;

  constructor(reason: AuthFailureReason, message: string) {
    super(message);
    this.name = 'AuthError';
    this.reason = reason;
  }

  get userMessage(): string {
    if (this.reason === 'expired') return 'La demande de connexion a expiré. Réessaie.';
    if (this.reason === 'cancelled') return 'Connexion annulée.';
    return this.message || 'La connexion a échoué. Réessaie.';
  }
}

interface ChallengeResponse {
  token: string;
  code: string;
  expiresIn: number;
  verifyUrl?: string;
}

interface StatusResponse {
  status: 'pending' | 'approved' | 'expired' | 'consumed';
  exchangeToken?: string;
}

interface ClaimResponse {
  success: boolean;
  sessionToken: string;
}

interface MeResponse {
  authenticated: boolean;
  user?: {
    id?: string | number;
    user_id?: string | number;
    pseudo?: string | null;
    photo?: string | null;
    has_a2f?: boolean;
  };
}

export interface AuthSuccess {
  token: string;
  user: SessionUser;
}

/**
 * Browser challenge methods. Password / register use in-app modals instead.
 * `site` = « Continuer sur le site » (passkey / A2F / validation web).
 */
export type AuthMethod = 'discord' | 'site' | 'register';

/** Page of the website that asks the user to approve this app. */
function approvalUrl(token: string, method: AuthMethod): string {
  // Map to the website's `methode` query (autoriser → /login entry points).
  const methode =
    method === 'site' ? 'password' : method === 'register' ? 'register' : method;
  const query = new URLSearchParams({ token, methode });
  return `${API_BASE_URL}/app/autoriser?${query.toString()}`;
}

function syntheticEmail(username: string): string {
  const local = username
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '')
    .slice(0, 64);
  return `${local}@${SITE_AUTH_EMAIL_DOMAIN}`;
}

function mapAuthHttpError(error: unknown, fallback: string): AuthError {
  if (error instanceof AuthError) return error;
  if (error instanceof ApiError) {
    const msg = (error.serverMessage || '').toLowerCase();
    if (
      error.status === 403 ||
      msg.includes('a2f') ||
      msg.includes('2fa') ||
      msg.includes('totp') ||
      msg.includes('two factor')
    ) {
      return new AuthError(
        'failed',
        'Ce compte nécessite une validation sur le site (A2F ou protection). Utilise « Continuer sur le site ».'
      );
    }
    if (error.status === 401) {
      return new AuthError('failed', error.serverMessage || 'Identifiant ou mot de passe incorrect.');
    }
    if (msg.includes('already') || msg.includes('existe') || msg.includes('taken')) {
      return new AuthError('failed', error.serverMessage || 'Ce pseudo ou cet e-mail est déjà utilisé.');
    }
    return new AuthError('failed', error.userMessage || fallback);
  }
  if (error instanceof Error && error.message) {
    return new AuthError('failed', error.message);
  }
  return new AuthError('failed', fallback);
}

/**
 * Opens the website to sign in, then waits for the approval to come back.
 *
 * @throws {AuthError} when the user gives up or the challenge expires.
 */
export async function signInWithBrowser(method: AuthMethod): Promise<AuthSuccess> {
  // Better Auth expects a JSON body on this endpoint, even an empty one.
  let challenge: ChallengeResponse;
  try {
    challenge = await request<ChallengeResponse>('/api/auth/qr/create', {
      method: 'POST',
      body: {},
    });
  } catch (error) {
    throw mapAuthHttpError(error, 'Impossible de démarrer la connexion via le site.');
  }

  // Intentionally ignore challenge.verifyUrl (/login?qr=…) — we need `methode`.
  const url = approvalUrl(challenge.token, method);
  const deadline = Date.now() + challenge.expiresIn * 1000;

  // Android: openBrowserAsync resolves as soon as Chrome Custom Tabs opens —
  // it does NOT wait for close. Race on that promise and we "cancel" while the
  // user is still logging in. Wait for AppState to return to foreground instead.
  const browserReturned = waitForReturnFromBrowser();
  await WebBrowser.openBrowserAsync(url, {
    ...(Platform.OS === 'ios'
      ? { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN }
      : { showInRecents: true }),
  });

  let exchangeToken: string;
  try {
    exchangeToken = await Promise.race([
      pollUntilApproved(challenge.token, deadline),
      browserReturned.then(() => waitForLateApproval(challenge.token)),
    ]);
  } finally {
    await WebBrowser.dismissBrowser().catch(() => undefined);
  }

  const claimed = await request<ClaimResponse>('/api/auth/qr/claim', {
    method: 'POST',
    body: { token: challenge.token, exchangeToken },
  });

  if (!claimed?.sessionToken) {
    throw new AuthError('expired', 'The claim response had no session token.');
  }

  return { token: claimed.sessionToken, user: await fetchSessionUser(claimed.sessionToken) };
}

/** In-app password login via Better Auth (same Bearer token as claim). */
export async function signInWithPassword(input: {
  identifier: string;
  password: string;
}): Promise<AuthSuccess> {
  const identifier = input.identifier.trim();
  const password = input.password;
  if (!identifier || !password) {
    throw new AuthError('failed', 'Indique ton pseudo (ou e-mail) et ton mot de passe.');
  }

  const isEmail = identifier.includes('@');
  const path = isEmail ? '/api/auth/sign-in/email' : '/api/auth/sign-in/username';
  const body = isEmail
    ? { email: identifier, password, rememberMe: true }
    : { username: identifier, password, rememberMe: true };

  try {
    const { token } = await requestAuthSession(path, { method: 'POST', body });
    return { token, user: await fetchSessionUser(token) };
  } catch (error) {
    throw mapAuthHttpError(error, 'Connexion impossible.');
  }
}

/** In-app registration via Better Auth + register-complete. */
export async function registerWithPassword(input: {
  username: string;
  password: string;
  displayName?: string;
}): Promise<AuthSuccess> {
  const username = input.username.trim();
  const password = input.password;
  const displayName = input.displayName?.trim() || username;

  if (username.length < 3) {
    throw new AuthError('failed', 'Le pseudo doit faire au moins 3 caractères.');
  }
  if (password.length < 8) {
    throw new AuthError('failed', 'Le mot de passe doit faire au moins 8 caractères.');
  }

  try {
    const availability = await request<{ available?: boolean; reason?: string }>(
      '/api/auth/username-available',
      { query: { username } }
    );
    if (availability.available === false) {
      throw new AuthError(
        'failed',
        availability.reason || 'Ce pseudo est déjà pris. Choisis-en un autre.'
      );
    }

    const email = syntheticEmail(username);
    const { token } = await requestAuthSession('/api/auth/sign-up/email', {
      method: 'POST',
      body: {
        email,
        password,
        name: displayName,
        username,
      },
    });

    await request('/api/auth/register-complete', {
      method: 'POST',
      token,
      body: {
        username,
        displayName,
        langue: 'fr',
        pays: 'FR',
      },
    }).catch(() => undefined);

    return { token, user: await fetchSessionUser(token) };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw mapAuthHttpError(error, 'Création de compte impossible.');
  }
}

/**
 * Resolves when the app becomes active again after having left for the browser.
 * On iOS, openBrowserAsync already waits for dismiss — this still works as a
 * secondary signal once the modal is gone.
 */
function waitForReturnFromBrowser(): Promise<void> {
  return new Promise((resolve) => {
    let sawBackground = AppState.currentState !== 'active';

    const onChange = (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        sawBackground = true;
        return;
      }
      if (state === 'active' && sawBackground) {
        subscription.remove();
        resolve();
      }
    };

    const subscription = AppState.addEventListener('change', onChange);

    // Already backgrounded (slow open) — still wait for the next active.
    if (AppState.currentState !== 'active') {
      sawBackground = true;
    }
  });
}

/** Reads the profile of the freshly signed in user. */
export async function fetchSessionUser(token: string): Promise<SessionUser> {
  const payload = await request<MeResponse>('/api/auth/me', { token });
  const user = payload.user;
  const id = user?.user_id ?? user?.id;

  return {
    id: id === undefined || id === null ? '' : String(id),
    pseudo: user?.pseudo?.trim() || 'Compte lbxmb',
    photo: user?.photo?.trim() || null,
  };
}

/** Invalidates the session server side; the local state is cleared regardless. */
export async function signOut(token: string): Promise<void> {
  await request('/api/auth/logout', { method: 'POST', token });
}

async function pollUntilApproved(token: string, deadline: number): Promise<string> {
  while (Date.now() < deadline) {
    await delay(POLL_INTERVAL_MS);
    const approved = await readApproval(token);
    if (approved) return approved;
  }
  throw new AuthError('expired', 'The authorization challenge expired.');
}

/**
 * Closing the browser usually means giving up, but the approval request may
 * still be in flight, so the status is checked a couple more times.
 */
async function waitForLateApproval(token: string): Promise<string> {
  for (let attempt = 0; attempt < LATE_APPROVAL_CHECKS; attempt += 1) {
    const approved = await readApproval(token);
    if (approved) return approved;
    await delay(POLL_INTERVAL_MS);
  }
  throw new AuthError('cancelled', 'The user closed the browser.');
}

/** Returns the exchange token once approved, `null` while still pending. */
async function readApproval(token: string): Promise<string | null> {
  const payload = await request<StatusResponse>('/api/auth/qr/status', { query: { token } });

  if (payload.status === 'approved' && payload.exchangeToken) return payload.exchangeToken;
  if (payload.status === 'expired' || payload.status === 'consumed') {
    throw new AuthError('expired', `The challenge is ${payload.status}.`);
  }
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
