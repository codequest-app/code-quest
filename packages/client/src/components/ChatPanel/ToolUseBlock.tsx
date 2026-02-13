import { useState } from 'react';

interface ToolUseBlockProps {
  name: string;
  input: unknown;
}

export function ToolUseBlock({ name, input }: ToolUseBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="tool-use-block" data-testid="tool-use-block">
      <button
        type="button"
        className="tool-use-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="tool-use-icon">{expanded ? '▼' : '▶'}</span>
        <span className="tool-use-name">{name}</span>
      </button>
      {expanded && <pre className="tool-use-input">{JSON.stringify(input, null, 2)}</pre>}

      <style>{`
        .tool-use-block {
          margin: 4px 0;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          overflow: hidden;
        }
        .tool-use-header {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 6px 10px;
          background: #252526;
          border: none;
          color: #d4d4d4;
          cursor: pointer;
          font-size: 13px;
          text-align: left;
        }
        .tool-use-header:hover {
          background: #2a2d2e;
        }
        .tool-use-icon {
          font-size: 10px;
          color: #888;
        }
        .tool-use-name {
          color: #dcdcaa;
          font-family: monospace;
        }
        .tool-use-input {
          margin: 0;
          padding: 8px 10px;
          background: #1e1e1e;
          color: #aaa;
          font-size: 12px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}
