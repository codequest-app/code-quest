import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sessionStoragePersist } from './persistStorage';

export type RightPaneScope = { mode: 'follow' } | { mode: 'pinned'; cwd: string };

interface RightPaneScopeState {
  scope: RightPaneScope;
  pinTo: (cwd: string) => void;
  unpin: () => void;
  resetIfCwdMissing: (knownCwds: ReadonlySet<string>) => void;
}

export const useRightPaneScopeStore = create<RightPaneScopeState>()(
  persist(
    (set, get) => ({
      scope: { mode: 'follow' },
      pinTo: (cwd) => set({ scope: { mode: 'pinned', cwd } }),
      unpin: () => set({ scope: { mode: 'follow' } }),
      resetIfCwdMissing: (knownCwds) => {
        const { scope } = get();
        if (scope.mode === 'pinned' && !knownCwds.has(scope.cwd)) {
          set({ scope: { mode: 'follow' } });
        }
      },
    }),
    {
      name: 'cc-office.rightPaneScope',
      storage: sessionStoragePersist(),
      partialize: (state) => ({ scope: state.scope }),
    },
  ),
);
