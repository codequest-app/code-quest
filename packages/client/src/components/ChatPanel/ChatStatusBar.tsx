import { useChatStore } from '../../stores/chatStore';
import { ModelSelector } from './ModelSelector';
import { OutputStyleSelector } from './OutputStyleSelector';
import { PermissionModeSelector } from './PermissionModeSelector';
import { ThinkingTokensInput } from './ThinkingTokensInput';

interface ChatStatusBarProps {
  sessionId: string;
  isProcessing?: boolean;
  onModelChange?: (model: string) => void;
  onStyleChange?: (style: string) => void;
  onModeChange?: (mode: string) => void;
  onInterrupt?: () => void;
  onTokensChange?: (tokens: number) => void;
}

export function ChatStatusBar({
  sessionId,
  isProcessing,
  onModelChange,
  onStyleChange,
  onModeChange,
  onInterrupt,
  onTokensChange,
}: ChatStatusBarProps) {
  const session = useChatStore((state) => state.getChatSession(sessionId));
  const controlInfo = session?.controlInfo;

  if (!controlInfo) {
    return null;
  }

  return (
    <div className="chat-status-bar" data-testid="chat-status-bar">
      <div className="status-left">
        {controlInfo.account && (
          <span className="status-item" data-testid="status-account">
            {controlInfo.account.email}
          </span>
        )}
        {controlInfo.currentModel && (
          <span className="status-item" data-testid="status-model">
            {controlInfo.currentModel}
          </span>
        )}
        {controlInfo.pid !== undefined && (
          <span className="status-item" data-testid="status-pid">
            PID: {controlInfo.pid}
          </span>
        )}
        {isProcessing && (
          <button
            type="button"
            className="interrupt-btn"
            data-testid="interrupt-button"
            onClick={onInterrupt}
          >
            Interrupt
          </button>
        )}
      </div>
      <div className="status-right">
        {controlInfo.permissionMode !== undefined && (
          <PermissionModeSelector
            currentMode={controlInfo.permissionMode}
            onModeChange={onModeChange}
          />
        )}
        {controlInfo.maxThinkingTokens !== undefined && (
          <ThinkingTokensInput
            currentTokens={controlInfo.maxThinkingTokens}
            onTokensChange={onTokensChange}
          />
        )}
        <ModelSelector
          models={controlInfo.models}
          currentModel={controlInfo.currentModel}
          onModelChange={onModelChange}
        />
        <OutputStyleSelector
          availableStyles={controlInfo.availableOutputStyles}
          currentStyle={controlInfo.outputStyle}
          onStyleChange={onStyleChange}
        />
      </div>

      <style>{`
        .chat-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 12px;
          background: #007acc;
          color: #fff;
          font-size: 12px;
          min-height: 22px;
        }
        .status-left {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .status-right {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .status-item {
          white-space: nowrap;
        }
        .interrupt-btn {
          background: #ff4444;
          color: #fff;
          border: none;
          border-radius: 3px;
          padding: 2px 8px;
          font-size: 11px;
          cursor: pointer;
        }
        .interrupt-btn:hover {
          background: #cc3333;
        }
      `}</style>
    </div>
  );
}
