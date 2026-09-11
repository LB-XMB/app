import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './storage';

export interface SessionUser {
  id: string;
  pseudo: string;
  /** Relative uploads path of the avatar; resolve it with `uploadUrl()`. */
  photo: string | null;
}

/** Whether the sign-in screen still has to be shown during onboarding. */
export type SignInPrompt = 'unset' | 'answered';

interface SessionState {
  /** Better Auth session token, sent as a bearer token. */
  token: string | null;
  user: SessionUser | null;
  prompt: SignInPrompt;
  signIn: (payload: { token: string; user: SessionUser }) => void;
  signOut: () => void;
  /** Records the "rester déconnecté" choice so onboarding does not repeat. */
  dismiss: () => void;
  /** Refreshes the profile of an already authenticated user. */
  setUser: (user: SessionUser) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      prompt: 'unset',
      signIn: ({ token, user }) => set({ token, user, prompt: 'answered' }),
      // The prompt stays answered: signing out must not restart onboarding.
      signOut: () => set({ token: null, user: null, prompt: 'answered' }),
      dismiss: () => set({ prompt: 'answered' }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'lbxmb.session',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

/** True once a token is held, which is what unlocks posting on the forum. */
export function useIsSignedIn(): boolean {
  return useSessionStore((state) => state.token !== null);
}
