import { useEffect } from 'react';
import { Terminal } from '../Terminal';
import { useSocket } from '../../hooks/useSocket';
import { useTerminalStore } from '../../stores/terminalStore';

interface TerminalTabsProps {
  serverUrl: string;
  className?: string;
}

/**
 * TerminalTabs component
 * Manages multiple terminal tabs with tab navigation
 */
export function TerminalTabs({ serverUrl, className = '' }: TerminalTabsProps) {
  const { on, emit } = useSocket(serverUrl);
  const {
    getSessions,
    activeSessionId,
    socketState,
    addSession,
    removeSession,
    setActiveSession,
    setSocketConnected,
    setSocketError,
    getActiveSession,
  } = useTerminalStore();

  const sessions = getSessions();
  const activeSession = getActiveSession();

  // Handle socket events
  useEffect(() => {
    // Terminal created
    const handleCreated = (sessionId: string, pid: number) => {
      addSession(sessionId, pid);
    };

    // Terminal exit
    const handleExit = (sessionId: string) => {
      removeSession(sessionId);
    };

    // Connection events
    const handleConnect = () => {
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleConnectError = (error: Error) => {
      setSocketError(error.message);
    };

    on('terminal:created', handleCreated);
    on('terminal:exit', handleExit);
    on('connect', handleConnect as any);
    on('disconnect', handleDisconnect as any);
    on('connect_error', handleConnectError as any);
  }, [on, addSession, removeSession, setSocketConnected, setSocketError]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T: New terminal
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        handleNewTerminal();
      }

      // Ctrl+W: Close active terminal
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        if (activeSessionId) {
          handleCloseTerminal(activeSessionId);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSessionId]);

  const handleNewTerminal = () => {
    emit('terminal:create', {});
  };

  const handleCloseTerminal = (sessionId: string) => {
    emit('terminal:kill', sessionId);
  };

  const handleTabClick = (sessionId: string) => {
    if (sessionId !== activeSessionId) {
      setActiveSession(sessionId);
    }
  };

  return (
    <div className={`terminal-tabs ${className}`} data-testid="terminal-tabs">
      {/* Header with tabs */}
      <div className="tabs-header">
        <div className="tabs-list">
          {sessions.map((session, index) => (
            <button
              key={session.id}
              className={`tab ${session.isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(session.id)}
            >
              <span>Terminal {index + 1}</span>
              <button
                className="close-button"
                aria-label="close"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTerminal(session.id);
                }}
              >
                ×
              </button>
            </button>
          ))}
          <button className="new-tab-button" onClick={handleNewTerminal}>
            + New
          </button>
        </div>

        {/* Connection status */}
        <div
          className={`connection-status ${socketState.connected ? 'connected' : 'disconnected'}`}
          data-testid="connection-status"
        >
          {socketState.connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Error message */}
      {socketState.error && (
        <div className="error-message">{socketState.error}</div>
      )}

      {/* Terminal content */}
      <div className="terminal-content">
        {activeSession ? (
          <Terminal
            key={activeSession.id}
            sessionId={activeSession.id}
            serverUrl={serverUrl}
          />
        ) : (
          <div className="empty-state">
            No terminals open. Click "+ New" to create one.
          </div>
        )}
      </div>

      <style>{`
        .terminal-tabs {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: #1e1e1e;
          color: #ffffff;
        }

        .tabs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
          padding: 0 8px;
        }

        .tabs-list {
          display: flex;
          gap: 4px;
          flex: 1;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: #cccccc;
          cursor: pointer;
          transition: background 0.2s;
        }

        .tab:hover {
          background: #3e3e42;
        }

        .tab.active {
          background: #1e1e1e;
          color: #ffffff;
        }

        .close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          padding: 0;
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }

        .close-button:hover {
          background: #ff4444;
          border-radius: 3px;
        }

        .new-tab-button {
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: #cccccc;
          cursor: pointer;
          transition: background 0.2s;
        }

        .new-tab-button:hover {
          background: #3e3e42;
        }

        .connection-status {
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 3px;
        }

        .connection-status.connected {
          color: #0dbc79;
        }

        .connection-status.disconnected {
          color: #ff4444;
        }

        .error-message {
          padding: 8px 12px;
          background: #ff4444;
          color: #ffffff;
          font-size: 14px;
        }

        .terminal-content {
          flex: 1;
          overflow: hidden;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6c6c6c;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
