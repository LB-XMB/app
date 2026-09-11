import * as WebBrowser from 'expo-web-browser';

import type { SessionUser } from '@/stores/session';

import { request } from './client';
import { API_BASE_URL } from './config';

/**
 * Sign-in flow.
 *
 * The website owns every authentication method: password with its anti-bot and
 * TOTP step, Discord OAuth and passkeys. Reimplementing any of them in the app
 * would mean bypassing those protections, so the app delegates the whole thing
 * to the site, opened in the system browser, and only collects a session token
 * at the end. That token is the challenge exchange already used by the QR login
 * of the PS4 app: the secret is minted by the server and never travels through
 * a redirect URL.
 */

const POLL_INTERVAL_MS = 1500;
/** Grace period after the browser closes, in case approval just went through. */
const LATE_APPROVAL_CHECKS = 2;

export type AuthFailureReason = 'cancelled' | 'expired';

export class AuthError extends Error {
  readonly reason: AuthFailureReason;

  constructor(reason: AuthFailureReason, message: string) {
    super(message);
    this.name = 'AuthError';
    this.reason = reason;
  }

  get userMessage(): string {
    return this.reason === 'expired'
      ? 'La demande de connexion a expiré. Réessaie.'
      : 'Connexion annulée.';
  }
}

interface ChallengeResponse {
  token: string;
  code: string;
  expiresIn: number;
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
  };
}

export interface AuthSuccess {
  token: string;
  user: SessionUser;
}

/** Entry point the website should land on, so the user skips a step. */
export type AuthMethod = 'discord' | 'password' | 'passkey' | 'register';

/** Page of the website that asks the user to approve this app. */
function approvalUrl(token: string, method: AuthMethod): string {
  const query = new URLSearchParams({ token, methode: method });
  return `${API_BASE_URL}/app/autoriser?${query.toString()}`;
}

/**
 * Opens the website to sign in, then waits for the approval to come back.
 *
 * @throws {AuthError} when the user gives up or the challenge expires.
 */
export async function signInWithBrowser(method: AuthMethod): Promise<AuthSuccess> {
  // Better Auth expects a JSON body on this endpoint, even an empty one.
  const challenge = await request<ChallengeResponse>('/api/auth/qr/create', {
    method: 'POST',
    body: {},
  });

  const browser = WebBrowser.openAuthSessionAsync(approvalUrl(challenge.token, method));
  const deadline = Date.now() + challenge.expiresIn * 1000;

  let exchangeToken: string;
  try {
    exchangeToken = await Promise.race([
      pollUntilApproved(challenge.token, deadline),
      browser.then(() => waitForLateApproval(challenge.token)),
    ]);
  } finally {
    WebBrowser.dismissAuthSession();
  }

  const claimed = await request<ClaimResponse>('/api/auth/qr/claim', {
    method: 'POST',
    body: { token: challenge.token, exchangeToken },
  });

  return { token: claimed.sessionToken, user: await fetchSessionUser(claimed.sessionToken) };
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
