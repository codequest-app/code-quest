import { TerminalTabs } from './components/TerminalTabs';

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
    <div style={{ width: '100vw', height: '100vh' }}>
      <TerminalTabs serverUrl={serverUrl} />
    </div>
  );
}
