import { useCallback, useEffect, useRef, useState } from 'react';
import { socketManager } from '../../services/socket';
import { useChatStore } from '../../stores/chatStore';
import { ChatInput } from './ChatInput';
import { ChatStatusBar } from './ChatStatusBar';
import { CommandPalette } from './CommandPalette';
import { ControlEventLog } from './ControlEventLog';
import { ControlRequestPrompt } from './ControlRequestPrompt';
import { McpStatusPanel } from './McpStatusPanel';
import { MessageBubble } from './MessageBubble';
import { PermissionPrompt } from './PermissionPrompt';
import { QuestionPrompt } from './QuestionPrompt';
import { SessionInfoPanel } from './SessionInfoPanel';

interface ChatPanelProps {
  sessionId: string;
  serverUrl?: string;
  onSend?: (sessionId: string, message: string) => void;
  onAbort?: (sessionId: string) => void;
  onAllowTool?: (sessionId: string, toolName: string) => void;
  onModelChange?: (sessionId: string, model: string) => void;
  onStyleChange?: (sessionId: string, style: string) => void;
  onModeChange?: (sessionId: string, mode: string) => void;
  onInterrupt?: (sessionId: string) => void;
  onTokensChange?: (sessionId: string, tokens: number) => void;
  onMcpToggle?: (sessionId: string, serverName: string) => void;
  onMcpReconnect?: (sessionId: string, serverName: string) => void;
  onMcpRefresh?: (sessionId: string) => void;
  onRespondControl?: (
    sessionId: string,
    requestId: string,
    response: Record<string, unknown>,
  ) => void;
}

export function ChatPanel({
  sessionId,
  onSend,
  onAbort,
  onAllowTool,
  onModelChange,
  onStyleChange,
  onModeChange,
  onInterrupt,
  onTokensChange,
  onMcpToggle,
  onMcpReconnect,
  onMcpRefresh,
  onRespondControl,
}: ChatPanelProps) {
  const session = useChatStore((state) => state.getChatSession(sessionId));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleRespondControl = useCallback(
    (sid: string, requestId: string, response: Record<string, unknown>) => {
      if (onRespondControl) {
        onRespondControl(sid, requestId, response);
      } else {
        socketManager.getCurrentSocket()?.emit('chat:control-respond', sid, requestId, response);
      }
    },
    [onRespondControl],
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, []);

  if (!session) {
    return (
      <div className="chat-panel" data-testid="chat-panel">
        <div className="chat-empty">Session not found</div>
      </div>
    );
  }

  const handlePermissionAllow = () => {
    if (session.pendingPermission) {
      onAllowTool?.(sessionId, session.pendingPermission.toolName);
    }
    useChatStore.getState().clearPendingPermission(sessionId);
  };

  const handlePermissionDeny = () => {
    useChatStore.getState().clearPendingPermission(sessionId);
  };

  const handleQuestionAnswer = (answer: string) => {
    useChatStore.getState().clearPendingQuestion(sessionId);
    onSend?.(sessionId, answer);
  };

  const handleQuestionDismiss = () => {
    useChatStore.getState().clearPendingQuestion(sessionId);
  };

  const handlePermissionAlwaysAllow = () => {
    if (session.pendingPermission) {
      onAllowTool?.(sessionId, session.pendingPermission.toolName);
    }
    useChatStore.getState().clearPendingPermission(sessionId);
  };

  const handleCommandSelect = (commandName: string) => {
    setCommandPaletteOpen(false);
    onSend?.(sessionId, `/${commandName}`);
  };

  return (
    <div className="chat-panel" data-testid="chat-panel">
      <ChatStatusBar
        sessionId={sessionId}
        isProcessing={session.isProcessing}
        onModelChange={(model) => onModelChange?.(sessionId, model)}
        onStyleChange={(style) => onStyleChange?.(sessionId, style)}
        onModeChange={(mode) => onModeChange?.(sessionId, mode)}
        onInterrupt={() => onInterrupt?.(sessionId)}
        onTokensChange={(tokens) => onTokensChange?.(sessionId, tokens)}
      />
      <SessionInfoPanel sessionId={sessionId} />
      <McpStatusPanel
        mcpServers={session.controlInfo?.mcpServers}
        onToggle={(name) => onMcpToggle?.(sessionId, name)}
        onReconnect={(name) => onMcpReconnect?.(sessionId, name)}
        onRefresh={() => onMcpRefresh?.(sessionId)}
      />
      <ControlEventLog sessionId={sessionId} />
      <div className="chat-messages">
        {session.messages.length === 0 && (
          <div className="chat-empty">Start a conversation by typing a message below.</div>
        )}
        {session.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {session.pendingQuestion && (
        <QuestionPrompt
          questions={session.pendingQuestion.questions}
          onAnswer={handleQuestionAnswer}
          onDismiss={handleQuestionDismiss}
        />
      )}

      {session.pendingPermission && (
        <PermissionPrompt
          toolName={session.pendingPermission.toolName}
          description={session.pendingPermission.description}
          onAllow={handlePermissionAllow}
          onDeny={handlePermissionDeny}
          onAlwaysAllow={handlePermissionAlwaysAllow}
        />
      )}

      {session.pendingControlRequests.length > 0 && (
        <div className="control-requests-container">
          {(() => {
            // Group requests by toolName
            const groups = new Map<string, typeof session.pendingControlRequests>();
            for (const req of session.pendingControlRequests) {
              const key = req.toolName ?? req.subtype;
              const group = groups.get(key) ?? [];
              group.push(req);
              groups.set(key, group);
            }
            return Array.from(groups.entries()).map(([key, reqs]) => (
              <ControlRequestPrompt
                key={key}
                requests={reqs}
                onRespondAll={(response) => {
                  for (const req of reqs) {
                    handleRespondControl(sessionId, req.requestId, response);
                    useChatStore.getState().clearPendingControlRequest(sessionId, req.requestId);
                  }
                }}
                onDismiss={() => {
                  for (const req of reqs) {
                    useChatStore.getState().clearPendingControlRequest(sessionId, req.requestId);
                  }
                }}
              />
            ));
          })()}
        </div>
      )}

      <div className="chat-input-wrapper" style={{ position: 'relative' }}>
        {commandPaletteOpen && (
          <CommandPalette
            commands={session.controlInfo?.commands}
            onCommandSelect={handleCommandSelect}
            onClose={() => setCommandPaletteOpen(false)}
          />
        )}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
          {session.controlInfo?.commands && session.controlInfo.commands.length > 0 && (
            <button
              type="button"
              className="command-palette-trigger"
              data-testid="command-palette-trigger"
              onClick={() => setCommandPaletteOpen((prev) => !prev)}
            >
              /
            </button>
          )}
          <div style={{ flex: 1 }}>
            <ChatInput
              onSend={(message) => onSend?.(sessionId, message)}
              onAbort={() => onAbort?.(sessionId)}
              isProcessing={session.isProcessing}
              onSlashTyped={() => setCommandPaletteOpen(true)}
            />
          </div>
        </div>
      </div>

      <style>{`
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1e1e1e;
          color: #d4d4d4;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .chat-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6c6c6c;
          font-size: 14px;
        }
        .command-palette-trigger {
          width: 32px;
          height: 32px;
          background: #2d2d30;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          color: #007acc;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-bottom: 8px;
          margin-left: 12px;
        }
        .command-palette-trigger:hover {
          background: #3e3e42;
        }
        .control-requests-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}
