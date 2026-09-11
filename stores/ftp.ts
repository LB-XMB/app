import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './storage';

export interface FtpTarget {
  host: string;
  port: number;
  user: string;
  password: string;
  /** Last remote folder browsed on this console. */
  lastPath: string;
}

interface FtpState {
  target: FtpTarget;
  setTarget: (patch: Partial<FtpTarget>) => void;
  clearPassword: () => void;
}

const DEFAULT_TARGET: FtpTarget = {
  host: '',
  port: 21,
  user: 'anonymous',
  password: '',
  lastPath: '/',
};

export const useFtpStore = create<FtpState>()(
  persist(
    (set) => ({
      target: DEFAULT_TARGET,
      setTarget: (patch) =>
        set((state) => ({
          target: { ...state.target, ...patch },
        })),
      clearPassword: () =>
        set((state) => ({
          target: { ...state.target, password: '' },
        })),
    }),
    {
      name: 'lbxmb.ftp',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
