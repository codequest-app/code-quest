import { type KeyboardEvent, useCallback, useRef, useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  onStop?: () => void;
  isProcessing?: boolean;
}

const btnBase =
  'px-4 py-1.5 text-white rounded-lg text-sm font-medium shrink-0 cursor-pointer transition-all hover:-translate-y-px active:translate-y-0';

export function ChatInput({ onSend, disabled, onStop, isProcessing }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = disabled || isProcessing;

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: wrapper delegates focus to textarea
    <div
      className={`rounded-xl bg-bg border transition-all ${
        focused ? 'border-accent glow-accent-ring' : 'border-border'
      }`}
      onClick={() => textareaRef.current?.focus()}
      onKeyDown={() => {}}
      role="presentation"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={isDisabled}
        placeholder="Type a message..."
        rows={3}
        className="w-full bg-transparent text-text px-4 pt-3 pb-1 text-sm resize-none focus:outline-none disabled:opacity-50 placeholder:text-text-muted"
      />
      <div className="flex justify-end px-3 pb-3">
        {isProcessing ? (
          <button type="button" onClick={onStop} className={`${btnBase} bg-danger`}>
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={isDisabled}
            className={`${btnBase} bg-accent hover:glow-accent-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none`}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
