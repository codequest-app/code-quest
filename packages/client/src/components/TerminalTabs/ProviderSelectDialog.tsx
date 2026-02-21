import type { ChatProvider } from '@code-quest/shared';
import type { KeyboardEvent } from 'react';
import { useEffect, useRef } from 'react';

interface ProviderSelectDialogProps {
  onSelect: (provider: ChatProvider) => void;
  onClose: () => void;
}

export function ProviderSelectDialog({ onSelect, onClose }: ProviderSelectDialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      role="dialog"
      className="provider-select-dialog"
      data-testid="provider-select-dialog"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="provider-select-title">Select Orchestrator Provider</div>
      <div className="provider-select-options">
        <button type="button" className="provider-select-btn" onClick={() => onSelect('claude')}>
          Claude
        </button>
        <button type="button" className="provider-select-btn" onClick={() => onSelect('gemini')}>
          Gemini
        </button>
      </div>
      <style>{`
        .provider-select-dialog {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #2d2d30;
          border: 1px solid #3e3e42;
          border-radius: 8px;
          padding: 16px;
          z-index: 50;
          min-width: 220px;
          outline: none;
        }
        .provider-select-title {
          color: #fff;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 12px;
          text-align: center;
        }
        .provider-select-options {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        .provider-select-btn {
          padding: 8px 20px;
          background: #007acc;
          border: none;
          border-radius: 4px;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
        }
        .provider-select-btn:hover {
          background: #0098ff;
        }
      `}</style>
    </div>
  );
}
