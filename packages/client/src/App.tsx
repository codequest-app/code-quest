import { QueryClientProvider } from '@tanstack/react-query';
import type { FallbackProps } from 'react-error-boundary';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { queryClient } from './api/query-client.ts';
import { TerminalTabs } from './components/TerminalTabs';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div role="alert" style={{ padding: 24, color: '#ff4444' }}>
      <h2>Something went wrong</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>
      <button type="button" onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  );
}

/**
 * Code Quest Client - Main Application
 *
 * Features:
 * - Multi-terminal tab interface
 * - Real-time WebSocket communication
 * - Keyboard shortcuts (Ctrl+T: new terminal, Ctrl+W: close terminal)
 * - Connection status indicator
 */
export function App() {
  // Get server URL from environment or use default
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => queryClient.clear()}>
        <div style={{ width: '100vw', height: '100vh' }}>
          <TerminalTabs serverUrl={serverUrl} />
        </div>
      </ErrorBoundary>
      <Toaster position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  );
}
