import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

interface WorkspaceActionsContextValue {
  openSidebar: () => void;
}

const WorkspaceActionsContext = createContext<WorkspaceActionsContextValue>({
  openSidebar: () => {},
});

export function WorkspaceActionsProvider({
  openSidebar,
  children,
}: WorkspaceActionsContextValue & { children: ReactNode }) {
  return (
    <WorkspaceActionsContext.Provider value={{ openSidebar }}>
      {children}
    </WorkspaceActionsContext.Provider>
  );
}

export function useWorkspaceActions() {
  return useContext(WorkspaceActionsContext);
}
