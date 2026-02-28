import { useEffect, useRef } from 'react';
import type { Message } from '../types/ui';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin" data-testid="message-list">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center select-none gap-3">
          <span className="text-4xl text-assistant">✦</span>
          <span className="text-lg font-medium text-text-bright">CC Office</span>
          <span className="text-sm text-text-muted">How can I help you today?</span>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-6 py-4">
          {messages.map((msg, i) => {
            const prevRole = i > 0 ? messages[i - 1].role : null;
            const showAvatar = msg.role !== prevRole;
            return (
              <div
                key={msg.id}
                className={showAvatar && i > 0 ? 'pt-6 border-t border-border/30 mt-6' : 'mt-1'}
              >
                <ChatMessage message={msg} showAvatar={showAvatar} />
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
