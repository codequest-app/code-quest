import { useCallback, useEffect, useRef, useState } from 'react';
import { useBattleEngine } from '../../hooks/useBattleEngine';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useOrchestratorSocket } from '../../hooks/useOrchestratorSocket';
import { useSocket } from '../../hooks/useSocket';
import { useBattleStore } from '../../stores/battleStore';
import { useChatStore } from '../../stores/chatStore';
import { useTerminalStore } from '../../stores/terminalStore';
import type { SessionType } from '../../types';
import { BankPanel } from '../Bank/BankPanel';
import { BattleOverlay } from '../Battle';
import { ChatPanel } from '../ChatPanel';
import { KeyboardShortcutsPanel } from '../ChatPanel/KeyboardShortcutsPanel';
import { MapView } from '../Map/MapView';
import type { CommandMenuItem } from '../Menu';
import { CommandMenu } from '../Menu';
import { OrchestratorPage } from '../OrchestratorPanel';
import { Terminal, type TerminalHandle } from '../Terminal';
import { ProviderSelectDialog } from './ProviderSelectDialog';

interface TerminalTabsProps {
  serverUrl: string;
  className?: string;
}

function getTabLabel(type: SessionType, index: number): string {
  switch (type) {
    case 'claude-chat':
      return `Claude ${index}`;
    case 'gemini-chat':
      return `Gemini ${index}`;
    case 'orchestrator':
      return `Orchestrator ${index}`;
    case 'map':
      return `Map ${index}`;
    default:
      return `Terminal ${index}`;
  }
}

/**
 * TerminalTabs component
 * Manages multiple terminal tabs with serialize/restore for tab switching
 * Only one xterm instance exists at a time to save resources
 */
