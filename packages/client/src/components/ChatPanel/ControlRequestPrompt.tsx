interface PermissionSuggestion {
  type: string;
  mode?: string;
  directories?: string[];
  destination?: string;
}

interface ControlRequestItem {
  requestId: string;
  subtype: string;
  toolName?: string;
  input?: unknown;
  callbackId?: string;
  toolUseId?: string;
}

interface ControlRequestPromptProps {
  requests: ControlRequestItem[];
  onRespondAll: (response: Record<string, unknown>) => void;
  onDismiss: () => void;
}

function getInputField(input: unknown, field: string): unknown {
  if (input && typeof input === 'object' && field in input) {
    return (input as Record<string, unknown>)[field];
  }
  return undefined;
}

function formatInput(input: unknown): string {
  if (!input) return '';
  return JSON.stringify(input).slice(0, 200);
}

export function ControlRequestPrompt({
  requests,
  onRespondAll,
  onDismiss,
}: ControlRequestPromptProps) {
  if (requests.length === 0) return null;

  const first = requests[0];
  const isHookCallback = first.subtype === 'hook_callback';
  const toolName =
    first.toolName ?? (getInputField(first.input, 'tool_name') as string | undefined);
  const headerText = isHookCallback ? 'Hook Callback' : 'Control Request';

  const allowResponse = isHookCallback ? { decision: 'approve' } : { behavior: 'allow' };
  const denyResponse = isHookCallback
    ? { decision: 'deny' }
    : { behavior: 'deny', message: 'User denied this action' };

  const decisionReason = getInputField(first.input, 'decision_reason') as string | undefined;
  const permissionSuggestions = getInputField(first.input, 'permission_suggestions') as
    | PermissionSuggestion[]
    | undefined;
  const hookEventName = getInputField(first.input, 'hook_event_name') as string | undefined;

  const handleAllowAll = () => {
    onRespondAll(allowResponse);
  };

  const handleDenyAll = () => {
    onRespondAll(denyResponse);
    onDismiss();
  };

  const handleSuggestion = (suggestion: PermissionSuggestion) => {
    onRespondAll({ behavior: 'allow', ...suggestion });
  };

  return (
    <div className="control-request-prompt" data-testid="control-request-prompt">
      <div className="control-request-header" data-testid="control-request-header">
        {headerText}
      </div>
      <div className="control-request-body">
        <div className="control-request-subtype" data-testid="control-request-subtype">
          Type: <strong>{first.subtype}</strong>
        </div>
        {toolName && (
          <div className="control-request-tool" data-testid="control-request-tool">
            Tool: <strong>{toolName}</strong>
          </div>
        )}
        {isHookCallback && hookEventName && (
          <div className="control-request-hook-event" data-testid="control-request-hook-event">
            Event: <strong>{hookEventName}</strong>
          </div>
        )}
        {decisionReason && (
          <div className="control-request-reason" data-testid="control-request-reason">
            {decisionReason}
          </div>
        )}
        <div className="control-request-details" data-testid="control-request-details">
          {requests.map((req, idx) => (
            <div key={req.requestId} className="control-request-detail-item">
              <span className="control-request-detail-index">{idx + 1}.</span>
              <span className="control-request-detail-input">{formatInput(req.input)}</span>
            </div>
          ))}
        </div>
      </div>
      {permissionSuggestions && permissionSuggestions.length > 0 && (
        <div className="control-request-suggestions" data-testid="control-request-suggestions">
          {permissionSuggestions.map((suggestion, idx) => {
            const label =
              suggestion.type === 'setMode'
                ? `Switch to ${suggestion.mode}`
                : suggestion.type === 'addDirectories'
                  ? `Allow ${suggestion.directories?.join(', ')}`
                  : suggestion.type;
            return (
              <button
                key={`${suggestion.type}-${idx}`}
                type="button"
                className="control-btn control-btn-suggestion"
                data-testid={`suggestion-${idx}`}
                onClick={() => handleSuggestion(suggestion)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      <div className="control-request-actions">
        <button
          type="button"
          className="control-btn control-btn-allow"
          aria-label="Allow"
          data-testid="control-btn-allow"
          onClick={handleAllowAll}
        >
          Allow
        </button>
        <button
          type="button"
          className="control-btn control-btn-deny"
          aria-label="Deny"
          data-testid="control-btn-deny"
          onClick={handleDenyAll}
        >
          Deny
        </button>
      </div>

      <style>{`
        .control-request-prompt {
          margin: 8px 12px;
          padding: 12px;
          background: #2d2d30;
          border: 1px solid #007acc;
          border-radius: 8px;
        }
        .control-request-header {
          font-size: 13px;
          font-weight: 600;
          color: #007acc;
          margin-bottom: 8px;
        }
        .control-request-subtype,
        .control-request-tool,
        .control-request-hook-event {
          font-size: 13px;
          color: #d4d4d4;
          margin-bottom: 4px;
        }
        .control-request-input,
        .control-request-reason {
          font-size: 12px;
          color: #9e9e9e;
          margin-bottom: 8px;
          word-break: break-all;
        }
        .control-request-details {
          margin: 8px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .control-request-detail-item {
          display: flex;
          gap: 6px;
          font-size: 12px;
          color: #9e9e9e;
          word-break: break-all;
        }
        .control-request-detail-index {
          color: #d4d4d4;
          flex-shrink: 0;
        }
        .control-request-suggestions {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .control-request-actions {
          display: flex;
          gap: 8px;
        }
        .control-btn {
          padding: 4px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        .control-btn-allow {
          background: #007acc;
          color: #fff;
        }
        .control-btn-deny {
          background: #3e3e42;
          color: #d4d4d4;
        }
        .control-btn-suggestion {
          background: #0e639c;
          color: #fff;
        }
        .control-btn-suggestion:hover {
          background: #1177bb;
        }
      `}</style>
    </div>
  );
}
