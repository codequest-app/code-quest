import { useEffect, useRef } from 'react';
import { Terminal, TerminalHandle } from '../Terminal';
import { useSocket } from '../../hooks/useSocket';
import { useTerminalStore } from '../../stores/terminalStore';

interface TerminalTabsProps {
  serverUrl: string;
  className?: string;
}

/**
 * TerminalTabs component
 * Manages multiple terminal tabs with serialize/restore for tab switching
 * Only one xterm instance exists at a time to save resources
 */
export function TerminalTabs({ serverUrl, className = '' }: TerminalTabsProps) {
  const { socket, emit } = useSocket(serverUrl);
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
    setSerializedState,
    appendPendingData,
  } = useTerminalStore();

  const sessions = getSessions();
  const activeSession = getActiveSession();
  const terminalRef = useRef<TerminalHandle>(null);
  const previousSessionIdRef = useRef<string | null>(null);
  const initialContentRef = useRef<string | undefined>(undefined);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

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

    const handleTerminalError = (message: string) => {
      setSocketError(message);
    };

    // Register all listeners directly on socket
    socket.on('terminal:created', handleCreated);
    socket.on('terminal:exit', handleExit);
    socket.on('terminal:error', handleTerminalError);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Check initial connection state (socket may already be connected)
    if (socket.connected) {
      setSocketConnected(true);
    }

    // Cleanup: remove all listeners
    return () => {
      socket.off('terminal:created', handleCreated);
      socket.off('terminal:exit', handleExit);
      socket.off('terminal:error', handleTerminalError);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket, addSession, removeSession, setSocketConnected, setSocketError]);

  // Buffer data for inactive sessions
  useEffect(() => {
    if (!socket) return;

    const handleData = (sessionId: string, data: string) => {
      // If data is for an inactive session, buffer it
      if (sessionId !== activeSessionId) {
        appendPendingData(sessionId, data);
      }
      // Active session data is handled by Terminal component directly
    };

    socket.on('terminal:data', handleData);
    return () => {
      socket.off('terminal:data', handleData);
    };
  }, [socket, activeSessionId, appendPendingData]);

  // Serialize before switching away from a session, and prepare initial content for new active session
  useEffect(() => {
    const prevId = previousSessionIdRef.current;
    if (prevId && prevId !== activeSessionId && terminalRef.current) {
      const serialized = terminalRef.current.serialize();
      if (serialized) {
        setSerializedState(prevId, serialized);
      }
    }
    // Prepare initial content for the new active session
    if (activeSessionId) {
      const store = useTerminalStore.getState();
      const serialized = store.getSerializedState(activeSessionId);
      const pending = store.consumePendingData(activeSessionId);
      if (serialized || pending.length > 0) {
        initialContentRef.current = (serialized || '') + pending.join('');
      } else {
        initialContentRef.current = undefined;
      }
    } else {
      initialContentRef.current = undefined;
    }
    previousSessionIdRef.current = activeSessionId;
  }, [activeSessionId, setSerializedState]);

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
    // Serialize current terminal before creating new one
    if (activeSessionId && terminalRef.current) {
      const serialized = terminalRef.current.serialize();
      if (serialized) {
        setSerializedState(activeSessionId, serialized);
      }
    }
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
            <div
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
            </div>
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

      {/* Terminal content - only render active terminal */}
      <div className="terminal-content">
        {sessions.length === 0 && (
          <div className="empty-state">
            No terminals open. Click "+ New" to create one.
          </div>
        )}
        {activeSession && (
          <div
            key={activeSession.id}
            className="terminal-wrapper"
            style={{ width: '100%', height: '100%' }}
          >
            <Terminal
              ref={terminalRef}
              sessionId={activeSession.id}
              serverUrl={serverUrl}
              initialContent={initialContentRef.current}
            />
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
          min-height: 400px;
          position: relative;
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
