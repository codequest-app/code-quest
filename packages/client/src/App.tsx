import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { ErrorFallback } from './components/ErrorFallback';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import { config } from './config';
import { PluginProvider } from './contexts/PluginContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { SessionProvider } from './contexts/SessionContext';
import { SocketProvider } from './contexts/SocketContext';
import { TabProvider, useTabState } from './contexts/TabContext';
import { createSocket } from './socket/client';
import './App.css';

export function DocumentTitle() {
  const { activeTabId, tabs } = useTabState();
  const activeMeta = activeTabId ? tabs[activeTabId] : undefined;
  useEffect(() => {
    const isBusy = activeMeta?.tabStatus === 'processing' || activeMeta?.tabStatus === 'busy';
    document.title = isBusy ? '⟳ Code Quest' : 'Code Quest';
  }, [activeMeta?.tabStatus]);
  return null;
}

export function App() {
  const [socket] = useState(() => createSocket());

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg text-text">
      <Toaster position="top-right" richColors />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SocketProvider socket={socket}>
          <SessionProvider>
            <PluginProvider>
              <ProjectProvider>
                <TabProvider defaultCwd={config.defaultCwd}>
                  <DocumentTitle />
                  <WorkspaceLayout />
                </TabProvider>
              </ProjectProvider>
            </PluginProvider>
          </SessionProvider>
        </SocketProvider>
      </ErrorBoundary>
    </div>
  );
}
