import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { ErrorFallback } from './components/ErrorFallback';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import { AppReadinessProvider } from './contexts/AppReadinessContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { PluginProvider } from './contexts/PluginContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { SessionProvider } from './contexts/SessionContext';
import { SocketProvider } from './contexts/SocketContext';
import { WorktreeProvider } from './contexts/WorktreeContext';
import { useEffectiveColorTheme } from './hooks/useEffectiveColorTheme';
import { createSocket } from './socket/client';
import { usePreferencesStore } from './stores/usePreferencesStore';
import './App.css';

export function App() {
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
          <AppReadinessProvider>
            <SessionProvider>
              <PluginProvider>
                <ProjectProvider>
                  <NavigationProvider>
                    <WorktreeProvider>
                      <WorkspaceLayout />
                    </WorktreeProvider>
                  </NavigationProvider>
                </ProjectProvider>
              </PluginProvider>
            </SessionProvider>
          </AppReadinessProvider>
        </SocketProvider>
      </ErrorBoundary>
    </div>
  );
}
