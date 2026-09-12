import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TransferProtocol } from '@/services/ftp';

import { zustandStorage } from './storage';

export interface FtpTarget {
  host: string;
  port: number;
  user: string;
  password: string;
  protocol: TransferProtocol;
  /** Last remote folder browsed on this target. */
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
  protocol: 'ftp',
  lastPath: '/',
};

export const useFtpStore = create<FtpState>()(
  persist(
    (set) => ({
      target: DEFAULT_TARGET,
      setTarget: (patch) =>
        set((state) => {
          const next = { ...state.target, ...patch };
          // Switch default port when protocol changes and the user left the usual default.
          if (patch.protocol && patch.port == null) {
            const previousDefault = state.target.protocol === 'sftp' ? 22 : 21;
            if (state.target.port === previousDefault) {
              next.port = patch.protocol === 'sftp' ? 22 : 21;
            }
          }
          return { target: next };
        }),
      clearPassword: () =>
        set((state) => ({
          target: { ...state.target, password: '' },
        })),
    }),
    {
      name: 'lbxmb.ftp',
      storage: createJSONStorage(() => zustandStorage),
      merge: (persisted, current) => {
        const stored = (persisted as { target?: Partial<FtpTarget> } | undefined)?.target;
        return {
          ...current,
          target: {
            ...DEFAULT_TARGET,
            ...current.target,
            ...stored,
            protocol: stored?.protocol === 'sftp' ? 'sftp' : 'ftp',
          },
        };
      },
    }
  )
);