export function TerminalTabs({ serverUrl, className = '' }: TerminalTabsProps) {
  const { socket, emit } = useSocket(serverUrl);
  const {
    createChat,
    killChat,
    sendMessage,
    abortMessage,
    allowTool,
    sendControl,
    respondToControl,
  } = useChatSocket(serverUrl);
  const {
    createOrchestrator,
    dispatch: dispatchOrchestrator,
    synthesize: synthesizeOrchestrator,
    abortOrchestrator,
    killOrchestrator,
    retryWorker: retryOrchestratorWorker,
    skipWorker: skipOrchestratorWorker,
  } = useOrchestratorSocket(serverUrl);
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);

  // Counters for tab labels
  const tabCounters = useRef({ terminal: 0, claude: 0, gemini: 0, orchestrator: 0, map: 0 });
  const tabLabels = useRef(new Map<string, string>());

  // Wire RPG battle engine to all chat sessions
  useBattleEngine();

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
      emit('terminal:list');
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

    // Restore existing sessions on reconnect
    const handleTerminalList = (sessionIds: string[]) => {
      for (const id of sessionIds) {
        if (!useTerminalStore.getState().getSession(id)) {
          addSession(id, 0);
        }
      }
    };

    // Register all listeners directly on socket
    socket.on('terminal:created', handleCreated);
    socket.on('terminal:exit', handleExit);
    socket.on('terminal:error', handleTerminalError);
    socket.on('terminal:list', handleTerminalList);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Check initial connection state (socket may already be connected)
    if (socket.connected) {
      setSocketConnected(true);
      emit('terminal:list');
    }

    // Cleanup: remove all listeners
    return () => {
      socket.off('terminal:created', handleCreated);
      socket.off('terminal:exit', handleExit);
      socket.off('terminal:error', handleTerminalError);
      socket.off('terminal:list', handleTerminalList);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket, emit, addSession, removeSession, setSocketConnected, setSocketError]);

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

  // Compute initial content synchronously during render (not in useEffect)
  // Read pending data without consuming to avoid state mutation during render
  const initialContent = (() => {
    if (activeSession?.type === 'terminal' && activeSessionId) {
      const store = useTerminalStore.getState();
      const serialized = store.getSerializedState(activeSessionId);
      const pending = store.pendingData.get(activeSessionId) || [];
      if (serialized || pending.length > 0) {
        return (serialized || '') + pending.join('');
      }
    }
    return undefined;
  })();

  // Clear pending data and serialized state after Terminal mounts with the content
  useEffect(() => {
    if (activeSession?.type === 'terminal' && activeSessionId) {
      const store = useTerminalStore.getState();
      if (store.pendingData.has(activeSessionId)) {
        store.consumePendingData(activeSessionId);
      }
    }
  }, [activeSessionId, activeSession?.type]);

  const handleNewTerminal = useCallback(() => {
    // Serialize current terminal before creating new one
    if (activeSessionId && terminalRef.current) {
      const activeSessionState = useTerminalStore.getState().getSession(activeSessionId);
      if (activeSessionState?.type === 'terminal') {
        const serialized = terminalRef.current.serialize();
        if (serialized) {
          setSerializedState(activeSessionId, serialized);
        }
      }
    }
    emit('terminal:create', {});
  }, [activeSessionId, emit, setSerializedState]);

  const handleNewClaude = () => {
    createChat('claude');
  };

  const handleNewGemini = () => {
    createChat('gemini');
  };

  const handleNewOrchestrator = () => {
    setProviderDialogOpen(true);
  };

  const handleNewMap = () => {
    const id = `map-${Date.now()}`;
    addSession(id, 0, 'map');
  };

  const handleCloseSession = useCallback(
    (sessionId: string) => {
      const session = useTerminalStore.getState().getSession(sessionId);
      if (session?.type === 'map') {
        removeSession(sessionId);
      } else if (session?.type === 'terminal') {
        emit('terminal:kill', sessionId);
      } else if (session?.type === 'orchestrator') {
        killOrchestrator(sessionId);
        removeSession(sessionId);
      } else {
        killChat(sessionId);
        removeSession(sessionId);
      }
    },
    [emit, killOrchestrator, removeSession, killChat],
  );

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
          handleCloseSession(activeSessionId);
        }
      }

      // Ctrl+B: Toggle bank panel
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setBankOpen((prev) => !prev);
      }

      // ? key: toggle keyboard shortcuts (only when not in input)
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setShortcutsOpen((prev) => !prev);
        }
      }

      // Ctrl+/: toggle keyboard shortcuts
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }

      // Tab key: toggle command menu (only when not in terminal/input)
      if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setMenuOpen((prev) => !prev);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSessionId, handleCloseSession, handleNewTerminal]);

  const handleTabClick = (sessionId: string) => {
    if (sessionId !== activeSessionId) {
      // Serialize current terminal before switching
      if (activeSessionId && terminalRef.current) {
        const currentSession = useTerminalStore.getState().getSession(activeSessionId);
        if (currentSession?.type === 'terminal') {
          const serialized = terminalRef.current.serialize();
          if (serialized) {
            setSerializedState(activeSessionId, serialized);
          }
        }
      }
      setActiveSession(sessionId);
    }
  };

  // Generate tab label with incrementing counter per type
  const getLabel = (session: { id: string; type: SessionType }) => {
    if (!tabLabels.current.has(session.id)) {
      switch (session.type) {
        case 'claude-chat':
          tabLabels.current.set(
            session.id,
            getTabLabel(session.type, ++tabCounters.current.claude),
          );
          break;
        case 'gemini-chat':
          tabLabels.current.set(
            session.id,
            getTabLabel(session.type, ++tabCounters.current.gemini),
          );
          break;
        case 'orchestrator':
          tabLabels.current.set(
            session.id,
            getTabLabel(session.type, ++tabCounters.current.orchestrator),
          );
          break;
        case 'map':
          tabLabels.current.set(session.id, getTabLabel(session.type, ++tabCounters.current.map));
          break;
        default:
          tabLabels.current.set(
            session.id,
            getTabLabel(session.type, ++tabCounters.current.terminal),
          );
          break;
      }
    }
    return tabLabels.current.get(session.id) ?? '';
  };

  // Build command menu items
  const battles = useBattleStore((s) => s.battles);
  const menuItems: CommandMenuItem[] = sessions.map((session) => {
    const battle = battles.get(session.id);
    const isActive = battle?.phase === 'active';
    return {
      id: session.id,
      label: getLabel(session),
      hasBattle: isActive,
      battleHpPercent:
        isActive && battle ? Math.round((battle.enemy.hp / battle.enemy.maxHp) * 100) : undefined,
      needsAttention: battle?.isPaused,
    };
  });

  return (
    <div className={`terminal-tabs ${className}`} data-testid="terminal-tabs">
      {/* Header with tabs */}
      <div className="tabs-header">
        <div className="tabs-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              role="tab"
              tabIndex={0}
              className={`tab ${session.isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(session.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTabClick(session.id);
                }
              }}
            >
              <span>
                {battles.has(session.id) && battles.get(session.id)?.phase === 'active' && '⚔ '}
                {getLabel(session)}
              </span>
              <button
                type="button"
                className="close-button"
                aria-label="close"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseSession(session.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="new-tab-button" onClick={handleNewTerminal}>
            + Terminal
          </button>
          <button
            type="button"
            className="new-tab-button"
            aria-label="Claude"
            onClick={handleNewClaude}
          >
            + Claude
          </button>
          <button
            type="button"
            className="new-tab-button"
            aria-label="Gemini"
            onClick={handleNewGemini}
          >
            + Gemini
          </button>
          <button
            type="button"
            className="new-tab-button"
            aria-label="Orchestrator"
            onClick={handleNewOrchestrator}
          >
            + Orchestrator
          </button>
          <button type="button" className="new-tab-button" aria-label="Map" onClick={handleNewMap}>
            + Map
          </button>
        </div>

        {/* Bank toggle + Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="new-tab-button"
            data-testid="bank-toggle"
            onClick={() => setBankOpen((prev) => !prev)}
          >
            💰 Bank
          </button>
          <div
            className={`connection-status ${socketState.connected ? 'connected' : 'disconnected'}`}
            data-testid="connection-status"
          >
            {socketState.connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Command Menu overlay */}
      {menuOpen && (
        <CommandMenu
          items={menuItems}
          activeId={activeSessionId ?? undefined}
          onSelect={(id) => handleTabClick(id)}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {/* Provider select dialog for orchestrator */}
      {providerDialogOpen && (
        <ProviderSelectDialog
          onSelect={(provider) => {
            setProviderDialogOpen(false);
            createOrchestrator(provider);
          }}
          onClose={() => setProviderDialogOpen(false)}
        />
      )}

      {/* Keyboard shortcuts overlay */}
      {shortcutsOpen && <KeyboardShortcutsPanel onClose={() => setShortcutsOpen(false)} />}

      {/* Bank panel overlay */}
      {bankOpen && (
        <div
          className="bank-overlay"
          style={{
            position: 'absolute',
            top: '40px',
            right: '8px',
            zIndex: 30,
            minWidth: '320px',
          }}
          data-testid="bank-overlay"
        >
          <BankPanel />
        </div>
      )}

      {/* Error message */}
      {socketState.error && <div className="error-message">{socketState.error}</div>}

      {/* Content area - render Terminal or ChatPanel based on session type */}
      <div className="terminal-content">
        {sessions.length === 0 && (
          <div className="empty-state">
            No sessions open. Click "+ Terminal", "+ Claude", "+ Gemini", or "+ Orchestrator" to
            start.
          </div>
        )}
        {activeSession && activeSession.type === 'terminal' && (
          <div
            key={activeSession.id}
            className="terminal-wrapper"
            style={{ width: '100%', height: '100%' }}
          >
            <Terminal
              ref={terminalRef}
              sessionId={activeSession.id}
              serverUrl={serverUrl}
              initialContent={initialContent}
            />
          </div>
        )}
        {activeSession &&
          (activeSession.type === 'claude-chat' || activeSession.type === 'gemini-chat') && (
            <div
              key={activeSession.id}
              className="chat-wrapper"
              style={{ width: '100%', height: '100%' }}
            >
              <ChatPanel
                sessionId={activeSession.id}
                onSend={sendMessage}
                onAbort={abortMessage}
                onAllowTool={allowTool}
                onModelChange={(sid, model) => sendControl(sid, 'set_model', { model })}
                onStyleChange={(sid, style) =>
                  sendControl(sid, 'set_output_style', { output_style: style })
                }
                onModeChange={(sid, mode) =>
                  sendControl(sid, 'set_permission_mode', { permission_mode: mode })
                }
                onInterrupt={(sid) => sendControl(sid, 'interrupt')}
                onTokensChange={(sid, tokens) =>
                  sendControl(sid, 'set_thinking_tokens', { max_thinking_tokens: tokens })
                }
                onMcpToggle={(sid, name) => sendControl(sid, 'mcp_toggle', { server_name: name })}
                onMcpReconnect={(sid, name) =>
                  sendControl(sid, 'mcp_reconnect', { server_name: name })
                }
                onMcpRefresh={(sid) => sendControl(sid, 'mcp_status')}
                onRespondControl={(sid, requestId, response) =>
                  respondToControl(sid, requestId, response)
                }
              />
              <BattleOverlay
                sessionId={activeSession.id}
                onQuestionAnswer={(sid, answer) => {
                  useChatStore.getState().clearPendingQuestion(sid);
                  sendMessage(sid, answer);
                }}
                onAllowTool={(sid, toolName) => {
                  allowTool(sid, toolName);
                }}
                onDenyTool={(sid) => {
                  useChatStore.getState().clearPendingPermission(sid);
                }}
              />
            </div>
          )}
        {activeSession && activeSession.type === 'orchestrator' && (
          <div
            key={activeSession.id}
            className="chat-wrapper"
            style={{ width: '100%', height: '100%' }}
          >
            <OrchestratorPage
              orchestratorId={activeSession.id}
              onSendCoordinator={sendMessage}
              onAbortCoordinator={abortMessage}
              onDispatch={dispatchOrchestrator}
              onSynthesize={synthesizeOrchestrator}
              onAbort={abortOrchestrator}
              onRetryWorker={retryOrchestratorWorker}
              onSkipWorker={skipOrchestratorWorker}
            />
          </div>
        )}
        {activeSession && activeSession.type === 'map' && (
          <div
            key={activeSession.id}
            className="chat-wrapper"
            style={{ width: '100%', height: '100%' }}
          >
            <MapView />
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

        .chat-wrapper {
          overflow: hidden;
          position: relative;
        }
      `}</style>
    </div>
  );
}
