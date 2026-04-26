import type { Ack, McpServerInfo, McpTool, RpcResult } from '@code-quest/shared';
import { useState } from 'react';
import { cn } from '../utils/cn';

const ACTION_LINK_BTN = 'text-text-muted hover:text-accent text-xs transition-colors';

const MCP_STATUS_BADGE: Partial<Record<McpServerInfo['status'], string>> & { _default: string } = {
  connected: 'bg-success text-white',
  failed: 'bg-danger text-white',
  error: 'bg-danger text-white',
  'needs-auth': 'bg-warning text-black',
  connecting: 'bg-warning text-black',
  disabled: 'bg-text-muted/30 text-text-muted',
  disconnected: 'bg-text-muted/30 text-text-muted',
  _default: 'bg-text-muted/30 text-text-muted',
};

interface McpServerRowProps {
  server: McpServerInfo;
  onToggle: (serverName: string, enabled: boolean) => void | Promise<void>;
  onReconnect: (serverName: string) => void | Promise<void>;
  onListTools?: (serverName: string) => Promise<McpTool[]>;
  onAuthenticate?: (serverName: string) => Promise<RpcResult<{ authUrl?: string }>>;
  onOAuthCallback?: (serverName: string, callbackUrl: string) => Promise<Ack>;
  onClearAuth?: (serverName: string) => Promise<Ack>;
  showFeedback: (message: string, type: 'success' | 'error') => void;
}

export function McpServerRow({
  server: s,
  onToggle,
  onReconnect,
  onListTools,
  onAuthenticate,
  onOAuthCallback,
  onClearAuth,
  showFeedback,
}: McpServerRowProps) {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [callbackInput, setCallbackInput] = useState('');

  const runAction = async <T,>(label: string, fn: () => T | Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch (err) {
      console.error(`McpServerRow ${label} failed for ${s.name}:`, err);
      showFeedback(`Failed to ${label} ${s.name}`, 'error');
      return null;
    }
  };

  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded font-mono shrink-0',
            MCP_STATUS_BADGE[s.status] ?? MCP_STATUS_BADGE._default,
          )}
        >
          {s.status}
        </span>
        <span className="flex-1 text-xs font-mono text-text truncate">{s.name}</span>
        {onListTools && (
          <button
            type="button"
            title={`Tools ${s.name}`}
            onClick={async () => {
              if (toolsExpanded) {
                setToolsExpanded(false);
                return;
              }
              const result = await runAction('list tools for', () => onListTools(s.name));
              if (result) {
                setTools(result);
                setToolsExpanded(true);
              }
            }}
            className={ACTION_LINK_BTN}
          >
            Tools
          </button>
        )}
        <button
          type="button"
          title={`Toggle ${s.name}`}
          onClick={async () => {
            const ok = await runAction('toggle', () => onToggle(s.name, !s.enabled));
            if (ok !== null) showFeedback(`${s.name} toggled`, 'success');
          }}
          className={cn(
            'text-xs px-2 py-0.5 rounded border transition-colors',
            s.enabled
              ? 'border-success/30 text-success hover:bg-success/10'
              : 'border-border text-text-muted hover:bg-white/5',
          )}
        >
          {s.enabled ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          title={`Reconnect ${s.name}`}
          onClick={async () => {
            const ok = await runAction('reconnect', () => onReconnect(s.name));
            if (ok !== null) showFeedback(`${s.name} reconnected`, 'success');
          }}
          className={ACTION_LINK_BTN}
        >
          ↻
        </button>
        {onClearAuth && (
          <button
            type="button"
            title={`Clear Auth ${s.name}`}
            onClick={async () => {
              const result = await runAction('clear auth for', () => onClearAuth(s.name));
              if (result === null) return;
              if (result.ok) showFeedback(`${s.name} auth cleared`, 'success');
              else showFeedback(result.error || 'Clear auth failed', 'error');
            }}
            className={ACTION_LINK_BTN}
          >
            Clear Auth
          </button>
        )}
        {onAuthenticate && (
          <button
            type="button"
            title={`Auth ${s.name}`}
            onClick={async () => {
              const result = await runAction('authenticate', () => onAuthenticate(s.name));
              if (result === null) return;
              if (result.ok && result.data.authUrl) {
                setAuthUrl(result.data.authUrl);
                showFeedback(`Auth URL received for ${s.name}`, 'success');
              } else if (result.ok) {
                showFeedback(`${s.name} authenticated`, 'success');
              } else {
                showFeedback(result.error || 'Auth failed', 'error');
              }
            }}
            className={ACTION_LINK_BTN}
          >
            Auth
          </button>
        )}
      </div>
      {authUrl && (
        <div className="px-4 pb-2">
          <a
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline"
          >
            Complete authentication →
          </a>
          {onOAuthCallback && (
            <div className="flex gap-1 mt-2">
              <input
                type="text"
                placeholder="Callback URL"
                value={callbackInput}
                onChange={(e) => setCallbackInput(e.target.value)}
                className="flex-1 bg-code-block border border-border rounded px-2 py-1 text-xs font-mono text-text"
              />
              <button
                type="button"
                onClick={async () => {
                  const url = callbackInput.trim();
                  if (!url) return;
                  const result = await runAction('submit callback for', () =>
                    onOAuthCallback(s.name, url),
                  );
                  if (result === null) return;
                  if (result.ok) {
                    showFeedback(`OAuth callback sent for ${s.name}`, 'success');
                    setCallbackInput('');
                    setAuthUrl('');
                  } else {
                    showFeedback(result.error || 'Callback failed', 'error');
                  }
                }}
                className="text-xs px-2 py-1 rounded bg-accent text-white hover:bg-accent/80"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      )}
      {toolsExpanded && (
        <section aria-label={`tools-${s.name}`} className="px-6 pb-3">
          {tools.length === 0 ? (
            <p className="text-xs text-text-muted">No tools</p>
          ) : (
            <ul className="space-y-1">
              {tools.map((tool) => (
                <li key={tool.name} className="text-xs">
                  <span className="font-mono text-text">{tool.name}</span>
                  {tool.description && (
                    <span className="ml-1 text-text-muted">— {tool.description}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
