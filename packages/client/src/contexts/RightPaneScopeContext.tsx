import { createContext, type ReactNode, useCallback, useContext } from 'react';
import { type RightPaneScope, useRightPaneScopeStore } from '../stores/useRightPaneScopeStore';

export type { RightPaneScope };

const ActiveCwdContext = createContext<string | null>(null);

export function RightPaneScopeProvider({
  activeCwd,
  children,
}: {
  activeCwd: string | null;
  children: ReactNode;
}) {
  return <ActiveCwdContext.Provider value={activeCwd}>{children}</ActiveCwdContext.Provider>;
}

export function useRightPaneScope(): RightPaneScope {
  return useRightPaneScopeStore((s) => s.scope);
}

export function useRightPaneScopeActions() {
  const activeCwd = useContext(ActiveCwdContext);
  const scope = useRightPaneScopeStore((s) => s.scope);
  const pinTo = useRightPaneScopeStore((s) => s.pinTo);
  const unpin = useRightPaneScopeStore((s) => s.unpin);
  const resetIfCwdMissing = useRightPaneScopeStore((s) => s.resetIfCwdMissing);

  const togglePin = useCallback(() => {
    if (scope.mode === 'pinned') {
      unpin();
    } else if (activeCwd !== null) {
      pinTo(activeCwd);
    }
  }, [scope.mode, activeCwd, pinTo, unpin]);

  return { scope, togglePin, pinTo, unpin, resetIfCwdMissing };
}

export function useRightPaneCwd(): string | null {
  const scope = useRightPaneScopeStore((s) => s.scope);
  const activeCwd = useContext(ActiveCwdContext);
  return scope.mode === 'pinned' ? scope.cwd : activeCwd;
}
