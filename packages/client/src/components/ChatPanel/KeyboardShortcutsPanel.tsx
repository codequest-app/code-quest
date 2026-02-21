import type { KeyboardEvent } from 'react';
import { useEffect, useRef } from 'react';

interface KeyboardShortcutsPanelProps {
  onClose: () => void;
}

const shortcuts = [
  { key: 'Ctrl+T', description: 'New terminal' },
  { key: 'Ctrl+W', description: 'Close active session' },
  { key: 'Ctrl+B', description: 'Toggle bank panel' },
  { key: 'Tab', description: 'Toggle command menu' },
  { key: 'Enter', description: 'Send message' },
  { key: 'Shift+Enter', description: 'New line in message' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Escape', description: 'Close panel' },
];

export function KeyboardShortcutsPanel({ onClose }: KeyboardShortcutsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      className="keyboard-shortcuts-panel"
      data-testid="keyboard-shortcuts-panel"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="shortcuts-header">
        <span>Keyboard Shortcuts</span>
        <button
          type="button"
          className="shortcuts-close"
          data-testid="shortcuts-close-button"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="shortcuts-list">
        {shortcuts.map((s) => (
          <div key={s.key} className="shortcut-item">
            <kbd>{s.key}</kbd>
            <span>{s.description}</span>
          </div>
        ))}
      </div>
      <style>{`
        .keyboard-shortcuts-panel {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #2d2d30;
          border: 1px solid #3e3e42;
          border-radius: 8px;
          padding: 16px;
          z-index: 50;
          min-width: 280px;
          outline: none;
        }
        .shortcuts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          color: #fff;
          font-size: 14px;
          font-weight: bold;
        }
        .shortcuts-close {
          background: none;
          border: none;
          color: #d4d4d4;
          font-size: 18px;
          cursor: pointer;
        }
        .shortcuts-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .shortcut-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          color: #d4d4d4;
          font-size: 12px;
        }
        .shortcut-item kbd {
          background: #1e1e1e;
          border: 1px solid #555;
          border-radius: 3px;
          padding: 2px 6px;
          font-family: monospace;
          font-size: 11px;
          min-width: 80px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
