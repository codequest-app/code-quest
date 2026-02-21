import { useState } from 'react';

interface McpServer {
  name: string;
  status: string;
  error?: string;
  scope?: string;
}

interface McpStatusPanelProps {
  mcpServers?: McpServer[];
  onToggle?: (serverName: string) => void;
  onReconnect?: (serverName: string) => void;
}

export function McpStatusPanel({ mcpServers, onToggle, onReconnect }: McpStatusPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!mcpServers || mcpServers.length === 0) {
    return null;
  }

  return (
    <div className="mcp-status-panel" data-testid="mcp-status-panel">
      <button
        type="button"
        className="mcp-header-toggle"
        data-testid="mcp-header-toggle"
        onClick={() => setExpanded((prev) => !prev)}
      >
        MCP Servers ({mcpServers.length})
      </button>
      {expanded && (
        <div className="mcp-server-list" data-testid="mcp-server-list">
          {mcpServers.map((server) => (
            <div
              key={server.name}
              className="mcp-server-item"
              data-testid={`mcp-server-${server.name}`}
            >
              <span
                className={`mcp-status-dot ${server.status === 'connected' ? 'connected' : 'failed'}`}
                data-testid={`mcp-status-${server.name}`}
              />
              <span className="mcp-server-name">{server.name}</span>
              {server.scope && <span className="mcp-server-scope">({server.scope})</span>}
              {server.error && (
                <span className="mcp-server-error" data-testid={`mcp-error-${server.name}`}>
                  {server.error}
                </span>
              )}
              <button
                type="button"
                className="mcp-btn"
                data-testid={`mcp-toggle-${server.name}`}
                onClick={() => onToggle?.(server.name)}
              >
                Toggle
              </button>
              <button
                type="button"
                className="mcp-btn"
                data-testid={`mcp-reconnect-${server.name}`}
                onClick={() => onReconnect?.(server.name)}
              >
                Reconnect
              </button>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .mcp-status-panel {
          border-bottom: 1px solid #3e3e42;
        }
        .mcp-header-toggle {
          display: block;
          width: 100%;
          padding: 6px 12px;
          background: #2d2d30;
          border: none;
          color: #d4d4d4;
          font-size: 12px;
          cursor: pointer;
          text-align: left;
        }
        .mcp-header-toggle:hover {
          background: #3e3e42;
        }
        .mcp-server-list {
          padding: 4px 12px;
          background: #252526;
        }
        .mcp-server-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          font-size: 12px;
          color: #d4d4d4;
        }
        .mcp-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .mcp-status-dot.connected {
          background: #0dbc79;
        }
        .mcp-status-dot.failed {
          background: #ff4444;
        }
        .mcp-server-error {
          color: #ff4444;
          font-size: 11px;
        }
        .mcp-server-scope {
          color: #9e9e9e;
          font-size: 11px;
        }
        .mcp-btn {
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          color: #d4d4d4;
          font-size: 11px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
