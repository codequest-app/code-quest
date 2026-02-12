import { useState } from 'react';

interface ThinkingBlockProps {
  content: string;
}

export function ThinkingBlock({ content }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="thinking-block" data-testid="thinking-block">
      <button
        className="thinking-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="thinking-icon">{expanded ? '▼' : '▶'}</span>
        <span className="thinking-label">Thinking...</span>
      </button>
      {expanded && (
        <div className="thinking-content">{content}</div>
      )}

      <style>{`
        .thinking-block {
          margin: 4px 0;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          overflow: hidden;
        }
        .thinking-header {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 6px 10px;
          background: #1a2a1a;
          border: none;
          color: #6a9955;
          cursor: pointer;
          font-size: 13px;
          text-align: left;
        }
        .thinking-header:hover {
          background: #1e2e1e;
        }
        .thinking-icon {
          font-size: 10px;
        }
        .thinking-label {
          font-style: italic;
        }
        .thinking-content {
          padding: 8px 10px;
          background: #1e1e1e;
          color: #6a9955;
          font-size: 13px;
          font-style: italic;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}
