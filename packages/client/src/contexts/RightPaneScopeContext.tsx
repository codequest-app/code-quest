import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type RightPaneScope = { mode: 'follow' } | { mode: 'pinned'; cwd: string };

interface RightPaneScopeActions {
  togglePin: () => void;
  pinTo: (cwd: string) => void;
  unpin: () => void;
  resetIfCwdMissing: (knownCwds: ReadonlySet<string>) => void;
}

const STORAGE_KEY = 'right-pane-scope';

const ScopeContext = createContext<RightPaneScope | null>(null);
const ActionsContext = createContext<RightPaneScopeActions | null>(null);
const CwdContext = createContext<string | null>(null);

function readStorage(): RightPaneScope {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { mode: 'follow' };
    const parsed = JSON.parse(raw);
    if (parsed?.mode === 'pinned' && typeof parsed.cwd === 'string') {
      return { mode: 'pinned', cwd: parsed.cwd };
    }
    return { mode: 'follow' };
  } catch {
    return { mode: 'follow' };
  }
}

function writeStorage(scope: RightPaneScope) {
  if (scope.mode === 'pinned') {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function RightPaneScopeProvider({
  activeCwd,
  children,
}: {
  activeCwd: string | null;
  children: ReactNode;
}) {
  const [scope, setScope] = useState<RightPaneScope>(readStorage);

  const togglePin = useCallback(() => {
    setScope((prev) => {
      if (prev.mode === 'pinned') {
        const next: RightPaneScope = { mode: 'follow' };
        writeStorage(next);
        return next;
      }
      if (activeCwd === null) return prev;
      const next: RightPaneScope = { mode: 'pinned', cwd: activeCwd };
      writeStorage(next);
      return next;
    });
  }, [activeCwd]);

  const pinTo = useCallback((cwd: string) => {
    const next: RightPaneScope = { mode: 'pinned', cwd };
    writeStorage(next);
    setScope(next);
  }, []);

  const unpin = useCallback(() => {
    const next: RightPaneScope = { mode: 'follow' };
    writeStorage(next);
    setScope(next);
  }, []);

  const resetIfCwdMissing = useCallback((knownCwds: ReadonlySet<string>) => {
    setScope((prev) => {
      if (prev.mode !== 'pinned') return prev;
      if (knownCwds.has(prev.cwd)) return prev;
      const next: RightPaneScope = { mode: 'follow' };
      writeStorage(next);
      return next;
    });
  }, []);

  const actions = useMemo<RightPaneScopeActions>(
    () => ({ togglePin, pinTo, unpin, resetIfCwdMissing }),
    [togglePin, pinTo, unpin, resetIfCwdMissing],
  );

  const cwd = scope.mode === 'pinned' ? scope.cwd : activeCwd;

  return (
    <ScopeContext.Provider value={scope}>
      <ActionsContext.Provider value={actions}>
        <CwdContext.Provider value={cwd}>{children}</CwdContext.Provider>
      </ActionsContext.Provider>
    </ScopeContext.Provider>
  );
}

export function useRightPaneScope(): RightPaneScope {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error('useRightPaneScope must be used within RightPaneScopeProvider');
  return ctx;
}

export function useRightPaneScopeActions(): RightPaneScopeActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error('useRightPaneScopeActions must be used within RightPaneScopeProvider');
  return ctx;
}

export function useRightPaneCwd(): string | null {
  return useContext(CwdContext);
}
