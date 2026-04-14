import type { McpServerInfo, McpTool, RpcResult } from '@code-quest/shared';
import { useState } from 'react';

const ACTION_LINK_BTN = 'text-text-muted hover:text-accent text-[11px] transition-colors';

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
  onOAuthCallback?: (
    serverName: string,
    callbackUrl: string,
  ) => Promise<RpcResult<Record<string, never>>>;
  onClearAuth?: (serverName: string) => Promise<RpcResult<Record<string, never>>>;
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

  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className={`text-[11px] px-1.5 py-0.5 rounded font-mono shrink-0 ${MCP_STATUS_BADGE[s.status] ?? MCP_STATUS_BADGE._default}`}
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
              try {
                const result = await onListTools(s.name);
                setTools(result);
                setToolsExpanded(true);
              } catch {
                showFeedback(`Failed to list tools for ${s.name}`, 'error');
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
            try {
              await onToggle(s.name, !s.enabled);
              showFeedback(`${s.name} toggled`, 'success');
            } catch {
              showFeedback(`Failed to toggle ${s.name}`, 'error');
            }
          }}
          className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
            s.enabled
              ? 'border-success/30 text-success hover:bg-success/10'
              : 'border-border text-text-muted hover:bg-white/5'
          }`}
        >
          {s.enabled ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          title={`Reconnect ${s.name}`}
          onClick={async () => {
            try {
              await onReconnect(s.name);
              showFeedback(`${s.name} reconnected`, 'success');
            } catch {
              showFeedback(`Failed to reconnect ${s.name}`, 'error');
            }
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
              try {
                const result = await onClearAuth(s.name);
                if (result.ok) {
                  showFeedback(`${s.name} auth cleared`, 'success');
                } else {
                  showFeedback(result.error || 'Clear auth failed', 'error');
                }
              } catch {
                showFeedback(`Failed to clear auth for ${s.name}`, 'error');
              }
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
              try {
                const result = await onAuthenticate(s.name);
                if (result.ok && result.data.authUrl) {
                  setAuthUrl(result.data.authUrl);
                  showFeedback(`Auth URL received for ${s.name}`, 'success');
                } else if (result.ok) {
                  showFeedback(`${s.name} authenticated`, 'success');
                } else {
                  showFeedback(result.error || 'Auth failed', 'error');
                }
              } catch {
                showFeedback(`Failed to authenticate ${s.name}`, 'error');
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
            className="text-[11px] text-accent hover:underline"
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
                  try {
                    const result = await onOAuthCallback(s.name, url);
                    if (result.ok) {
                      showFeedback(`OAuth callback sent for ${s.name}`, 'success');
                      setCallbackInput('');
                      setAuthUrl('');
                    } else {
                      showFeedback(result.error || 'Callback failed', 'error');
                    }
                  } catch {
                    showFeedback(`Failed to submit callback for ${s.name}`, 'error');
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
        <div data-testid={`tools-${s.name}`} className="px-6 pb-3">
          {tools.length === 0 ? (
            <p className="text-[11px] text-text-muted">No tools</p>
          ) : (
            <ul className="space-y-1">
              {tools.map((tool) => (
                <li key={tool.name} className="text-[11px]">
                  <span className="font-mono text-text">{tool.name}</span>
                  {tool.description && (
                    <span className="ml-1 text-text-muted">— {tool.description}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
