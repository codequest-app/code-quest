import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { ErrorFallback } from './components/workspace/ErrorFallback';
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout';
import { AppInitProvider } from './contexts/AppInitContext';
import { FsProvider } from './contexts/FsContext';
import { GitProvider } from './contexts/GitContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { OpenspecProvider } from './contexts/OpenspecContext';
import { PluginProvider } from './contexts/PluginContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { SessionProvider } from './contexts/SessionContext';
import { SocketProvider } from './contexts/SocketContext';
import { useEffectiveColorTheme } from './hooks/useEffectiveColorTheme';
import { createSocket } from './socket/client';
import { usePreferencesStore } from './stores/usePreferencesStore';
import './App.css';

export function App(): React.JSX.Element {
  const [socket] = useState(() => createSocket());
  const effectiveColorTheme = useEffectiveColorTheme();
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const density = usePreferencesStore((s) => s.density);

  useEffect(() => {
    const ds = document.documentElement.dataset;
    ds.theme = effectiveColorTheme;
    ds.font = fontSize;
    ds.density = density;
  }, [effectiveColorTheme, fontSize, density]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg text-text">
      <Toaster position="top-right" richColors />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SocketProvider socket={socket}>
          <AppInitProvider>
            <SessionProvider>
              <PluginProvider>
                <ProjectProvider>
                  <NavigationProvider>
                    <GitProvider>
                      <FsProvider>
                        <OpenspecProvider>
                          <WorkspaceLayout />
                        </OpenspecProvider>
                      </FsProvider>
                    </GitProvider>
                  </NavigationProvider>
                </ProjectProvider>
              </PluginProvider>
            </SessionProvider>
          </AppInitProvider>
        </SocketProvider>
      </ErrorBoundary>
    </div>
  );
}
