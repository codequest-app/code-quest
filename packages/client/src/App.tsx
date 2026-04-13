import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { ErrorFallback } from './components/ErrorFallback';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import { PluginProvider } from './contexts/PluginContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ResumeProvider } from './contexts/ResumeContext';
import { SessionProvider } from './contexts/SessionContext';
import { SocketProvider } from './contexts/SocketContext';
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
            <ResumeProvider>
              <PluginProvider>
                <ProjectProvider>
                  <WorkspaceLayout />
                </ProjectProvider>
              </PluginProvider>
            </ResumeProvider>
          </SessionProvider>
        </SocketProvider>
      </ErrorBoundary>
    </div>
  );
}
