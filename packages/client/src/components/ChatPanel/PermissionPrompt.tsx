interface PermissionPromptProps {
  toolName: string;
  description: string;
  onAllow: () => void;
  onDeny: () => void;
  onAlwaysAllow: () => void;
}

export function PermissionPrompt({
  toolName,
  description,
  onAllow,
  onDeny,
  onAlwaysAllow,
}: PermissionPromptProps) {
  return (
    <div className="permission-prompt" data-testid="permission-prompt">
      <div className="permission-header">Tool Permission Request</div>
      <div className="permission-body">
        <div className="permission-tool">
          Claude wants to use: <strong>{toolName}</strong>
        </div>
        {description && (
          <div className="permission-description">{description}</div>
        )}
      </div>
      <div className="permission-actions">
        <button
          onClick={onAllow}
          className="permission-btn permission-btn-allow"
          aria-label="Allow"
        >
          Allow
        </button>
        <button
          onClick={onDeny}
          className="permission-btn permission-btn-deny"
          aria-label="Deny"
        >
          Deny
        </button>
        <button
          onClick={onAlwaysAllow}
          className="permission-btn permission-btn-always"
          aria-label="Always Allow"
        >
          Always Allow
        </button>
      </div>

      <style>{`
        .permission-prompt {
          margin: 8px 12px;
          padding: 12px;
          background: #2d2d30;
          border: 1px solid #007acc;
          border-radius: 8px;
        }
        .permission-header {
          font-size: 13px;
          font-weight: 600;
          color: #007acc;
          margin-bottom: 8px;
        }
        .permission-tool {
          font-size: 13px;
          color: #d4d4d4;
          margin-bottom: 4px;
        }
        .permission-description {
          font-size: 12px;
          color: #9e9e9e;
          margin-bottom: 8px;
        }
        .permission-actions {
          display: flex;
          gap: 8px;
        }
        .permission-btn {
          padding: 4px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        .permission-btn-allow {
          background: #007acc;
          color: #fff;
        }
        .permission-btn-deny {
          background: #3e3e42;
          color: #d4d4d4;
        }
        .permission-btn-always {
          background: #388e3c;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
