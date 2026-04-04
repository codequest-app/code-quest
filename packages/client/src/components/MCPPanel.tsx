import type {
  ChromeMcpState,
  DebuggerMcpState,
  JupyterMcpState,
  McpServerInfo,
  McpTool,
} from '@code-quest/shared';
import { useEffect, useRef, useState } from 'react';
import { McpServerRow } from './McpServerRow';

function McpStateBadge({ state, label }: { state: string; label: string }) {
  const color =
    state === 'connected' || state === 'active'
      ? 'bg-success'
      : state === 'connecting' || state === 'available'
        ? 'bg-warning'
        : state === 'error'
          ? 'bg-danger'
          : 'bg-text-muted';
  return (
    <span
      role="img"
      className={`inline-block w-2 h-2 rounded-full ${color} shrink-0`}
      aria-label={label}
      title={label}
    />
  );
}

const CODE_INPUT =
  'bg-code-block border border-border rounded px-2 py-1 text-xs font-mono text-text';

interface MCPPanelProps {
  servers: McpServerInfo[];
  onToggle: (serverName: string, enabled: boolean) => void | Promise<void>;
  onReconnect: (serverName: string) => void | Promise<void>;
  onRefresh: () => void;
  onSendMessage?: (serverName: string, message: Record<string, unknown>) => Promise<unknown>;
  onSetServers?: (servers: Record<string, unknown>) => Promise<unknown>;
  onListTools?: (serverName: string) => Promise<McpTool[]>;
  onAuthenticate?: (
    serverName: string,
  ) => Promise<{ success: boolean; authUrl?: string; error?: string }>;
  onOAuthCallback?: (
    serverName: string,
    callbackUrl: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onClearAuth?: (serverName: string) => Promise<{ success: boolean; error?: string }>;
  chromeMcpState?: ChromeMcpState;
  debuggerMcpState?: DebuggerMcpState;
  jupyterMcpState?: JupyterMcpState;
}

function useFeedback() {
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFeedback({ message, type });
    timerRef.current = setTimeout(() => setFeedback(null), 3000);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { feedback, showFeedback };
}

export function MCPPanel({
  servers,
  onToggle,
  onReconnect,
  onRefresh,
  onSendMessage,
  onSetServers,
  onListTools,
  onAuthenticate,
  onOAuthCallback,
  onClearAuth,
  chromeMcpState,
  debuggerMcpState,
  jupyterMcpState,
}: MCPPanelProps) {
  const { feedback, showFeedback } = useFeedback();

  return (
    <div className="flex flex-col bg-surface border-r border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-text">MCP Servers</span>
        <button
          type="button"
          title="Refresh"
          onClick={onRefresh}
          className="text-text-muted hover:text-text text-sm"
        >
          ↻
        </button>
      </div>
      {(chromeMcpState || debuggerMcpState || jupyterMcpState) && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border text-[11px] text-text-muted">
          {chromeMcpState && (
            <span className="flex items-center gap-1">
              <McpStateBadge
                state={chromeMcpState.status}
                label={`Chrome MCP: ${chromeMcpState.status}`}
              />
              Chrome
            </span>
          )}
          {debuggerMcpState && (
            <span className="flex items-center gap-1">
              <McpStateBadge
                state={debuggerMcpState.status}
                label={`Debugger MCP: ${debuggerMcpState.status}`}
              />
              Debugger
            </span>
          )}
          {jupyterMcpState && (
            <span className="flex items-center gap-1">
              <McpStateBadge
                state={jupyterMcpState.status}
                label={`Jupyter MCP: ${jupyterMcpState.status}`}
              />
              Jupyter
            </span>
          )}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {servers.length === 0 && (
          <div className="px-4 py-8 text-center text-text-muted text-sm">No MCP servers</div>
        )}
        {servers.map((s) => (
          <McpServerRow
            key={s.name}
            server={s}
            onToggle={onToggle}
            onReconnect={onReconnect}
            onListTools={onListTools}
            onAuthenticate={onAuthenticate}
            onOAuthCallback={onOAuthCallback}
            onClearAuth={onClearAuth}
            showFeedback={showFeedback}
          />
        ))}
      </div>
      {feedback && (
        <output
          className={`block px-4 py-2 text-[11px] ${feedback.type === 'success' ? 'text-success' : 'text-danger'}`}
        >
          {feedback.message}
        </output>
      )}
      {onSetServers && (
        <McpAddServer onAdd={onSetServers} onRefresh={onRefresh} showFeedback={showFeedback} />
      )}
      {onSendMessage && <McpSendMessage onSend={onSendMessage} />}
    </div>
  );
}

function McpAddServer({
  onAdd,
  onRefresh,
  showFeedback,
}: {
  onAdd: (servers: Record<string, unknown>) => Promise<unknown>;
  onRefresh: () => void;
  showFeedback: (message: string, type: 'success' | 'error') => void;
}) {
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');

  const handleAdd = async () => {
    if (!name.trim() || !command.trim()) return;
    try {
      await onAdd({ [name]: { command } });
      showFeedback(`${name} added`, 'success');
      setName('');
      setCommand('');
      onRefresh();
    } catch {
      showFeedback(`Failed to add ${name}`, 'error');
    }
  };

  return (
    <div className="px-4 py-3 border-t border-border flex flex-col gap-2">
      <span className="text-[11px] text-text-muted font-medium">Add Server</span>
      <input
        type="text"
        placeholder="Server name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={CODE_INPUT}
      />
      <input
        type="text"
        placeholder="Command"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        className={CODE_INPUT}
      />
      <button
        type="button"
        onClick={handleAdd}
        className="text-xs px-3 py-1 rounded bg-accent text-white hover:bg-accent/80 self-end"
      >
        Add
      </button>
    </div>
  );
}

function McpSendMessage({
  onSend,
}: {
  onSend: (name: string, msg: Record<string, unknown>) => Promise<unknown>;
}) {
  const [serverName, setServerName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setError(null);
    try {
      const parsed = JSON.parse(message);
      await onSend(serverName, parsed);
      setMessage('');
    } catch {
      setError('Invalid JSON');
    }
  };

  return (
    <div className="px-4 py-3 border-t border-border flex flex-col gap-2">
      <span className="text-[11px] text-text-muted font-medium">Send Message</span>
      <input
        type="text"
        placeholder="Server name"
        value={serverName}
        onChange={(e) => setServerName(e.target.value)}
        className={CODE_INPUT}
      />
      <textarea
        placeholder="Message (JSON)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="bg-code-block border border-border rounded px-2 py-1 text-xs font-mono text-text resize-y min-h-[40px]"
      />
      {error && <span className="text-danger text-[11px]">{error}</span>}
      <button
        type="button"
        onClick={handleSend}
        className="text-xs px-3 py-1 rounded bg-accent text-white hover:bg-accent/80 self-end"
      >
        Send
      </button>
    </div>
  );
}
