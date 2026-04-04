import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { ErrorFallback } from './components/ErrorFallback';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import { config } from './config';
import { PluginProvider } from './contexts/PluginContext';
import { SessionProvider } from './contexts/SessionContext';
import { SocketProvider } from './contexts/SocketContext';
import { TabProvider } from './contexts/TabContext';
import { createSocket } from './socket/client';
import './App.css';

export function App() {
  const [socket] = useState(() => createSocket());

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg text-text">
      <Toaster position="top-right" richColors />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SocketProvider socket={socket}>
          <SessionProvider>
            <PluginProvider>
              <TabProvider defaultCwd={config.defaultCwd}>
                <WorkspaceLayout />
              </TabProvider>
            </PluginProvider>
          </SessionProvider>
        </SocketProvider>
      </ErrorBoundary>
    </div>
  );
}
