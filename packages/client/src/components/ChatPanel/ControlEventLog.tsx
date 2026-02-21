import { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';

interface ControlEventLogProps {
  sessionId: string;
}

export function ControlEventLog({ sessionId }: ControlEventLogProps) {
  const [expanded, setExpanded] = useState(false);
  const session = useChatStore((state) => state.getChatSession(sessionId));
  const log = session?.controlEventLog;

  if (!log || log.length === 0) {
    return null;
  }

  return (
    <div className="control-event-log" data-testid="control-event-log">
      <button
        type="button"
        className="control-event-log-toggle"
        data-testid="control-event-log-toggle"
        onClick={() => setExpanded((prev) => !prev)}
      >
        Control Events ({log.length})
      </button>
      {expanded && (
        <div className="control-event-log-entries" data-testid="control-event-log-entries">
          {log.map((entry) => (
            <div key={entry.id} className="log-entry">
              <span className="log-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              <span className="log-direction" data-testid="log-direction">
                {entry.direction === 'sent' ? '\u2192' : '\u2190'}
              </span>
              <span className="log-type">{entry.type}</span>
              <span className="log-payload">
                {entry.payload ? JSON.stringify(entry.payload).slice(0, 80) : ''}
              </span>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .control-event-log {
          border-bottom: 1px solid #3e3e42;
        }
        .control-event-log-toggle {
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
        .control-event-log-toggle:hover {
          background: #3e3e42;
        }
        .control-event-log-entries {
          padding: 4px 12px;
          background: #252526;
          font-size: 11px;
          color: #d4d4d4;
          max-height: 200px;
          overflow-y: auto;
        }
        .log-entry {
          display: flex;
          gap: 8px;
          padding: 2px 0;
          font-family: monospace;
        }
        .log-time {
          color: #6c6c6c;
        }
        .log-direction {
          width: 16px;
          text-align: center;
        }
        .log-type {
          color: #4ec9b0;
          min-width: 80px;
        }
        .log-payload {
          color: #9e9e9e;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
