import { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';

interface SessionInfoPanelProps {
  sessionId: string;
}

export function SessionInfoPanel({ sessionId }: SessionInfoPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const session = useChatStore((state) => state.getChatSession(sessionId));
  const controlInfo = session?.controlInfo;

  if (!controlInfo) {
    return null;
  }

  return (
    <div className="session-info-panel" data-testid="session-info-panel">
      <button
        type="button"
        className="session-info-toggle"
        data-testid="session-info-toggle"
        onClick={() => setExpanded((prev) => !prev)}
      >
        Session Info
      </button>
      {expanded && (
        <div className="session-info-details" data-testid="session-info-details">
          {controlInfo.account && (
            <>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span>{controlInfo.account.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Subscription:</span>
                <span>{controlInfo.account.subscriptionType}</span>
              </div>
            </>
          )}
          {controlInfo.pid !== undefined && (
            <div className="info-row">
              <span className="info-label">PID:</span>
              <span>{controlInfo.pid}</span>
            </div>
          )}
          {controlInfo.currentModel && (
            <div className="info-row">
              <span className="info-label">Model:</span>
              <span>{controlInfo.currentModel}</span>
            </div>
          )}
          {controlInfo.permissionMode && (
            <div className="info-row">
              <span className="info-label">Permission Mode:</span>
              <span>{controlInfo.permissionMode}</span>
            </div>
          )}
          {controlInfo.outputStyle && (
            <div className="info-row">
              <span className="info-label">Output Style:</span>
              <span>{controlInfo.outputStyle}</span>
            </div>
          )}
        </div>
      )}
      <style>{`
        .session-info-panel {
          border-bottom: 1px solid #3e3e42;
        }
        .session-info-toggle {
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
        .session-info-toggle:hover {
          background: #3e3e42;
        }
        .session-info-details {
          padding: 4px 12px;
          background: #252526;
          font-size: 12px;
          color: #d4d4d4;
        }
        .info-row {
          display: flex;
          gap: 8px;
          padding: 2px 0;
        }
        .info-label {
          color: #9e9e9e;
          min-width: 100px;
        }
      `}</style>
    </div>
  );
}
