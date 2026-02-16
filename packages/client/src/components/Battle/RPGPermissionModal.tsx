import type { TrapRiskLevel } from '@code-quest/shared';

interface RPGPermissionModalProps {
  toolName: string;
  description: string;
  riskLevel: TrapRiskLevel;
  onAllow: () => void;
  onDeny: () => void;
}

const RISK_LABELS: Record<TrapRiskLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

const RISK_COLORS: Record<TrapRiskLevel, string> = {
  low: '#66bb6a',
  medium: '#fdd835',
  high: '#ef5350',
};

export function RPGPermissionModal({
  toolName,
  description,
  riskLevel,
  onAllow,
  onDeny,
}: RPGPermissionModalProps) {
  return (
    <div className="rpg-permission-modal" data-testid="rpg-permission-modal">
      <div className="trap-header">罠を発見！</div>
      <div className="trap-tool">{toolName}</div>
      <div className="trap-description">{description}</div>
      <div
        className="trap-risk"
        data-testid="risk-indicator"
        style={{ color: RISK_COLORS[riskLevel] }}
      >
        危険度: {RISK_LABELS[riskLevel]}
      </div>
      <div className="trap-actions">
        <button
          type="button"
          className="trap-btn allow"
          data-testid="allow-button"
          onClick={onAllow}
        >
          許可する
        </button>
        <button type="button" className="trap-btn deny" data-testid="deny-button" onClick={onDeny}>
          拒否する
        </button>
      </div>

      <style>{`
        .rpg-permission-modal {
          position: absolute;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          min-width: 300px;
          background: #1a1a2e;
          border: 2px solid #ef5350;
          border-radius: 4px;
          padding: 16px;
          font-family: 'Courier New', monospace;
          color: #fff;
          z-index: 20;
        }

        .trap-header {
          font-size: 20px;
          font-weight: bold;
          color: #ef5350;
          margin-bottom: 12px;
        }

        .trap-tool {
          font-size: 16px;
          color: #ffd54f;
          margin-bottom: 4px;
        }

        .trap-description {
          font-size: 13px;
          color: #ccc;
          margin-bottom: 8px;
        }

        .trap-risk {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 12px;
        }

        .trap-actions {
          display: flex;
          gap: 12px;
        }

        .trap-btn {
          flex: 1;
          padding: 8px 16px;
          border: 2px solid;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          cursor: pointer;
          background: transparent;
        }

        .trap-btn.allow {
          border-color: #66bb6a;
          color: #66bb6a;
        }

        .trap-btn.deny {
          border-color: #ef5350;
          color: #ef5350;
        }

        .trap-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
