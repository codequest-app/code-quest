import { type KeyboardEvent, useCallback, useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

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
    <div className="flex gap-2 px-4 py-3 border-t border-[#333]">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type a message..."
        rows={2}
        className="flex-1 bg-[#2a2a2a] text-[#e0e0e0] border border-[#444] rounded-md px-3 py-2 text-sm font-[inherit] resize-none focus:outline-none focus:border-[#4a9eff] disabled:opacity-50"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled}
        className="bg-[#4a9eff] text-white border-none rounded-md px-4 py-2 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  );
}
