import { type KeyboardEvent, useRef, useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onAbort: () => void;
  isProcessing: boolean;
  disabled?: boolean;
  onSlashTyped?: () => void;
}

export function ChatInput({
  onSend,
  onAbort,
  isProcessing,
  disabled,
  onSlashTyped,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isProcessing) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input" data-testid="chat-input">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          const newValue = e.target.value;
          if (newValue === '/' && value === '' && onSlashTyped) {
            onSlashTyped();
          }
          setValue(newValue);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled || isProcessing}
        rows={1}
        aria-label="Message input"
      />
      {isProcessing ? (
        <button type="button" onClick={onAbort} className="abort-button" aria-label="Stop">
          Stop
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="send-button"
          aria-label="Send"
        >
          Send
        </button>
      )}

      <style>{`
        .chat-input {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid #3e3e42;
          background: #2d2d30;
        }
        .chat-input textarea {
          flex: 1;
          resize: none;
          padding: 8px 12px;
          background: #1e1e1e;
          border: 1px solid #3e3e42;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          outline: none;
        }
        .chat-input textarea:focus {
          border-color: #007acc;
        }
        .chat-input textarea:disabled {
          opacity: 0.5;
        }
        .send-button, .abort-button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
        }
        .send-button {
          background: #007acc;
          color: #fff;
        }
        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .abort-button {
          background: #d32f2f;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
